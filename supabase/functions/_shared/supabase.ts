// Fabriques de clients Supabase pour les Edge Functions.
//   • callerClient : scoped sur le JWT appelant → la RLS rôle-aware s'applique.
//   • serviceClient : service role → écritures contrôlées par la fonction
//     (cérémonies sensibles : versement, paie) APRÈS vérification d'autorisation.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Atlas People vit dans un schéma dédié (isolation totale du schéma public
// partagé par les autres apps Atlas Studio). Tous les clients ciblent atlas_people.
const SCHEMA = 'atlas_people';

export function callerClient(req: Request): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      db: { schema: SCHEMA },
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    },
  );
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { db: { schema: SCHEMA }, auth: { persistSession: false } },
  );
}

export interface Caller {
  userId: string;
  employeeId: string | null;
  tenantId: string;
  role: string;
}

/**
 * Identifie l'appelant à partir de son JWT et de son appartenance (membership).
 * Renvoie null si non authentifié ou sans membership.
 */
export async function resolveCaller(req: Request): Promise<Caller | null> {
  const supa = callerClient(req);
  const { data: auth } = await supa.auth.getUser();
  if (!auth?.user) return null;

  const { data: membership } = await supa
    .from('memberships')
    .select('tenant_id, role')
    .eq('user_id', auth.user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const { data: emp } = await supa
    .from('employees')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('tenant_id', membership.tenant_id)
    .maybeSingle();

  return {
    userId: auth.user.id,
    employeeId: emp?.id ?? null,
    tenantId: membership.tenant_id,
    role: membership.role,
  };
}

export const isHrOrAdmin = (c: Caller) => c.role === 'hr' || c.role === 'admin';
