// Edge Function : compute-payslip (cahier §2.3, §3.3)
// Recalcule un bulletin de paie de manière AUTORITATIVE et DÉTERMINISTE côté
// serveur (jamais le LLM), vérifie le plancher SMIG (ComplianceGuard), chaîne le
// hash SHA-256, puis persiste le bulletin en `verified=false` (double contrôle).
//
// Sécurité : réservé RH/admin. Le calcul ne dépend QUE de la config régime-pays
// versionnée (legal_regimes), aucune valeur n'est inférée.
//
// Déploiement : supabase functions deploy compute-payslip
import { CORS, json } from '../_shared/cors.ts';
import { callerClient, resolveCaller, isHrOrAdmin } from '../_shared/supabase.ts';
import { computePayslip, checkSalaryFloor, type Regime } from '../_shared/payroll.ts';
import { chainHash, GENESIS_HASH } from '../_shared/audit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const caller = await resolveCaller(req);
    if (!caller) return json({ status: 'error', message: 'Non authentifié' }, 401);
    if (!isHrOrAdmin(caller)) return json({ status: 'error', message: 'Réservé RH/admin' }, 403);

    const { runId, employeeId } = await req.json();
    if (!runId || !employeeId) return json({ status: 'error', message: 'runId et employeeId requis' }, 400);

    const supa = callerClient(req); // RLS appliquée (tenant + rôle)

    // 1) Employé + assiettes (jamais inférées : lues telles quelles).
    const { data: emp, error: empErr } = await supa
      .from('employees')
      .select('id, tenant_id, country_code, legal_regime_id, base_salary, taxable_allowances, non_taxable_allowances, fiscal_parts')
      .eq('id', employeeId)
      .single();
    if (empErr || !emp) return json({ status: 'error', message: 'Employé introuvable' }, 404);

    // 2) Run de paie (cohérence tenant/période).
    const { data: run, error: runErr } = await supa
      .from('payroll_runs').select('id, tenant_id, period, country_code, status').eq('id', runId).single();
    if (runErr || !run) return json({ status: 'error', message: 'Run introuvable' }, 404);
    if (run.status === 'posted') return json({ status: 'error', message: 'Run déjà déversé — recalcul interdit' }, 409);

    // 3) Régime-pays versionné (config jsonb : contributions, barème, taxes).
    const regimeQuery = supa.from('legal_regimes').select('country_code, currency, version, config');
    const { data: regimeRow, error: regErr } = emp.legal_regime_id
      ? await regimeQuery.eq('id', emp.legal_regime_id).single()
      : await regimeQuery.eq('country_code', emp.country_code).order('effective_from', { ascending: false }).limit(1).single();
    if (regErr || !regimeRow) return json({ status: 'error', message: 'Régime-pays introuvable' }, 404);

    const cfg = regimeRow.config as Record<string, unknown>;
    const regime: Regime = {
      countryCode: regimeRow.country_code,
      currency: regimeRow.currency,
      version: regimeRow.version,
      contributions: (cfg.contributions ?? []) as Regime['contributions'],
      incomeTax: cfg.incomeTax as Regime['incomeTax'],
      employerTaxes: (cfg.employerTaxes ?? []) as Regime['employerTaxes'],
    };

    // 4) Plancher SMIG — bloque la paie si non conforme (ComplianceGuard).
    const floor = checkSalaryFloor(Number(emp.base_salary), emp.country_code);
    if (!floor.ok) return json({ status: 'blocked', rule: 'SALARY_FLOOR', message: floor.message }, 422);

    // 5) Calcul déterministe.
    const result = computePayslip({
      baseSalary: Number(emp.base_salary),
      taxableAllowances: Number(emp.taxable_allowances ?? 0),
      nonTaxableAllowances: Number(emp.non_taxable_allowances ?? 0),
      fiscalParts: Number(emp.fiscal_parts ?? 1),
    }, regime);

    // 6) Hash chaîné depuis le dernier bulletin du tenant.
    const { data: last } = await supa
      .from('payslips').select('hash').eq('tenant_id', emp.tenant_id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    const prevHash = last?.hash ?? GENESIS_HASH;
    const payloadForHash = {
      runId, employeeId, period: run.period, regimeVersion: result.regimeVersion,
      gross: result.grossTotalUnits, net: result.netToPayUnits, lines: result.lines,
    };
    const hash = await chainHash(prevHash, payloadForHash);

    // 7) Persistance — verified=false (le bulletin attend la double vérification).
    const { data: inserted, error: insErr } = await supa.from('payslips').insert({
      tenant_id: emp.tenant_id,
      run_id: runId,
      employee_id: employeeId,
      currency: result.currency,
      regime_version: result.regimeVersion,
      gross_total: BigInt(result.grossTotalUnits).toString(),
      employee_contributions: BigInt(result.totalEmployeeContributionUnits).toString(),
      income_tax: BigInt(result.incomeTaxUnits).toString(),
      net_to_pay: BigInt(result.netToPayUnits).toString(),
      employer_cost: BigInt(result.employerCostUnits).toString(),
      lines: result.lines,
      verified: false,
      prev_hash: prevHash,
      hash,
      status: 'draft',
    }).select('id').single();
    if (insErr) return json({ status: 'error', message: insErr.message }, 400);

    return json({
      status: 'computed',
      payslipId: inserted.id,
      compliance: floor.message,
      net: result.netToPayUnits,
      gross: result.grossTotalUnits,
      hash,
      note: 'Bulletin en brouillon — double vérification requise avant émission.',
    });
  } catch (e) {
    return json({ status: 'error', message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
