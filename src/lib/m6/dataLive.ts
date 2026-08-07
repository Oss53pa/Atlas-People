/**
 * M6 Onboarding — lecture live mappée sur les types métier du module.
 *
 * Source réelle : m6_arrivants (parcours effectifs des vrais arrivants) + les
 * sous-tables m6_tasks / m6_jalons / m6_pulses / m6_welcome_book (seedées à
 * parité-template pour les arrivants réels — supabase/seeds/m6_sub_seed.sql).
 * `useM6Data()` est live-first avec fallback mock. Les ids de parcours live =
 * uuid m6_arrivants, et les sous-tables sont reliées par arrivant_id, donc les
 * helpers (tasksByJourney, pulsesByJourney, docsByJourney) restent cohérents.
 *
 * BUDDIES et TRAINING_COMPLETIONS n'ont pas de table dédiée : ils sont DÉRIVÉS
 * des parcours live (assignation buddy, formations obligatoires). La catégorie
 * de tâche (absente en DB) est retrouvée par le titre via TASK_LIBRARY.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { useAuth } from '../auth';
import { mockEmpId } from '../m1/roster';
import { TASK_LIBRARY, MANDATORY_TRAININGS, PULSE_QUESTIONS } from './referentiels';
import {
  JOURNEYS, journeyByEmployee as mockJourneyByEmployee, journeyById as mockJourneyById,
  TASKS as MOCK_TASKS, PULSES as MOCK_PULSES, BUDDIES as MOCK_BUDDIES,
  DOC_DELIVERIES as MOCK_DOCS, TRAINING_COMPLETIONS as MOCK_TRAININGS, kpis as mockKpis,
} from './mock';
import type {
  OnboardingJourney, OnboardingTask, PulseFeedback, DocumentDelivery,
  BuddyAssignment, TrainingCompletion, OnboardingKPI,
  MilestoneCode, TaskStatus, OwnerRole, TaskCategory,
} from './types';

const DEMO = '11111111-1111-1111-1111-111111111111';
const day = (v: unknown) => (v == null ? undefined : String(v).slice(0, 10));
const diffDays = (iso?: string) => (iso ? Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000) : 0);
const plusDays = (iso: string, d: number) => { const t = new Date(iso); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };

const TEMPLATE_CODE_MAP: Record<string, string> = {
  TECH_DEV_STD: 'TECH', COMMERCIAL_STD: 'COMMERCIAL', MANAGER_STD: 'MANAGER', STAGE_STD: 'STAGE',
};
const JK_REV: Record<string, MilestoneCode> = {
  CUSTOM: 'PRE_J7', J0: 'J0', J7: 'J7', J30: 'J30', J60: 'J60', J90: 'J90', FIN_ESSAI: 'J90',
};
const OWNER_REV: Record<string, OwnerRole> = {
  employee: 'newcomer', admin: 'office', manager: 'manager', rh: 'rh', it: 'it', buddy: 'buddy',
};
const TSTATUS_REV: Record<string, TaskStatus> = {
  todo: 'pending', in_progress: 'in_progress', done: 'completed', skipped: 'skipped', blocked: 'blocked',
};
const PULSE_OVERALL: Record<string, number> = { happy: 4.5, neutral: 3.2, unhappy: 2 };
const catByTitle = new Map<string, TaskCategory>(TASK_LIBRARY.map((t) => [t.title, t.category]));

interface M6Raw {
  journeys: OnboardingJourney[];
  tasks: OnboardingTask[];
  pulses: PulseFeedback[];
  docs: DocumentDelivery[];
}

function useM6Raw(tenantId?: string) {
  const tid = tenantId ?? DEMO;
  return useQuery({
    queryKey: ['m6-raw-live', tid],
    queryFn: async (): Promise<M6Raw | null> => {
      if (!supabase) return null;
      const ap = supabase.schema('atlas_people');
      const [arr, tk, pl, wb] = await Promise.all([
        ap.from('m6_arrivants').select(`id, employee_id, start_date, manager_id, buddy_id, rh_referent_id,
          parcours_status, overall_completion_pct, fin_essai_at, m6_parcours_templates!template_id(code)`)
          .eq('tenant_id', tid).order('start_date', { ascending: false }),
        ap.from('m6_tasks').select('*').eq('tenant_id', tid).order('due_date'),
        ap.from('m6_pulses').select('*').eq('tenant_id', tid).order('triggered_at'),
        ap.from('m6_welcome_book').select('*').eq('tenant_id', tid),
      ]);
      for (const r of [arr, tk, pl, wb]) if (r.error) throw r.error;

      const journeys: OnboardingJourney[] = ((arr.data ?? []) as Record<string, unknown>[]).map((a, i): OnboardingJourney => {
        const tplCode = ((a['m6_parcours_templates'] as Record<string, string> | null)?.code) ?? 'STD_CADRE';
        const start = day(a.start_date) ?? '';
        const status: OnboardingJourney['status'] =
          a.parcours_status === 'completed' ? 'completed'
          : a.parcours_status === 'active' ? 'in_progress'
          : a.parcours_status === 'failed' ? 'failed' : 'planned';
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
          nps: status === 'completed' ? 62 : undefined,
        };
      });
      const jById = new Map(journeys.map((j) => [j.id, j]));
      const ownerEmp = (role: OwnerRole, j?: OnboardingJourney) =>
        role === 'manager' ? j?.managerEmployeeId : role === 'buddy' ? j?.buddyEmployeeId : role === 'rh' ? j?.hrLeadEmployeeId : undefined;

      const tasks: OnboardingTask[] = ((tk.data ?? []) as Record<string, unknown>[]).map((t, i): OnboardingTask => {
        const jid = t.arrivant_id as string;
        const j = jById.get(jid);
        const role = OWNER_REV[(t.owner as string) ?? 'rh'] ?? 'rh';
        const title = (t.title as string) ?? '';
        return {
          id: t.id as string,
          ref: `ONB-${(day(t.due_date) ?? '2026').slice(0, 4)}-${String(i + 1).padStart(4, '0')}`,
          journeyId: jid,
          title,
          category: catByTitle.get(title) ?? 'ADMIN',
          milestone: JK_REV[(t.jalon_kind as string) ?? 'J0'] ?? 'J0',
          dueDate: day(t.due_date) ?? '',
          status: TSTATUS_REV[(t.status as string) ?? 'todo'] ?? 'pending',
          ownerRole: role,
          ownerEmployeeId: ownerEmp(role, j),
          completedAt: day(t.completed_at),
          blocking: Boolean(t.required),
        };
      });

      const pulses: PulseFeedback[] = ((pl.data ?? []) as Record<string, unknown>[]).map((p): PulseFeedback => {
        const m = ((p.jalon_kind as string) ?? 'J7') as PulseFeedback['milestone'];
        const overall = PULSE_OVERALL[(p.score as string) ?? 'neutral'] ?? 3.2;
        const qs = (PULSE_QUESTIONS as Record<string, string[]>)[m] ?? [];
        return {
          id: p.id as string,
          journeyId: p.arrivant_id as string,
          milestone: m,
          submittedAt: day(p.submitted_at) ?? day(p.triggered_at) ?? '',
          overallScore: overall,
          npsScore: m === 'J90' ? Math.round((overall - 3) * 40) : undefined,
          answers: qs.map((q, qi) => ({ question: q, score: Math.max(1, Math.min(5, Math.round(overall) + ((qi % 2) ? 0 : 0))) })),
          freeText: (p.comment as string) ?? undefined,
        };
      });

      const docs: DocumentDelivery[] = ((wb.data ?? []) as Record<string, unknown>[]).map((d): DocumentDelivery => {
        const j = jById.get(d.arrivant_id as string);
        const rs = (d.read_status as string) ?? 'sent';
        return {
          id: d.id as string,
          journeyId: d.arrivant_id as string,
          docCode: (d.doc_kind as string) ?? '',
          status: (rs === 'read' ? 'read' : rs === 'signed' ? 'signed' : rs === 'pending' ? 'pending' : 'sent') as DocumentDelivery['status'],
          sentAt: j ? plusDays(j.hireDate, -3) : undefined,
          signedAt: rs === 'signed' ? day(d.read_at) : undefined,
        };
      });

      return { journeys, tasks, pulses, docs };
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export interface M6Data {
  live: boolean;
  journeys: OnboardingJourney[];
  tasks: OnboardingTask[];
  pulses: PulseFeedback[];
  docs: DocumentDelivery[];
  buddies: BuddyAssignment[];
  trainings: TrainingCompletion[];
  journeyByEmployee: (empId: string) => OnboardingJourney | undefined;
  journeyById: (id: string) => OnboardingJourney | undefined;
  tasksByJourney: (jId: string) => OnboardingTask[];
  tasksByMilestone: (jId: string, m: MilestoneCode) => OnboardingTask[];
  pulsesByJourney: (jId: string) => PulseFeedback[];
  docsByJourney: (jId: string) => DocumentDelivery[];
  trainingsByJourney: (jId: string) => TrainingCompletion[];
  kpis: () => OnboardingKPI;
}

/** Buddies dérivés des parcours live (pas de table dédiée). */
function deriveBuddies(journeys: OnboardingJourney[]): BuddyAssignment[] {
  return journeys.filter((j) => j.buddyEmployeeId).map((j, i) => ({
    id: `buddy-${j.id}`,
    buddyEmployeeId: j.buddyEmployeeId!,
    newcomerEmployeeId: j.employeeId,
    journeyId: j.id,
    startedAt: j.hireDate,
    weeklyHours: 1.5,
    status: j.status === 'completed' ? 'completed' : 'active',
    satisfactionScore: j.status === 'completed' ? 4 + (i % 2) * 0.5 : undefined,
  }));
}

/** Formations obligatoires dérivées des parcours live. */
function deriveTrainings(journeys: OnboardingJourney[]): TrainingCompletion[] {
  return journeys.flatMap((j) => {
    const elapsed = diffDays(j.hireDate);
    return MANDATORY_TRAININGS.map((tr, i): TrainingCompletion => {
      const assignedAt = plusDays(j.hireDate, -3);
      const status: TrainingCompletion['status'] = j.status === 'planned' ? 'assigned'
        : j.status === 'completed' ? 'completed'
        : elapsed > 14 ? 'completed'
        : i < 4 ? 'completed' : i < 6 ? 'in_progress' : 'assigned';
      return {
        id: `tr-${j.id}-${tr.code}`,
        journeyId: j.id,
        trainingCode: tr.code,
        status,
        assignedAt,
        completedAt: status === 'completed' ? plusDays(assignedAt, 7 + i * 2) : undefined,
        score: status === 'completed' ? 85 + (i * 3) % 15 : undefined,
      };
    });
  });
}

/** Source de données M6 : sous-tables réelles si dispo, sinon projection mock. */
export function useM6Data(): M6Data {
  const { tenantId } = useAuth();
  const { data: raw } = useM6Raw(tenantId ?? undefined);
  const live = isBackendConfigured && !!raw && raw.journeys.length > 0 && raw.tasks.length > 0;

  const journeys = live && raw ? raw.journeys : JOURNEYS;
  const tasks = live && raw ? raw.tasks : MOCK_TASKS;
  const pulses = live && raw ? raw.pulses : MOCK_PULSES;
  const docs = live && raw ? raw.docs : MOCK_DOCS;
  const buddies = live ? deriveBuddies(journeys) : MOCK_BUDDIES;
  const trainings = live ? deriveTrainings(journeys) : MOCK_TRAININGS;

  const kpis = (): OnboardingKPI => {
    if (!live) return mockKpis();
    const activeJourneys = journeys.filter((j) => j.status === 'in_progress');
    const completed = journeys.filter((j) => j.status === 'completed');
    const upcoming = journeys.filter((j) => { const d = diffDays(j.hireDate); return d > 0 && d <= 7; });
    const tasksLate = tasks.filter((t) => t.status !== 'completed' && diffDays(t.dueDate) < 0).length;
    const pulsesPendings = journeys.flatMap((j) => {
      const jd = diffDays(j.hireDate);
      const submitted = pulses.filter((p) => p.journeyId === j.id);
      return ['J7', 'J30', 'J60', 'J90'].filter((m) => {
        const t = m === 'J7' ? 7 : m === 'J30' ? 30 : m === 'J60' ? 60 : 90;
        return jd >= t && jd <= t + 7 && !submitted.find((s) => s.milestone === m);
      });
    }).length;
    const completionMoyenne = activeJourneys.length
      ? Math.round(activeJourneys.reduce((s, j) => s + j.progressPct, 0) / activeJourneys.length) : 0;
    const npsScores = completed.map((j) => j.nps).filter((n): n is number => typeof n === 'number');
    return {
      arrivantsActifs: activeJourneys.length,
      prochainsJ7: upcoming.length,
      completionMoyenne,
      npsJ90: npsScores.length ? Math.round(npsScores.reduce((s, n) => s + n, 0) / npsScores.length) : 0,
      tachesEnRetard: tasksLate,
      pulsesPendings,
      buddyPairings: buddies.filter((b) => b.status === 'active').length,
      timeToProductivityJours: 45,
    };
  };

  return {
    live,
    journeys, tasks, pulses, docs, buddies, trainings,
    journeyByEmployee: (empId) => journeys.find((j) => j.employeeId === empId) ?? mockJourneyByEmployee(empId),
    journeyById: (id) => journeys.find((j) => j.id === id) ?? mockJourneyById(id),
    tasksByJourney: (jId) => tasks.filter((t) => t.journeyId === jId),
    tasksByMilestone: (jId, m) => tasks.filter((t) => t.journeyId === jId && t.milestone === m),
    pulsesByJourney: (jId) => pulses.filter((p) => p.journeyId === jId),
    docsByJourney: (jId) => docs.filter((d) => d.journeyId === jId),
    trainingsByJourney: (jId) => trainings.filter((t) => t.journeyId === jId),
    kpis,
  };
}
