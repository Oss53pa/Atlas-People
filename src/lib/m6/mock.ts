/**
 * M6 ONBOARDING — données démo seedées.
 * Parcours actifs sur les 14 collaborateurs (récents = en cours, anciens = complétés).
 * e11 Rokhaya Fall (onboarding) → parcours pleinement actif J+13.
 */
import { EMPLOYEES } from '../../data/mock';
import { MANDATORY_TRAININGS, MILESTONES, TASK_LIBRARY, TEMPLATES, WELCOME_DOCS, ONBOARDING_SLA, PULSE_QUESTIONS } from './referentiels';
import type {
  OnboardingJourney, OnboardingTask, BuddyAssignment, PulseFeedback,
  TrainingCompletion, DocumentDelivery, OnboardingKPI, TaskStatus, MilestoneCode,
} from './types';

const TODAY = new Date('2026-05-30');
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const plusDays = (s: string, n: number) => { const d = new Date(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a: string, b = ymd(TODAY)) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);

// ─────────────────────────────────────── Pickeur template
function templateFor(role: string, contractType: string): string {
  if (contractType === 'STAGE' || contractType === 'APPR') return 'STAGE';
  const r = role.toLowerCase();
  if (r.includes('lead') || r.includes('manager') || r.includes('dir')) return 'MANAGER';
  if (r.includes('dev') || r.includes('engineer') || r.includes('devops') || r.includes('data')) return 'TECH';
  if (r.includes('commercial') || r.includes('sales') || r.includes('customer')) return 'COMMERCIAL';
  return 'STD_CADRE';
}

// ─────────────────────────────────────── JOURNEYS (parcours)
export const JOURNEYS: OnboardingJourney[] = EMPLOYEES.map((e, i) => {
  const days = diffDays(e.hireDate);
  const status: OnboardingJourney['status'] =
    days < 0 ? 'planned' :
    days >= 0 && days < 90 ? 'in_progress' :
    'completed';
  // progress estimé : durée écoulée / 90
  const progressPct = status === 'planned' ? 0 : status === 'completed' ? 100 : Math.min(100, Math.round((days / 90) * 100));
  return {
    id: `parc-${e.id}`,
    ref: `PARC-${e.hireDate.slice(0,4)}-${String(i + 1).padStart(4, '0')}`,
    employeeId: e.id,
    templateCode: templateFor(e.role, e.contractType),
    hireDate: e.hireDate,
    buddyEmployeeId: e.manager ? EMPLOYEES.find((x) => `${x.firstName} ${x.lastName}` === e.manager)?.id : EMPLOYEES.find(x => x.department === e.department && x.id !== e.id)?.id,
    managerEmployeeId: e.manager ? EMPLOYEES.find((x) => `${x.firstName} ${x.lastName}` === e.manager)?.id ?? 'e1' : 'e1',
    hrLeadEmployeeId: 'e3',
    status,
    progressPct,
    startedAt: status !== 'planned' ? e.hireDate : undefined,
    completedAt: status === 'completed' ? plusDays(e.hireDate, 90) : undefined,
    nps: status === 'completed' ? (60 + (i * 7) % 35) : undefined,
  };
});

export const journeyByEmployee = (empId: string) => JOURNEYS.find((j) => j.employeeId === empId);
export const journeyById = (id: string) => JOURNEYS.find((j) => j.id === id);

// ─────────────────────────────────────── TASKS (générées par parcours — déterministe)
function detTasks(j: OnboardingJourney, salt: number): OnboardingTask[] {
  const out: OnboardingTask[] = [];
  let idx = 1;
  const journeyDays = diffDays(j.hireDate);
  for (const t of TASK_LIBRARY) {
    const milestoneInfo = MILESTONES.find((m) => m.code === t.milestone)!;
    const dueDate = plusDays(j.hireDate, milestoneInfo.daysFromHire);
    const dueDays = diffDays(dueDate);
    let status: TaskStatus;
    if (j.status === 'planned') status = 'pending';
    else if (j.status === 'completed') status = 'completed';
    else if (dueDays < -5) status = 'completed';
    else if (journeyDays >= milestoneInfo.daysFromHire) {
      // milestone atteinte
      status = (idx + salt) % 6 === 0 ? 'in_progress' : 'completed';
    }
    else if (journeyDays >= milestoneInfo.daysFromHire - 2) status = 'in_progress';
    else status = 'pending';

    out.push({
      id: `tsk-${j.id}-${idx}`,
      ref: `ONB-${j.hireDate.slice(0,4)}-${String(idx).padStart(4, '0')}-${j.id.slice(-2)}`,
      journeyId: j.id,
      title: t.title,
      category: t.category,
      milestone: t.milestone,
      dueDate,
      status,
      ownerRole: t.ownerRole,
      ownerEmployeeId: t.ownerRole === 'manager' ? j.managerEmployeeId : t.ownerRole === 'buddy' ? j.buddyEmployeeId : t.ownerRole === 'rh' ? j.hrLeadEmployeeId : undefined,
      completedAt: status === 'completed' ? plusDays(dueDate, -1) : undefined,
      blocking: t.blocking,
    });
    idx++;
  }
  return out;
}

export const TASKS: OnboardingTask[] = JOURNEYS.flatMap((j, i) => detTasks(j, i));

export const tasksByJourney = (jId: string) => TASKS.filter((t) => t.journeyId === jId);
export const tasksByMilestone = (jId: string, m: MilestoneCode) => TASKS.filter((t) => t.journeyId === jId && t.milestone === m);

// Recalcule la progression réelle par parcours
JOURNEYS.forEach((j) => {
  const ts = tasksByJourney(j.id);
  if (ts.length === 0) return;
  const done = ts.filter((t) => t.status === 'completed').length;
  j.progressPct = Math.round((done / ts.length) * 100);
});

// ─────────────────────────────────────── BUDDY pairings
export const BUDDIES: BuddyAssignment[] = JOURNEYS.filter((j) => j.buddyEmployeeId).map((j, i) => ({
  id: `buddy-${j.id}`,
  buddyEmployeeId: j.buddyEmployeeId!,
  newcomerEmployeeId: j.employeeId,
  journeyId: j.id,
  startedAt: j.hireDate,
  weeklyHours: 1.5,
  status: j.status === 'completed' ? 'completed' as const : 'active' as const,
  satisfactionScore: j.status === 'completed' ? 4 + (i % 2) * 0.5 : undefined,
}));

// ─────────────────────────────────────── PULSE feedbacks
export const PULSES: PulseFeedback[] = JOURNEYS.flatMap((j) => {
  const out: PulseFeedback[] = [];
  const journeyDays = diffDays(j.hireDate);
  const ms: ('J7' | 'J30' | 'J60' | 'J90')[] = ['J7', 'J30', 'J60', 'J90'];
  for (const m of ms) {
    const targetDays = m === 'J7' ? 7 : m === 'J30' ? 30 : m === 'J60' ? 60 : 90;
    if (journeyDays >= targetDays) {
      const qs = PULSE_QUESTIONS[m];
      out.push({
        id: `pulse-${j.id}-${m}`,
        journeyId: j.id,
        milestone: m,
        submittedAt: plusDays(j.hireDate, targetDays + 1),
        overallScore: 3.5 + (parseInt(j.employeeId.slice(1)) % 3) * 0.3,
        npsScore: m === 'J90' ? (50 + (parseInt(j.employeeId.slice(1)) * 11) % 40) : undefined,
        answers: qs.map((q, qi) => ({ question: q, score: 3 + ((qi + parseInt(j.employeeId.slice(1))) % 3) })),
        freeText: m === 'J90' ? "Onboarding très structuré, buddy disponible. À améliorer : plus de rencontres transverses." : undefined,
      });
    }
  }
  return out;
});
export const pulsesByJourney = (jId: string) => PULSES.filter((p) => p.journeyId === jId);

// ─────────────────────────────────────── TRAININGS completion
export const TRAINING_COMPLETIONS: TrainingCompletion[] = JOURNEYS.flatMap((j) => {
  const journeyDays = diffDays(j.hireDate);
  return MANDATORY_TRAININGS.map((tr, i) => {
    const assignedAt = plusDays(j.hireDate, -3);
    const status: TrainingCompletion['status'] = j.status === 'planned' ? 'assigned'
      : j.status === 'completed' ? 'completed'
      : journeyDays > 14 ? 'completed'
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
export const trainingsByJourney = (jId: string) => TRAINING_COMPLETIONS.filter((t) => t.journeyId === jId);

// ─────────────────────────────────────── DOCUMENTS delivery
export const DOC_DELIVERIES: DocumentDelivery[] = JOURNEYS.flatMap((j) =>
  WELCOME_DOCS.map((d, i) => {
    const sent = plusDays(j.hireDate, -3);
    const sig = WELCOME_DOCS.find(x => x.code === d.code)?.signatureRequired;
    const status: DocumentDelivery['status'] = j.status === 'planned' ? 'sent'
      : sig ? 'signed'
      : i % 4 === 0 ? 'sent' : 'read';
    return {
      id: `doc-${j.id}-${d.code}`,
      journeyId: j.id,
      docCode: d.code,
      status,
      sentAt: sent,
      signedAt: status === 'signed' ? plusDays(sent, 4) : undefined,
    };
  }),
);
export const docsByJourney = (jId: string) => DOC_DELIVERIES.filter((d) => d.journeyId === jId);

// ─────────────────────────────────────── KPIs Cockpit
export function kpis(): OnboardingKPI {
  const activeJourneys = JOURNEYS.filter((j) => j.status === 'in_progress');
  const completed = JOURNEYS.filter((j) => j.status === 'completed');
  const upcoming = JOURNEYS.filter((j) => {
    const d = diffDays(j.hireDate);
    return d > 0 && d <= 7;
  });
  const tasksLate = TASKS.filter((t) => {
    if (t.status === 'completed') return false;
    return diffDays(t.dueDate) < 0;
  }).length;
  const pulsesPendings = JOURNEYS.flatMap((j) => {
    const journeyDays = diffDays(j.hireDate);
    const submitted = PULSES.filter((p) => p.journeyId === j.id);
    const expected = ['J7','J30','J60','J90'].filter((m) => {
      const t = m === 'J7' ? 7 : m === 'J30' ? 30 : m === 'J60' ? 60 : 90;
      return journeyDays >= t && journeyDays <= t + ONBOARDING_SLA.pulseSubmissionDeadline;
    });
    return expected.filter((m) => !submitted.find((s) => s.milestone === m));
  }).length;
  const completionMoyenne = activeJourneys.length
    ? Math.round(activeJourneys.reduce((s, j) => s + j.progressPct, 0) / activeJourneys.length)
    : 0;
  const npsScores = completed.filter((j) => typeof j.nps === 'number').map((j) => j.nps!);
  const npsJ90 = npsScores.length ? Math.round(npsScores.reduce((s, n) => s + n, 0) / npsScores.length) : 0;
  return {
    arrivantsActifs: activeJourneys.length,
    prochainsJ7: upcoming.length,
    completionMoyenne,
    npsJ90,
    tachesEnRetard: tasksLate,
    pulsesPendings,
    buddyPairings: BUDDIES.filter((b) => b.status === 'active').length,
    timeToProductivityJours: ONBOARDING_SLA.timeToProductivityTargetDays,
  };
}

// helper meta template
export function templateMeta(code: string) {
  return TEMPLATES.find((t) => t.code === code);
}
