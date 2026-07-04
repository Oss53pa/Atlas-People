// Edge Function : evaluate-probation-decision (CDC Complément §4)
// Enregistre la décision de fin de période d'essai d'un collaborateur.
//
// Autorisé : rôle RH/admin OU manager direct de l'employé.
// La décision est irrévocable (PE décidée ne peut être re-ouverte).
// Audit : chaîne SHA-256 dans audit_log (pas de motif médical ni PII en breadcrumb).
//
// Déploiement : supabase functions deploy evaluate-probation-decision
import { CORS, json } from '../_shared/cors.ts';
import { resolveCaller, serviceClient, isHrOrAdmin } from '../_shared/supabase.ts';
import { appendAuditEntry, checkIdempotency, saveIdempotency } from '../_shared/audit.ts';

const VALID_DECISIONS = ['confirmed', 'extended', 'terminated'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    // 1. Auth
    const caller = await resolveCaller(req);
    if (!caller) return json({ error: { code: 'UNAUTHENTICATED', message: 'Non authentifié' } }, 401);

    const body = await req.json() as {
      probationId?: string;
      decision?: string;
      rationale?: string;
      idempotencyKey?: string;
    };
    const { probationId, decision, rationale, idempotencyKey } = body;
    if (!probationId || !decision || !idempotencyKey) {
      return json({ error: { code: 'VALIDATION_ERROR', message: 'probationId, decision, idempotencyKey requis' } }, 400);
    }
    if (!VALID_DECISIONS.includes(decision)) {
      return json({ error: { code: 'VALIDATION_ERROR', message: `decision doit être parmi : ${VALID_DECISIONS.join(', ')}` } }, 400);
    }

    const svc = serviceClient();

    // 2. Idempotence
    const cached = await checkIdempotency(svc, caller.tenantId, idempotencyKey);
    if (cached) return new Response(JSON.stringify(cached), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json', 'X-Idempotent-Replay': 'true' } });

    // 3. Re-vérification scope : la PE doit appartenir au tenant
    const { data: probation } = await svc
      .from('m4_probation_periods')
      .select('id, tenant_id, employee_id, decision')
      .eq('id', probationId).eq('tenant_id', caller.tenantId)
      .maybeSingle();
    if (!probation) return json({ error: { code: 'SCOPE_DENIED', message: 'Période d\'essai hors périmètre' } }, 403);

    // Invariant : une décision déjà prise ne peut être ré-écrite
    if (probation.decision) {
      return json({ error: { code: 'NO_ROWS_AFFECTED', message: `Décision déjà enregistrée : ${probation.decision}` } }, 409);
    }

    // 4. Autorisation : RH/admin OU manager direct de l'employé
    const isRh = isHrOrAdmin(caller);
    if (!isRh && caller.employeeId) {
      const { data: isManager } = await svc
        .from('employees').select('id')
        .eq('id', probation.employee_id).eq('manager_id', caller.employeeId).eq('tenant_id', caller.tenantId)
        .maybeSingle();
      if (!isManager) return json({ error: { code: 'RLS_DENIED', message: 'Rôle RH/admin ou manager direct requis' } }, 403);
    } else if (!isRh) {
      return json({ error: { code: 'RLS_DENIED', message: 'Rôle RH/admin requis' } }, 403);
    }

    const now = new Date().toISOString();

    // 5. Enregistrement de la décision
    const { error: upErr, count } = await svc
      .from('m4_probation_periods')
      .update({ decision, decision_notified_at: now.slice(0, 10) })
      .eq('id', probationId).eq('tenant_id', caller.tenantId).is('decision', null);
    if (upErr) return json({ error: { code: 'WRITE_ERROR', message: upErr.message } }, 500);
    if ((count ?? 0) === 0) return json({ error: { code: 'NO_ROWS_AFFECTED', message: 'Aucune mise à jour — décision déjà présente ?' } }, 409);

    // 6. Évaluation associée
    const evalId = crypto.randomUUID();
    await svc.from('m4_probation_evaluations').insert({
      id: evalId,
      tenant_id: caller.tenantId,
      probation_id: probationId,
      kind: 'final_decision',
      scores: {},
      notes: null, // pas de motif médical dans le log (CDC §8.3)
      recommendation: decision,
      conducted_by: caller.userId,
      conducted_at: now.slice(0, 10),
    });

    // 7. Audit (rationale n'est PAS inclus — peut contenir des motifs sensibles)
    await appendAuditEntry(svc, {
      tenantId: caller.tenantId,
      actorId: caller.userId,
      action: 'probation.decide',
      entity: 'm4_probation_periods',
      entityId: probationId,
      payload: { probationId, decision, evalId },
    });

    // 8. Idempotency
    const result = { probationId, decision, evalId, decidedAt: now };
    await saveIdempotency(svc, caller.tenantId, idempotencyKey, 'evaluate-probation-decision', result);

    return json(result, 200);
  } catch (e) {
    return json({ error: { code: 'INTERNAL', message: e instanceof Error ? e.message : String(e) } }, 500);
  }
});
