/**
 * Client Supabase (BaaS Atlas Studio).
 *
 * RÈGLE MARKETING (cahier §2.5) : ne JAMAIS exposer publiquement le nom de
 * l'infrastructure. En interne le client reste neutre ; côté UI on parle
 * d'« infrastructure de confiance Atlas ».
 *
 * Si les variables d'environnement ne sont pas définies, l'application
 * fonctionne en mode démo sur données mockées (aucun appel réseau).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isBackendConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isBackendConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
