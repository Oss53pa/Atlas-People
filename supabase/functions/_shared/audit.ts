// Port Deno de src/lib/audit.ts — chaîne d'audit SHA-256 (hash(n) = SHA-256(hash(n-1) || payload)).
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const GENESIS_HASH = '0'.repeat(64);

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function chainHash(previousHash: string, payload: unknown): Promise<string> {
  const serialized = JSON.stringify(payload, Object.keys(payload as object).sort());
  return sha256Hex(`${previousHash}|${serialized}`);
}

export interface AuditParams {
  tenantId: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  payload: unknown;
  surface?: string;
}

/** Lit le dernier hash du tenant et insère une entrée chaînée dans audit_log. */
export async function appendAuditEntry(svc: SupabaseClient, p: AuditParams): Promise<void> {
  const { data: last } = await svc
    .from('audit_log').select('hash')
    .eq('tenant_id', p.tenantId)
    .order('id', { ascending: false }).limit(1).maybeSingle();
  const prev = (last?.hash as string) ?? GENESIS_HASH;
  const now = new Date().toISOString();
  const hash = await chainHash(prev, { action: p.action, at: now, entity: p.entity, entity_id: p.entityId, payload: p.payload });
  await svc.from('audit_log').insert({
    tenant_id: p.tenantId, actor_id: p.actorId, action: p.action,
    entity: p.entity, entity_id: p.entityId, payload: p.payload,
    prev_hash: prev, hash, created_at: now, source_surface: p.surface ?? 'backoffice',
  });
}

/** Retourne le résultat stocké si la clé existe, sinon null. */
export async function checkIdempotency(svc: SupabaseClient, tenantId: string, key: string): Promise<unknown | null> {
  const { data } = await svc.from('idempotency_keys').select('result').eq('tenant_id', tenantId).eq('key', key).maybeSingle();
  return data?.result ?? null;
}

/** Enregistre le résultat d'une opération idempotente. */
export async function saveIdempotency(svc: SupabaseClient, tenantId: string, key: string, action: string, result: unknown): Promise<void> {
  await svc.from('idempotency_keys').insert({ tenant_id: tenantId, key, action, result });
}
