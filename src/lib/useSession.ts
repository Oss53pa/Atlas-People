/**
 * Hook React d'accès à l'identité de session (tenant / user / employee).
 *
 * Enveloppe `resolveSessionContext()` dans React Query pour un usage réactif
 * dans les pages (ESS/MSS). En mode démo local (pas de backend) ou hors session,
 * `data` reste `undefined` — les écrans doivent gérer ce cas (query désactivée).
 */
import { useQuery } from '@tanstack/react-query';
import { isBackendConfigured } from './supabase';
import { resolveSessionContext, type SessionContext } from './session';

export function useSessionContext() {
  return useQuery<SessionContext>({
    queryKey: ['session-context'],
    queryFn: resolveSessionContext,
    enabled: isBackendConfigured,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
