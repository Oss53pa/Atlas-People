// Edge Function : generate-hr-document (CDC Complément §4)
// Génère un document RH officiel (attestation, certificat, lettre…) pour un employé.
//
// Sécurité : re-vérifie tenant + rôle RH même si service_role bypass RLS.
// Idempotence : même idempotencyKey → rejoue le résultat sans ré-écrire.
// Audit : chaîne SHA-256 dans audit_log.
//
// Déploiement : supabase functions deploy generate-hr-document
import { CORS, json } from '../_shared/cors.ts';
import { resolveCaller, serviceClient, isHrOrAdmin } from '../_shared/supabase.ts';
import { appendAuditEntry, checkIdempotency, saveIdempotency } from '../_shared/audit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    // 1. Auth
    const caller = await resolveCaller(req);
    if (!caller) return json({ error: { code: 'UNAUTHENTICATED', message: 'Non authentifié' } }, 401);
    if (!isHrOrAdmin(caller)) return json({ error: { code: 'RLS_DENIED', message: 'Rôle RH/admin requis' } }, 403);

    const body = await req.json() as { docType?: string; employeeId?: string; idempotencyKey?: string; purpose?: string };
    const { docType, employeeId, idempotencyKey, purpose } = body;
    if (!docType || !employeeId || !idempotencyKey) {
      return json({ error: { code: 'VALIDATION_ERROR', message: 'docType, employeeId, idempotencyKey requis' } }, 400);
    }

    const svc = serviceClient();

    // 2. Re-vérification scope : l'employé doit appartenir au même tenant
    const { data: emp } = await svc
      .from('employees').select('id')
      .eq('id', employeeId).eq('tenant_id', caller.tenantId)
      .maybeSingle();
    if (!emp) return json({ error: { code: 'SCOPE_DENIED', message: 'Employé hors périmètre' } }, 403);

    // 3. Idempotence
    const cached = await checkIdempotency(svc, caller.tenantId, idempotencyKey);
    if (cached) return new Response(JSON.stringify(cached), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json', 'X-Idempotent-Replay': 'true' } });

    // 4. Écriture
    const docId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error: insErr } = await svc.from('m4_generated_documents').insert({
      id: docId,
      tenant_id: caller.tenantId,
      document_number: `DOC-${docId.slice(0, 8).toUpperCase()}`,
      employee_id: employeeId,
      category: docType,
      purpose: purpose ?? docType,
      generation_method: 'automatic',
      generated_at: now,
      generated_by: caller.userId,
      revoked: false,
    });
    if (insErr) return json({ error: { code: 'WRITE_ERROR', message: insErr.message } }, 500);

    // 5. Audit (identifiants techniques uniquement — pas de nom, pas de montant)
    await appendAuditEntry(svc, {
      tenantId: caller.tenantId,
      actorId: caller.userId,
      action: 'document.generate',
      entity: 'm4_generated_documents',
      entityId: docId,
      payload: { docType, employeeId, docId },
    });

    // 6. Idempotency
    const result = { docId, docType, employeeId, generatedAt: now };
    await saveIdempotency(svc, caller.tenantId, idempotencyKey, 'generate-hr-document', result);

    return json(result, 201);
  } catch (e) {
    return json({ error: { code: 'INTERNAL', message: e instanceof Error ? e.message : String(e) } }, 500);
  }
});
