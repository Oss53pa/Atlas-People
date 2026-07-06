/**
 * M11 Formation — complétion des parcours (reporting).
 *
 * `useM11Data` n'expose pas les parcours ; ce hook lit m11_parcours +
 * m11_parcours_enrollments et dérive, par parcours :
 *   enrolled  = inscriptions · completed = inscriptions terminées (completed_at)
 *   rate      = avancement moyen (progress_pct)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';

const DEMO = '11111111-1111-1111-1111-111111111111';

export interface ParcoursCompletionRow {
  parcours: string;
  enrolled: number;
  completed: number;
  rate: number;
}

export function useM11ParcoursCompletion(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m11-parcours-completion', tenantId],
    queryFn: async (): Promise<ParcoursCompletionRow[]> => {
      if (!supabase) return [];
      const ap = supabase.schema('atlas_people');
      const [pR, eR] = await Promise.all([
        ap.from('m11_parcours').select('id, label').eq('tenant_id', tenantId),
        ap.from('m11_parcours_enrollments').select('parcours_id, completed_at, progress_pct').eq('tenant_id', tenantId),
      ]);
      if (pR.error || eR.error) return [];
      const parcours = (pR.data ?? []) as { id: string; label: string }[];
      const enr = (eR.data ?? []) as { parcours_id: string; completed_at: string | null; progress_pct: number | null }[];
      return parcours
        .map((p) => {
          const rows = enr.filter((e) => e.parcours_id === p.id);
          const enrolled = rows.length;
          const completed = rows.filter((e) => e.completed_at != null).length;
          const rate = enrolled ? Math.round((rows.reduce((s, e) => s + (e.progress_pct ?? 0), 0) / enrolled) * 10) / 10 : 0;
          return { parcours: p.label, enrolled, completed, rate };
        })
        .filter((p) => p.enrolled > 0)
        .sort((a, b) => b.enrolled - a.enrolled);
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}
