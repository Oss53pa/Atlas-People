// Edge Function : bulk-import-employees (CDC Complément §4)
// Importe un lot d'employés en base pour un tenant.
//
// Sécurité : re-vérifie tenant + rôle admin. Chaque ligne reçoit le tenant_id
// de la session (jamais du corps de la requête) — interdiction de cross-tenant.
// RÈGLE CARDINALE : aucune constante DEMO_* sur ce chemin d'écriture.
//
// Déploiement : supabase functions deploy bulk-import-employees
import { CORS, json } from '../_shared/cors.ts';
import { resolveCaller, serviceClient, isHrOrAdmin } from '../_shared/supabase.ts';
import { appendAuditEntry, checkIdempotency, saveIdempotency } from '../_shared/audit.ts';

interface EmployeeRow {
  first_name: string;
  last_name: string;
  email?: string;
  country_code: string;
  contract: string;
  status: string;
  role_title?: string;
  department?: string;
  hire_date?: string;
  base_salary: number;
  taxable_allowances?: number;
  non_taxable_allowances?: number;
  fiscal_parts?: number;
  dependent_children?: number;
  dependent_persons?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    // 1. Auth
    const caller = await resolveCaller(req);
    if (!caller) return json({ error: { code: 'UNAUTHENTICATED', message: 'Non authentifié' } }, 401);
    if (!isHrOrAdmin(caller)) return json({ error: { code: 'RLS_DENIED', message: 'Rôle RH/admin requis pour l\'import en masse' } }, 403);

    const body = await req.json() as { rows?: EmployeeRow[]; idempotencyKey?: string };
    const { rows, idempotencyKey } = body;
    if (!rows || !Array.isArray(rows) || rows.length === 0 || !idempotencyKey) {
      return json({ error: { code: 'VALIDATION_ERROR', message: 'rows[] non vide et idempotencyKey requis' } }, 400);
    }
    if (rows.length > 500) {
      return json({ error: { code: 'VALIDATION_ERROR', message: 'Maximum 500 lignes par appel' } }, 400);
    }

    const svc = serviceClient();

    // 2. Idempotence
    const cached = await checkIdempotency(svc, caller.tenantId, idempotencyKey);
    if (cached) return new Response(JSON.stringify(cached), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json', 'X-Idempotent-Replay': 'true' } });

    // 3. Import ligne par ligne avec collecte des erreurs
    const created: string[] = [];
    const errors: { index: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.first_name || !row.last_name || !row.country_code) {
        errors.push({ index: i, message: 'first_name, last_name, country_code obligatoires' });
        continue;
      }
      const empId = crypto.randomUUID();
      const { error } = await svc.from('employees').insert({
        id: empId,
        tenant_id: caller.tenantId, // tenant de la session, jamais de l'input
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email ?? null,
        country_code: row.country_code,
        contract: row.contract ?? 'cdi',
        status: row.status ?? 'active',
        role_title: row.role_title ?? null,
        department: row.department ?? null,
        hire_date: row.hire_date ?? null,
        base_salary: row.base_salary ?? 0,
        taxable_allowances: row.taxable_allowances ?? 0,
        non_taxable_allowances: row.non_taxable_allowances ?? 0,
        fiscal_parts: row.fiscal_parts ?? 1,
        dependent_children: row.dependent_children ?? 0,
        dependent_persons: row.dependent_persons ?? 0,
        lifecycle_status: 'active',
        modification_count: 0,
        created_by: caller.userId,
      });
      if (error) {
        errors.push({ index: i, message: error.message });
      } else {
        created.push(empId);
      }
    }

    // 4. Audit (un seul log de lot — pas de PII, que des IDs techniques)
    if (created.length > 0) {
      await appendAuditEntry(svc, {
        tenantId: caller.tenantId,
        actorId: caller.userId,
        action: 'employees.bulk_import',
        entity: 'employees',
        entityId: caller.tenantId,
        payload: { count: created.length, ids: created },
      });
    }

    // 5. Idempotency
    const result = { created, errors, total: rows.length };
    await saveIdempotency(svc, caller.tenantId, idempotencyKey, 'bulk-import-employees', result);

    return json(result, created.length > 0 ? 201 : 422);
  } catch (e) {
    return json({ error: { code: 'INTERNAL', message: e instanceof Error ? e.message : String(e) } }, 500);
  }
});
