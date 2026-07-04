// Edge Function : commit-bonus-decision (CDC Complément §4)
// Valide les décisions de bonus d'une campagne : met à jour bonus_calculs +
// clôture l'enveloppe correspondante.
//
// Sécurité : re-vérifie tenant + rôle RH ; chaque allocation doit appartenir au tenant.
// Audit : chaîne SHA-256 dans audit_log (identifiants techniques — pas de montants en clair).
//
// Déploiement : supabase functions deploy commit-bonus-decision
import { CORS, json } from '../_shared/cors.ts';
import { resolveCaller, serviceClient, isHrOrAdmin } from '../_shared/supabase.ts';
import { appendAuditEntry, checkIdempotency, saveIdempotency } from '../_shared/audit.ts';

interface Allocation {
  employeeId: string;
  enveloppeId: string;
  finalAmount: number;  // montant en unités mineures (bigint)
  currency: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    // 1. Auth
    const caller = await resolveCaller(req);
    if (!caller) return json({ error: { code: 'UNAUTHENTICATED', message: 'Non authentifié' } }, 401);
    if (!isHrOrAdmin(caller)) return json({ error: { code: 'RLS_DENIED', message: 'Rôle RH/admin requis' } }, 403);

    const body = await req.json() as { campaignId?: string; allocations?: Allocation[]; idempotencyKey?: string };
    const { campaignId, allocations, idempotencyKey } = body;
    if (!campaignId || !allocations || !Array.isArray(allocations) || allocations.length === 0 || !idempotencyKey) {
      return json({ error: { code: 'VALIDATION_ERROR', message: 'campaignId, allocations[] non vide, idempotencyKey requis' } }, 400);
    }

    const svc = serviceClient();

    // 2. Idempotence
    const cached = await checkIdempotency(svc, caller.tenantId, idempotencyKey);
    if (cached) return new Response(JSON.stringify(cached), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json', 'X-Idempotent-Replay': 'true' } });

    const now = new Date().toISOString();
    const committed: string[] = [];
    const errors: { employeeId: string; message: string }[] = [];

    for (const alloc of allocations) {
      if (!alloc.employeeId || !alloc.enveloppeId || alloc.finalAmount == null) {
        errors.push({ employeeId: alloc.employeeId ?? '?', message: 'employeeId, enveloppeId, finalAmount requis' });
        continue;
      }

      // 3. Re-vérification scope : l'enveloppe doit appartenir au tenant + campagne
      const { data: env } = await svc
        .from('bonus_enveloppes').select('id, statut')
        .eq('id', alloc.enveloppeId).eq('tenant_id', caller.tenantId).eq('campagne_id', campaignId)
        .maybeSingle();
      if (!env) {
        errors.push({ employeeId: alloc.employeeId, message: 'Enveloppe hors périmètre ou campagne incorrecte' });
        continue;
      }

      // 4. Mettre à jour le calcul bonus (upsert)
      const { error: calcErr } = await svc.from('bonus_calculs')
        .update({ final: alloc.finalAmount, devise: alloc.currency, statut: 'validé', validateur_id: caller.userId, validated_at: now })
        .eq('enveloppe_id', alloc.enveloppeId)
        .eq('employe_id', alloc.employeeId)
        .eq('tenant_id', caller.tenantId)
        .eq('campagne_id', campaignId);
      if (calcErr) {
        errors.push({ employeeId: alloc.employeeId, message: calcErr.message });
        continue;
      }

      committed.push(alloc.employeeId);
    }

    // 5. Clôture de l'enveloppe de campagne si toutes les allocations sont validées
    if (committed.length > 0 && errors.length === 0) {
      await svc.from('bonus_enveloppes')
        .update({ statut: 'validé', valide_par: caller.userId, valide_at: now })
        .eq('campagne_id', campaignId)
        .eq('tenant_id', caller.tenantId);
    }

    // 6. Audit (IDs techniques uniquement — pas de montants en clair dans le log)
    if (committed.length > 0) {
      await appendAuditEntry(svc, {
        tenantId: caller.tenantId,
        actorId: caller.userId,
        action: 'bonus.commit',
        entity: 'bonus_calculs',
        entityId: campaignId,
        payload: { campaignId, count: committed.length, employeeIds: committed },
      });
    }

    // 7. Idempotency
    const result = { campaignId, committed, errors, total: allocations.length };
    await saveIdempotency(svc, caller.tenantId, idempotencyKey, 'commit-bonus-decision', result);

    return json(result, committed.length > 0 ? 200 : 422);
  } catch (e) {
    return json({ error: { code: 'INTERNAL', message: e instanceof Error ? e.message : String(e) } }, 500);
  }
});
