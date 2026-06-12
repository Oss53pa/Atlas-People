/**
 * M10 Carrières — lecture live mappée sur les types métier du module.
 *
 * Tables seedées avec les VRAIS uuids employés (supabase/seeds/
 * m10_carrieres_seed.sql) : m10_critical_roles, m10_succession_successors,
 * m10_talent_pools(+memberships), m10_mentorat_pairs.
 * `useM10Data()` est live-first avec fallback mock. successorsCount et
 * benchStrength des postes clés sont DÉRIVÉS des successeurs réels (et non
 * stockés), department vient du roster du titulaire.
 * Restent mock/dérivés : FILIERES (référentiel), TRAJECTORIES & SKILLS_MAPPING
 * (calculés depuis le roster), OPPORTUNITIES (pas de table dédiée).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { useAuth } from '../auth';
import { mockEmpId, useRoster } from '../m1/roster';
import { CRITICAL_ROLES, SUCCESSORS, HIGH_POTS, MENTORSHIPS, OPPORTUNITIES, FILIERES, kpis as mockKpis } from './mock';
import type { CriticalRole, SuccessorMapping, HighPotEmployee, MentorshipPair, CareerKPI, SuccessorReadiness, HighPotProgram } from './types';

const DEMO = '11111111-1111-1111-1111-111111111111';
const day = (v: unknown) => (v == null ? undefined : String(v).slice(0, 10));

const READINESS_FROM_DB: Record<string, SuccessorReadiness> = {
  ready_now: 'ready_now',
  ready_18m: '1_2_years',
  ready_3y: '3_5_years',
};
const PROGRAM_FROM_POOL: Record<string, HighPotProgram> = {
  FUTURS_LEADERS: 'leadership_excellence',
  HIPO: 'next_managers',
  EXPERTS: 'expert_track',
  SUCCESSEURS: 'next_managers',
};

interface M10Raw {
  roles: { id: string; role_label: string; current_holder_id: string | null; criticality: string }[];
  successors: { id: string; critical_role_id: string; successor_id: string; readiness: string; ranking: number | null; notes: string | null }[];
  memberships: { id: string; employee_id: string; joined_at: string | null; pool_code: string }[];
  pairs: { id: string; mentor_id: string; mentee_id: string; focus: string | null; started_at: string | null; status: string }[];
}

function useM10Raw(tenantId?: string) {
  const tid = tenantId ?? DEMO;
  return useQuery({
    queryKey: ['m10-raw', tid],
    queryFn: async (): Promise<M10Raw | null> => {
      if (!supabase) return null;
      const ap = supabase.schema('atlas_people');
      const [rolesRes, succRes, memRes, pairRes] = await Promise.all([
        ap.from('m10_critical_roles').select('id, role_label, current_holder_id, criticality').eq('tenant_id', tid),
        ap.from('m10_succession_successors').select('id, critical_role_id, successor_id, readiness, ranking, notes').eq('tenant_id', tid).order('ranking'),
        ap.from('m10_talent_pool_memberships').select('id, employee_id, joined_at, m10_talent_pools!pool_id(code)').eq('tenant_id', tid),
        ap.from('m10_mentorat_pairs').select('id, mentor_id, mentee_id, focus, started_at, status').eq('tenant_id', tid),
      ]);
      for (const r of [rolesRes, succRes, memRes, pairRes]) if (r.error) throw r.error;
      return {
        roles: (rolesRes.data ?? []) as M10Raw['roles'],
        successors: (succRes.data ?? []) as M10Raw['successors'],
        memberships: ((memRes.data ?? []) as Record<string, unknown>[]).map((m) => ({
          id: m.id as string,
          employee_id: m.employee_id as string,
          joined_at: m.joined_at as string | null,
          pool_code: ((m['m10_talent_pools'] as Record<string, string> | null)?.code) ?? '',
        })),
        pairs: (pairRes.data ?? []) as M10Raw['pairs'],
      };
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export interface M10Data {
  live: boolean;
  criticalRoles: CriticalRole[];
  successors: SuccessorMapping[];
  highPots: HighPotEmployee[];
  mentorships: MentorshipPair[];
  successorsOf: (criticalRoleId: string) => SuccessorMapping[];
  kpis: () => CareerKPI;
}

function benchStrengthOf(count: number, hasReadyNow: boolean): CriticalRole['benchStrength'] {
  if (count === 0) return 'none';
  if (count >= 3 || (count >= 2 && hasReadyNow)) return 'strong';
  if (count >= 2 || hasReadyNow) return 'adequate';
  return 'weak';
}

/** Source de données M10 : live Supabase si dispo, sinon datasets mock. */
export function useM10Data(): M10Data {
  const { tenantId } = useAuth();
  const { data: raw } = useM10Raw(tenantId ?? undefined);
  const roster = useRoster();
  const live = isBackendConfigured && !!raw && raw.roles.length > 0;

  let criticalRoles: CriticalRole[] = CRITICAL_ROLES;
  let successors: SuccessorMapping[] = SUCCESSORS;
  let highPots: HighPotEmployee[] = HIGH_POTS;
  let mentorships: MentorshipPair[] = MENTORSHIPS;

  if (live && raw) {
    successors = raw.successors.map((s) => ({
      id: s.id,
      criticalRoleId: s.critical_role_id,
      candidateEmployeeId: mockEmpId(s.successor_id),
      readiness: READINESS_FROM_DB[s.readiness] ?? '3_5_years',
      developmentActions: s.notes ? s.notes.split(' | ') : [],
    }));
    criticalRoles = raw.roles.map((r, i) => {
      const holderId = r.current_holder_id ? mockEmpId(r.current_holder_id) : '';
      const holder = roster.find((e) => e.id === holderId);
      const succ = successors.filter((s) => s.criticalRoleId === r.id);
      return {
        id: r.id,
        ref: `CR-2026-${String(i + 1).padStart(4, '0')}`,
        title: r.role_label,
        department: holder?.department ?? '—',
        currentHolderEmployeeId: holderId,
        criticality: (r.criticality as CriticalRole['criticality']) ?? 'medium',
        successorsCount: succ.length,
        benchStrength: benchStrengthOf(succ.length, succ.some((s) => s.readiness === 'ready_now')),
      };
    });
    const mentorByMentee = new Map(raw.pairs.map((p) => [mockEmpId(p.mentee_id), mockEmpId(p.mentor_id)]));
    highPots = raw.memberships.map((m) => {
      const enrolledAt = day(m.joined_at) ?? '';
      const grad = enrolledAt ? `${Number(enrolledAt.slice(0, 4)) + 1}-${enrolledAt.slice(5, 10)}` : '';
      const empId = mockEmpId(m.employee_id);
      return {
        employeeId: empId,
        program: PROGRAM_FROM_POOL[m.pool_code] ?? 'next_managers',
        enrolledAt,
        graduationTarget: grad,
        status: 'in_progress' as const,
        mentorEmployeeId: mentorByMentee.get(empId),
      };
    });
    mentorships = raw.pairs.map((p, i) => ({
      id: p.id,
      mentorEmployeeId: mockEmpId(p.mentor_id),
      menteeEmployeeId: mockEmpId(p.mentee_id),
      startedAt: day(p.started_at) ?? '',
      cadence: i % 2 === 0 ? 'monthly' : 'biweekly',
      focus: p.focus ?? 'Leadership',
      status: p.status === 'active' ? 'active' : p.status === 'completed' ? 'completed' : 'paused',
    }));
  }

  const successorsOf = (criticalRoleId: string) => successors.filter((s) => s.criticalRoleId === criticalRoleId);
  const kpis = (): CareerKPI => {
    if (!live) return mockKpis();
    const benchOk = criticalRoles.filter((r) => r.benchStrength === 'strong' || r.benchStrength === 'adequate').length;
    const coverage = Math.round((successors.filter((s) => s.readiness === 'ready_now' || s.readiness === '1_2_years').length / Math.max(1, criticalRoles.length * 2)) * 100);
    return {
      filieresActives: FILIERES.length,
      postesCleses: criticalRoles.length,
      benchStrengthPct: criticalRoles.length ? Math.round((benchOk / criticalRoles.length) * 100) : 0,
      hautsPotentielsCount: highPots.filter((h) => h.status === 'enrolled' || h.status === 'in_progress').length,
      mentorshipActifs: mentorships.filter((m) => m.status === 'active').length,
      opportunitesOuvertes: OPPORTUNITIES.filter((o) => o.status === 'open').length,
      promotionsLast12m: 4,
      mobilitesLast12m: 7,
      retentionTopTalentsPct: 94,
      successionCoveragePct: Math.min(100, coverage),
    };
  };

  return { live, criticalRoles, successors, highPots, mentorships, successorsOf, kpis };
}
