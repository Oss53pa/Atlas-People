/**
 * Admin Studio — protection CADMIN (V12).
 * Le propriétaire fondateur d'un tenant (`tenants.owner_user_id`) ne peut
 * jamais être désactivé ni rétrogradé — appliqué en base par triggers
 * (0052/0053) et reflété ici pour l'UI (badge + action désactivée).
 */
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
import { supabase } from '../supabase';

export interface TenantOwner {
  userId: string;
  email: string;
}

/** Lit le propriétaire fondateur d'un tenant via la RPC SECURITY DEFINER
 *  `get_tenant_owner` (auth.users n'est pas accessible directement au client). */
export async function getTenantOwner(tenantId: string): Promise<TenantOwner | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.schema('atlas_people')
    .rpc('get_tenant_owner', { p_tenant_id: tenantId });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as { user_id: string | null; email: string | null } | null;
  if (!row?.user_id) return null;
  return { userId: row.user_id, email: row.email ?? '' };
}

/** Active/désactive l'accès d'un membre du roster (`tenant_members`).
 *  Le trigger `tenant_members_protect_owner` refuse toute désactivation
 *  du propriétaire fondateur — l'erreur Postgres remonte telle quelle. */
export async function setMemberActive(memberId: number, email: string, active: boolean): Promise<void> {
  const sb = getSupabaseOrThrow();
  const ctx = await resolveSessionContext();
  const { data, error } = await sb.schema('atlas_people').from('tenant_members')
    .update({ active })
    .eq('id', memberId).eq('tenant_id', ctx.tenantId)
    .select('id');
  if (error) throw mapSupabaseError(error);
  if (!data || data.length === 0) throw new NoRowsAffectedError('setMemberActive');
  await appendAuditEntry({
    tenantId: ctx.tenantId, actorId: ctx.userId,
    action: active ? 'member.reactivate' : 'member.suspend',
    entity: 'tenant_members', entityId: String(memberId),
    payload: { email, active }, surface: 'backoffice',
  });
}
