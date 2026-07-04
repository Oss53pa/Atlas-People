// Edge Function : finalize-payroll-cycle (CDC Complément §4)
// Clôture définitivement un cycle de paie : statut → 'finalized', final_hash calculé.
//
// Invariant : un cycle finalisé ne peut plus être modifié (re-write → refus).
// Sécurité : re-vérifie que le cycle appartient au tenant de la session.
// Audit : chaîne SHA-256 dans audit_log + payroll_audit_log si disponible.
//
// Déploiement : supabase functions deploy finalize-payroll-cycle
import { CORS, json } from '../_shared/cors.ts';
import { resolveCaller, serviceClient, isHrOrAdmin } from '../_shared/supabase.ts';
import { appendAuditEntry, checkIdempotency, saveIdempotency, chainHash, GENESIS_HASH } from '../_shared/audit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    // 1. Auth
    const caller = await resolveCaller(req);
    if (!caller) return json({ error: { code: 'UNAUTHENTICATED', message: 'Non authentifié' } }, 401);
    if (!isHrOrAdmin(caller)) return json({ error: { code: 'RLS_DENIED', message: 'Rôle paie/admin requis' } }, 403);

    const body = await req.json() as { cycleId?: string; idempotencyKey?: string };
    const { cycleId, idempotencyKey } = body;
    if (!cycleId || !idempotencyKey) {
      return json({ error: { code: 'VALIDATION_ERROR', message: 'cycleId, idempotencyKey requis' } }, 400);
    }

    const svc = serviceClient();

    // 2. Idempotence
    const cached = await checkIdempotency(svc, caller.tenantId, idempotencyKey);
    if (cached) return new Response(JSON.stringify(cached), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json', 'X-Idempotent-Replay': 'true' } });

    // 3. Re-vérification scope : le cycle doit appartenir au tenant
    const { data: cycle } = await svc
      .from('payroll_cycles').select('id, tenant_id, status, period, total_brut, total_net, total_cotisations')
      .eq('id', cycleId).eq('tenant_id', caller.tenantId)
      .maybeSingle();
    if (!cycle) return json({ error: { code: 'SCOPE_DENIED', message: 'Cycle introuvable ou hors périmètre' } }, 403);

    // Invariant : refus si déjà finalisé
    if (cycle.status === 'finalized') {
      return json({ error: { code: 'NO_ROWS_AFFECTED', message: 'Ce cycle est déjà finalisé — écriture re-tentée refusée' } }, 409);
    }

    // 4. Calcul du final_hash à partir des agrégats du cycle
    const now = new Date().toISOString();
    const cycleFingerprint = { cycleId, period: cycle.period, totalBrut: cycle.total_brut, totalNet: cycle.total_net, closedAt: now };
    const finalHash = await chainHash(GENESIS_HASH, cycleFingerprint);

    // 5. Mise à jour (UPDATE 0 rows → erreur)
    const { error: upErr, count } = await svc
      .from('payroll_cycles')
      .update({ status: 'finalized', closed_at: now, closed_by: caller.userId, final_hash: finalHash })
      .eq('id', cycleId)
      .eq('tenant_id', caller.tenantId)
      .neq('status', 'finalized');
    if (upErr) return json({ error: { code: 'WRITE_ERROR', message: upErr.message } }, 500);
    if ((count ?? 0) === 0) return json({ error: { code: 'NO_ROWS_AFFECTED', message: 'Aucune ligne mise à jour — cycle déjà finalisé ?' } }, 409);

    // 6. Audit
    await appendAuditEntry(svc, {
      tenantId: caller.tenantId,
      actorId: caller.userId,
      action: 'payroll_cycle.finalize',
      entity: 'payroll_cycles',
      entityId: cycleId,
      payload: { cycleId, finalHash },
    });

    // 7. Idempotency
    const result = { cycleId, status: 'finalized', finalHash, closedAt: now };
    await saveIdempotency(svc, caller.tenantId, idempotencyKey, 'finalize-payroll-cycle', result);

    return json(result, 200);
  } catch (e) {
    return json({ error: { code: 'INTERNAL', message: e instanceof Error ? e.message : String(e) } }, 500);
  }
});
