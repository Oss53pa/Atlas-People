/**
 * M6 Onboarding — lecture live mappée sur les types métier du module.
 *
 * Source réelle : m6_arrivants (parcours d'onboarding effectifs, reliés aux
 * vrais employés depuis le fix d'intégrité) + m6_parcours_templates.
 * `useM6Data()` est live-first avec fallback sur le mock JOURNEYS (qui est
 * une projection dérivée du roster : tout collaborateur = un parcours
 * synthétique). Les datasets TASKS/PULSES/BUDDIES/DOCS restent dérivés.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { useAuth } from '../auth';
import { mockEmpId } from '../m1/roster';
import { JOURNEYS, journeyByEmployee as mockJourneyByEmployee, journeyById as mockJourneyById } from './mock';
import type { OnboardingJourney } from './types';

const DEMO = '11111111-1111-1111-1111-111111111111';
const day = (v: unknown) => (v == null ? undefined : String(v).slice(0, 10));

/** Codes template DB → codes du référentiel mock (templateMeta). */
const TEMPLATE_CODE_MAP: Record<string, string> = {
  TECH_DEV_STD: 'TECH',
  COMMERCIAL_STD: 'COMMERCIAL',
  MANAGER_STD: 'MANAGER',
  STAGE_STD: 'STAGE',
};

export function useM6Journeys(tenantId?: string) {
  const tid = tenantId ?? DEMO;
  return useQuery({
    queryKey: ['m6-journeys-live', tid],
    queryFn: async (): Promise<OnboardingJourney[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('m6_arrivants')
        .select(`id, employee_id, start_date, manager_id, buddy_id, rh_referent_id, parcours_status,
          overall_completion_pct, pulse_avg, fin_essai_at, notes,
          m6_parcours_templates!template_id(code)`)
        .eq('tenant_id', tid)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a: Record<string, unknown>, i): OnboardingJourney => {
        const tplCode = ((a['m6_parcours_templates'] as Record<string, string> | null)?.code) ?? 'STD_CADRE';
        const start = day(a.start_date) ?? '';
        const status: OnboardingJourney['status'] =
          a.parcours_status === 'completed' ? 'completed'
          : a.parcours_status === 'active' ? 'in_progress'
          : a.parcours_status === 'failed' ? 'failed'
          : 'planned';
        return {
          id: a.id as string,
          ref: `PARC-${start.slice(0, 4) || '2026'}-${String(i + 1).padStart(4, '0')}`,
          employeeId: mockEmpId(a.employee_id as string),
          templateCode: TEMPLATE_CODE_MAP[tplCode] ?? 'STD_CADRE',
          hireDate: start,
          buddyEmployeeId: a.buddy_id ? mockEmpId(a.buddy_id as string) : undefined,
          managerEmployeeId: a.manager_id ? mockEmpId(a.manager_id as string) : 'e1',
          hrLeadEmployeeId: a.rh_referent_id ? mockEmpId(a.rh_referent_id as string) : 'e3',
          status,
          progressPct: Number(a.overall_completion_pct ?? 0),
          startedAt: status !== 'planned' ? start : undefined,
          completedAt: status === 'completed' ? day(a.fin_essai_at) : undefined,
          nps: undefined,
        };
      });
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export interface M6Data {
  live: boolean;
  journeys: OnboardingJourney[];
  journeyByEmployee: (empId: string) => OnboardingJourney | undefined;
  journeyById: (id: string) => OnboardingJourney | undefined;
}

/** Source de données M6 : parcours réels (m6_arrivants) si dispo, sinon la
 *  projection mock dérivée du roster. Helpers liés avec fallback mock pour
 *  les ids mock (datasets dérivés TASKS/PULSES…). */
export function useM6Data(): M6Data {
  const { tenantId } = useAuth();
  const { data: liveJourneys } = useM6Journeys(tenantId ?? undefined);
  const live = isBackendConfigured && !!liveJourneys && liveJourneys.length > 0;
  const journeys = live && liveJourneys ? liveJourneys : JOURNEYS;
  return {
    live,
    journeys,
    journeyByEmployee: (empId) => journeys.find((j) => j.employeeId === empId) ?? mockJourneyByEmployee(empId),
    journeyById: (id) => journeys.find((j) => j.id === id) ?? mockJourneyById(id),
  };
}
