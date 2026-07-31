// Edge Function : calculate-payroll-cycle (V6 — RPC atlas_people.calculate_bulletin unifiée)
// Lance le calcul de tous les bulletins d'un cycle de paie : appelle la RPC
// calculate_bulletin() pour chaque employé actif du tenant/pays du cycle — SEULE
// source de calcul (cf. migration 0055) —, persiste payroll_bulletins +
// payroll_bulletin_lines, journalise les anomalies (payroll_calculation_anomalies)
// et trace le run (payroll_calculation_runs). Ne clôture PAS le cycle
// (cf. finalize-payroll-cycle, phase suivante) : passe le cycle en 'validation'.
//
// Politique anomalies : un employé dont les DEUX implémentations internes de la
// RPC divergent (verification.ok=false) = bug moteur → aucun bulletin persisté,
// anomalie 'critical'. Un employé avec emissionBlocked=true (règle métier, ex.
// net sous SMIG) = bulletin quand même persisté en status='draft' (clôture
// partielle) ; les autres employés du cycle sont calculés normalement.
//
// Sécurité : réservé RH/admin. calculate_bulletin est SECURITY INVOKER : on
// utilise callerClient (RLS appliquée), jamais le service role, pour cette
// opération répétable.
//
// Déploiement : supabase functions deploy calculate-payroll-cycle
import { CORS, json } from '../_shared/cors.ts';
import { callerClient, resolveCaller, isHrOrAdmin } from '../_shared/supabase.ts';
import { chainHash, GENESIS_HASH, appendAuditEntry } from '../_shared/audit.ts';

type LineKind = 'earning' | 'employee_contribution' | 'tax' | 'deduction' | 'employer_contribution' | 'employer_tax';

const SECTION_BY_KIND: Record<LineKind, string> = {
  earning: 'gains',
  employee_contribution: 'cotisations',
  tax: 'cotisations',
  deduction: 'retenues',
  employer_contribution: 'patronal',
  employer_tax: 'patronal',
};

interface RpcLine {
  code: string;
  label: string;
  kind: LineKind;
  baseUnits?: number;
  rateBps?: number;
  amountUnits: number;
}

interface RpcAnomaly { severity: string; code: string; message: string; blocking: boolean }

interface RpcBulletin {
  brut_total: number; base_cnps: number; base_irpp: number;
  total_cotisations_emp: number; total_retenues: number; net_a_payer: number;
  total_cotisations_pat: number; cout_employeur: number;
}

interface RpcResult {
  currency: string;
  regimeVersion: string;
  lines: RpcLine[];
  bulletin: RpcBulletin;
  verification: { ok: boolean; discrepancies: Array<Record<string, unknown>> };
  anomalies: RpcAnomaly[];
  emissionBlocked: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const caller = await resolveCaller(req);
    if (!caller) return json({ status: 'error', message: 'Non authentifié' }, 401);
    if (!isHrOrAdmin(caller)) return json({ status: 'error', message: 'Réservé RH/admin' }, 403);

    const { cycleId } = await req.json();
    if (!cycleId) return json({ status: 'error', message: 'cycleId requis' }, 400);

    const supa = callerClient(req); // RLS appliquée (tenant + rôle)

    // 1) Cycle — scope tenant en défense en profondeur (RLS filtre déjà).
    const { data: cycle, error: cycleErr } = await supa
      .from('payroll_cycles').select('id, period, country_code, status')
      .eq('id', cycleId).eq('tenant_id', caller.tenantId).single();
    if (cycleErr || !cycle) return json({ status: 'error', message: 'Cycle introuvable ou hors périmètre' }, 404);
    if (cycle.status === 'closed' || cycle.status === 'archived') {
      return json({ status: 'error', message: 'Cycle déjà clôturé — recalcul interdit' }, 409);
    }

    // 2) Ouverture du run.
    const { data: run, error: runErr } = await supa.from('payroll_calculation_runs').insert({
      tenant_id: caller.tenantId, cycle_id: cycleId, status: 'running',
      started_at: new Date().toISOString(), launched_by: caller.userId,
    }).select('id').single();
    if (runErr || !run) return json({ status: 'error', message: runErr?.message ?? 'Échec ouverture du run' }, 500);

    // 3) Employés actifs du tenant/pays du cycle (headcount du run).
    const { data: employees, error: empErr } = await supa
      .from('employees').select('id')
      .eq('tenant_id', caller.tenantId).eq('status', 'active').eq('country_code', cycle.country_code)
      .order('id');
    if (empErr) return json({ status: 'error', message: empErr.message }, 400);
    const roster = employees ?? [];

    // 4) Ce run fait foi : les anomalies non résolues des runs précédents de ce
    // cycle sont closes avant d'écrire les nouvelles.
    await supa.from('payroll_calculation_anomalies')
      .update({ resolved: true })
      .eq('cycle_id', cycleId).eq('resolved', false);

    // 5) Chaîne de hash : reprend le dernier bulletin connu du tenant.
    const { data: lastBulletin } = await supa
      .from('payroll_bulletins').select('audit_hash')
      .eq('tenant_id', caller.tenantId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    let prevHash = (lastBulletin?.audit_hash as string | undefined) ?? GENESIS_HASH;

    let computed = 0;
    let seq = 0;
    let sumBrut = 0, sumNet = 0, sumCotisEmp = 0, sumCoutEmployeur = 0;
    const blocked: Array<{ employeeId: string; reasons: string[] }> = [];

    for (const emp of roster) {
      seq += 1;
      const { data: rpcData, error: rpcErr } = await supa.rpc('calculate_bulletin', {
        p_employee_id: emp.id, p_cycle_id: cycleId,
      });
      if (rpcErr || !rpcData) {
        blocked.push({ employeeId: emp.id, reasons: [rpcErr?.message ?? 'Échec RPC'] });
        await supa.from('payroll_calculation_anomalies').insert({
          tenant_id: caller.tenantId, cycle_id: cycleId, employee_id: emp.id,
          severity: 'critical', code: 'RPC_ERROR', message: rpcErr?.message ?? 'calculate_bulletin a échoué', blocking: true,
        });
        continue;
      }
      const result = rpcData as RpcResult;

      // Divergence entre les deux implémentations internes de la RPC = bug
      // moteur, pas une règle métier : on ne persiste aucun bulletin fondé sur
      // des chiffres non fiables.
      if (!result.verification.ok) {
        blocked.push({ employeeId: emp.id, reasons: ['ENGINE_DISCREPANCY'] });
        await supa.from('payroll_calculation_anomalies').insert({
          tenant_id: caller.tenantId, cycle_id: cycleId, employee_id: emp.id,
          severity: 'critical', code: 'ENGINE_DISCREPANCY',
          message: JSON.stringify(result.verification.discrepancies), blocking: true,
        });
        continue;
      }

      if (result.anomalies.length > 0) {
        await supa.from('payroll_calculation_anomalies').insert(
          result.anomalies.map((a) => ({
            tenant_id: caller.tenantId, cycle_id: cycleId, employee_id: emp.id,
            severity: a.severity, code: a.code, message: a.message, blocking: a.blocking,
          })),
        );
      }
      if (result.emissionBlocked) {
        blocked.push({ employeeId: emp.id, reasons: result.anomalies.filter((a) => a.blocking).map((a) => a.code) });
      }

      const numero = `${cycle.period}-${String(seq).padStart(4, '0')}`;
      const hash = await chainHash(prevHash, { employeeId: emp.id, cycleId, bulletin: result.bulletin, regimeVersion: result.regimeVersion });

      const { data: bulletinRow, error: bulErr } = await supa.from('payroll_bulletins').upsert({
        tenant_id: caller.tenantId, cycle_id: cycleId, employee_id: emp.id,
        numero, currency: result.currency,
        brut_total: result.bulletin.brut_total, base_cnps: result.bulletin.base_cnps, base_irpp: result.bulletin.base_irpp,
        total_cotisations_emp: result.bulletin.total_cotisations_emp, total_retenues: result.bulletin.total_retenues,
        net_a_payer: result.bulletin.net_a_payer, total_cotisations_pat: result.bulletin.total_cotisations_pat,
        cout_employeur: result.bulletin.cout_employeur,
        status: result.emissionBlocked ? 'draft' : 'calculated',
        prev_hash: prevHash, audit_hash: hash, calculated_at: new Date().toISOString(),
      }, { onConflict: 'cycle_id,employee_id' }).select('id').single();
      if (bulErr || !bulletinRow) {
        blocked.push({ employeeId: emp.id, reasons: [bulErr?.message ?? 'Échec écriture bulletin'] });
        continue;
      }
      prevHash = hash;

      await supa.from('payroll_bulletin_lines').delete().eq('bulletin_id', bulletinRow.id);
      if (result.lines.length > 0) {
        await supa.from('payroll_bulletin_lines').insert(
          result.lines.map((l, i) => ({
            tenant_id: caller.tenantId, bulletin_id: bulletinRow.id,
            rubrique_code: l.code, libelle: l.label, section: SECTION_BY_KIND[l.kind] ?? 'gains',
            base: l.baseUnits ?? null, taux: l.rateBps != null ? l.rateBps / 100 : null, montant: l.amountUnits,
            ordre: i,
          })),
        );
      }

      computed += 1;
      sumBrut += result.bulletin.brut_total;
      sumNet += result.bulletin.net_a_payer;
      sumCotisEmp += result.bulletin.total_cotisations_emp;
      sumCoutEmployeur += result.bulletin.cout_employeur;
    }

    // 6) Agrégats du cycle (masse salariale réelle, bulletins bloqués inclus) + phase.
    await supa.from('payroll_cycles').update({
      total_brut: sumBrut, total_net: sumNet, total_cotisations: sumCotisEmp, total_cout_employeur: sumCoutEmployeur,
      headcount: roster.length, current_phase: 'validation',
    }).eq('id', cycleId);

    // 7) Clôture du run.
    await supa.from('payroll_calculation_runs').update({
      status: 'completed', completed_at: new Date().toISOString(),
      total: roster.length, computed, anomalies: blocked.length,
    }).eq('id', run.id);

    await appendAuditEntry(supa, {
      tenantId: caller.tenantId, actorId: caller.userId, action: 'payroll_cycle.calculate',
      entity: 'payroll_cycles', entityId: cycleId,
      payload: { runId: run.id, total: roster.length, computed, blocked: blocked.length },
    });

    return json({
      status: 'completed', runId: run.id, total: roster.length, computed, blocked,
      totals: { brut: sumBrut, net: sumNet, cotisations: sumCotisEmp, coutEmployeur: sumCoutEmployeur },
    });
  } catch (e) {
    return json({ status: 'error', message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
