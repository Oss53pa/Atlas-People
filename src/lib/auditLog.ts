/**
 * Journal d'audit chaîné SHA-256 (CDC §6 & §9) — table `atlas_people.audit_log`.
 *
 * hash(n) = SHA-256( hash(n-1) || payload_canonique || horodatage ).
 * Toute écriture métier sensible (paie, congé, décision RH, évaluation, frais,
 * bonus) appelle `appendAuditEntry`. La vérification d'intégrité recalcule la
 * chaîne et signale toute rupture (`verifyAuditChain`).
 */
import { getSupabaseOrThrow, mapSupabaseError } from './session';
import { chainHash, GENESIS_HASH } from './audit';

/** Surfaces autorisées par la contrainte `audit_log_source_surface_check`. */
export type AuditSurface = 'ess' | 'mss' | 'backoffice' | 'system';

export interface AuditInput {
  tenantId: string;
  actorId: string;
  /** Verbe métier, ex. 'leave.decide', 'expense.create'. */
  action: string;
  /** Table/entité concernée, ex. 'leave_requests'. */
  entity: string;
  entityId: string;
  payload: unknown;
  surface?: AuditSurface;
}

/** Objet canonique haché — même forme reconstruite par `verifyAuditChain`. */
function canonical(action: string, entity: string, entityId: string, payload: unknown, at: string) {
  return { action, at, entity, entity_id: entityId, payload };
}

/**
 * Écrit une entrée d'audit chaînée. Best-effort atomicité : lit le dernier hash
 * du tenant puis insère. Lève une erreur typée en cas d'échec (jamais silencieux).
 */
export async function appendAuditEntry(input: AuditInput): Promise<void> {
  const ap = getSupabaseOrThrow().schema('atlas_people');

  const { data: last, error: lErr } = await ap
    .from('audit_log')
    .select('hash')
    .eq('tenant_id', input.tenantId)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lErr) throw mapSupabaseError(lErr);

  const prev = (last?.hash as string) ?? GENESIS_HASH;
  const at = new Date().toISOString();
  const hash = await chainHash(prev, canonical(input.action, input.entity, input.entityId, input.payload, at));

  const { error } = await ap.from('audit_log').insert({
    tenant_id: input.tenantId,
    actor_id: input.actorId,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId,
    payload: input.payload,
    prev_hash: prev,
    hash,
    // created_at = l'horodatage exact haché (sinon verifyAuditChain diverge du default DB)
    created_at: at,
    source_surface: input.surface ?? 'system',
  });
  if (error) throw mapSupabaseError(error);
}

export interface AuditRow {
  action: string;
  entity: string;
  entity_id: string;
  payload: unknown;
  created_at: string;
  prev_hash: string;
  hash: string;
}

/**
 * Recalcule la chaîne d'audit d'un tenant et signale la première rupture.
 * Retourne `{ ok: true }` si intègre, sinon l'index et l'entité en cause.
 */
export async function verifyAuditChain(tenantId: string): Promise<{ ok: boolean; brokenAt?: number; entity?: string }> {
  const ap = getSupabaseOrThrow().schema('atlas_people');
  const { data, error } = await ap
    .from('audit_log')
    .select('action, entity, entity_id, payload, created_at, prev_hash, hash')
    .eq('tenant_id', tenantId)
    .order('id', { ascending: true });
  if (error) throw mapSupabaseError(error);

  let prev = GENESIS_HASH;
  const rows = (data ?? []) as AuditRow[];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.prev_hash !== prev) return { ok: false, brokenAt: i, entity: r.entity };
    const recomputed = await chainHash(prev, canonical(r.action, r.entity, r.entity_id, r.payload, r.created_at));
    if (recomputed !== r.hash) return { ok: false, brokenAt: i, entity: r.entity };
    prev = r.hash;
  }
  return { ok: true };
}
