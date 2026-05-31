/**
 * M8 ÉVALUATIONS — données démo.
 * Cycle annuel 2026 actif · évaluations seedées pour les 14 collaborateurs ·
 * 9-box positions · plans de développement.
 */
import { EMPLOYEES } from '../../data/mock';
import { EVAL_DIMENSIONS, boxKey } from './referentiels';
import type {
  EvalCycle, Evaluation, Feedback360, CalibrationSession, TalentBoxAssignment,
  DevelopmentPlan, OneOnOne, EvalKPI, EvaluationStatus, ScoreRow,
} from './types';

// ─────────────────────────────────────── Cycles
export const CYCLES: EvalCycle[] = [
  { id: 'cyc-2026-annuel', ref: 'EVAL-2026-Annuel', label: 'Annuel 2026', type: 'annuel',
    startDate: '2026-04-01', endDate: '2026-06-30',
    status: 'in_progress', autoEvalDeadline: '2026-05-15',
    managerEvalDeadline: '2026-06-05', calibrationDate: '2026-06-15',
    participantsCount: EMPLOYEES.length, completionPct: 62 },
  { id: 'cyc-2026-midyear', ref: 'EVAL-2026-MidYear', label: 'Mid-year 2026', type: 'mid_year',
    startDate: '2026-07-01', endDate: '2026-07-31',
    status: 'planned', autoEvalDeadline: '2026-07-15',
    managerEvalDeadline: '2026-07-25', participantsCount: 0, completionPct: 0 },
  { id: 'cyc-2025-annuel', ref: 'EVAL-2025-Annuel', label: 'Annuel 2025', type: 'annuel',
    startDate: '2025-04-01', endDate: '2025-06-30',
    status: 'closed', autoEvalDeadline: '2025-05-15',
    managerEvalDeadline: '2025-06-05', calibrationDate: '2025-06-15', closedAt: '2025-06-30',
    participantsCount: 12, completionPct: 100 },
];
export const activeCycle = CYCLES.find((c) => c.status === 'in_progress')!;
export const cycleById = (id: string) => CYCLES.find((c) => c.id === id);

// ─────────────────────────────────────── Évaluations (1 par collaborateur)
function pickStatus(i: number): EvaluationStatus {
  if (i < 3) return 'signed';
  if (i < 6) return 'shared';
  if (i < 9) return 'calibration';
  if (i < 11) return 'manager_submitted';
  if (i < 13) return 'auto_submitted';
  return 'auto_in_progress';
}
function pickPerf(i: number): 'low' | 'meets' | 'exceeds' | 'outstanding' {
  const r = i % 10;
  if (r < 1) return 'outstanding';
  if (r < 4) return 'exceeds';
  if (r < 9) return 'meets';
  return 'low';
}
function pickPot(i: number): 'low' | 'core' | 'high' | 'top' {
  const r = (i * 7) % 10;
  if (r < 1) return 'top';
  if (r < 3) return 'high';
  if (r < 8) return 'core';
  return 'low';
}

function makeScores(seed: number): ScoreRow[] {
  return EVAL_DIMENSIONS.map((d, i) => {
    const auto = 3 + ((seed + i) % 3) * 0.5;
    const mgr  = 3 + ((seed + i + 1) % 3) * 0.5;
    return {
      dimension: d.label,
      weight: d.weight,
      autoScore: auto,
      managerScore: mgr,
      finalScore: Math.round(((auto + mgr) / 2) * 10) / 10,
    };
  });
}

export const EVALUATIONS: Evaluation[] = EMPLOYEES.map((e, i) => {
  const seed = parseInt(e.id.replace('e', ''), 10);
  const status = pickStatus(i);
  const performanceRating = pickPerf(seed);
  const potentialRating = pickPot(seed);
  const scores = makeScores(seed);
  const overall = scores.reduce((s, sc) => s + (sc.finalScore ?? 0) * sc.weight, 0) / 100;
  return {
    id: `ev-${e.id}`,
    ref: `EVAL-2026-AN-${String(i + 1).padStart(4, '0')}`,
    cycleId: activeCycle.id,
    employeeId: e.id,
    managerEmployeeId: e.manager ? EMPLOYEES.find((m) => `${m.firstName} ${m.lastName}` === e.manager)?.id ?? 'e1' : 'e1',
    status,
    autoSubmittedAt: status !== 'not_started' && status !== 'auto_in_progress' ? '2026-05-12' : undefined,
    managerSubmittedAt: ['manager_submitted','feedback_360','calibration','shared','signed','closed'].includes(status) ? '2026-06-01' : undefined,
    calibrationApprovedAt: ['shared','signed','closed'].includes(status) ? '2026-06-15' : undefined,
    sharedAt: ['shared','signed','closed'].includes(status) ? '2026-06-18' : undefined,
    signedAt: status === 'signed' ? '2026-06-20' : undefined,
    overallScore: Math.round(overall * 10) / 10,
    performanceRating,
    potentialRating,
    scores,
    strengths: 'Forte capacité d\'exécution · esprit d\'équipe reconnu · prise d\'initiative sur sujets transverses.',
    developmentAreas: 'Renforcer le leadership transverse · poser une stratégie produit à 12 mois.',
    managerComments: 'Année très solide — pilier sur son périmètre. Plan dev orienté leadership et exposition Comex.',
    employeeComments: 'Année dense, satisfait de l\'évolution. Souhait : prendre plus de responsabilités cross-pays.',
  };
});
export const evaluationByEmployee = (empId: string) => EVALUATIONS.find((e) => e.employeeId === empId);
export const evaluationById = (id: string) => EVALUATIONS.find((e) => e.id === id);

// ─────────────────────────────────────── Feedback 360
export const FEEDBACK_360: Feedback360[] = EVALUATIONS.flatMap((ev) => {
  const empSeed = parseInt(ev.employeeId.replace('e', ''), 10);
  const peers = EMPLOYEES.filter((e) => e.id !== ev.employeeId).slice(0, 2);
  const fbs: Feedback360[] = [];
  // Manager feedback (always)
  fbs.push({
    id: `fb-${ev.id}-mgr`, evaluationId: ev.id, participantEmployeeId: ev.managerEmployeeId,
    role: 'manager', submittedAt: ev.managerSubmittedAt, status: ev.managerSubmittedAt ? 'submitted' : 'in_progress',
    scores: EVAL_DIMENSIONS.map((d, i) => ({ dimension: d.label, score: 3 + ((empSeed + i) % 3) * 0.5 })),
  });
  // 2 peers
  peers.forEach((p, i) => {
    fbs.push({
      id: `fb-${ev.id}-peer-${i}`, evaluationId: ev.id, participantEmployeeId: p.id,
      role: 'peer', submittedAt: i === 0 ? '2026-05-28' : undefined,
      status: i === 0 ? 'submitted' : 'invited',
      scores: EVAL_DIMENSIONS.map((d, j) => ({ dimension: d.label, score: 3 + ((empSeed + j + i) % 3) * 0.5 })),
    });
  });
  // Self
  fbs.push({
    id: `fb-${ev.id}-self`, evaluationId: ev.id, participantEmployeeId: ev.employeeId,
    role: 'self', submittedAt: ev.autoSubmittedAt, status: ev.autoSubmittedAt ? 'submitted' : 'in_progress',
    scores: EVAL_DIMENSIONS.map((d, i) => ({ dimension: d.label, score: 3 + ((empSeed + i) % 3) * 0.5 })),
  });
  return fbs;
});
export const feedbacksByEval = (evId: string) => FEEDBACK_360.filter((f) => f.evaluationId === evId);

// ─────────────────────────────────────── Calibration sessions
export const CALIBRATIONS: CalibrationSession[] = [
  { id: 'cal-tech', ref: 'CAL-2026-Tech', cycleId: activeCycle.id, scopeLabel: 'Pôle Technologie',
    scheduledAt: '2026-06-12', status: 'planned',
    facilitatorEmployeeId: 'e3', participantsEmployeeIds: ['e1','e3'],
    evaluationsCount: EMPLOYEES.filter(e => e.department === 'Technologie').length, decisionsCount: 0 },
  { id: 'cal-cmcl', ref: 'CAL-2026-Cmcl', cycleId: activeCycle.id, scopeLabel: 'Pôle Ventes',
    scheduledAt: '2026-06-13', status: 'planned',
    facilitatorEmployeeId: 'e3', participantsEmployeeIds: ['e1','e3'],
    evaluationsCount: EMPLOYEES.filter(e => e.department === 'Ventes').length, decisionsCount: 0 },
  { id: 'cal-corp', ref: 'CAL-2026-Corp', cycleId: activeCycle.id, scopeLabel: 'Direction & Corporate',
    scheduledAt: '2026-06-15', status: 'planned',
    facilitatorEmployeeId: 'e1', participantsEmployeeIds: ['e1','e3'],
    evaluationsCount: EMPLOYEES.filter(e => ['Finance','Ressources Humaines','Opérations'].includes(e.department)).length, decisionsCount: 0 },
];

// ─────────────────────────────────────── 9-box assignments
export const TALENT_BOXES: TalentBoxAssignment[] = EVALUATIONS.map((ev) => {
  // map outstanding → exceeds for axe X, top → high for axe Y
  const perf: 'low' | 'meets' | 'exceeds' = ev.performanceRating === 'low' ? 'low' : ev.performanceRating === 'meets' ? 'meets' : 'exceeds';
  const pot: 'low' | 'core' | 'high' = ev.potentialRating === 'low' ? 'low' : ev.potentialRating === 'core' ? 'core' : 'high';
  return {
    evaluationId: ev.id, employeeId: ev.employeeId, cycleId: ev.cycleId,
    performance: perf, potential: pot, box: boxKey(perf, pot),
    rationale: 'Position calibrée commission RH · revue annuelle 2026',
  };
});
export const boxOfEmployee = (empId: string) => TALENT_BOXES.find((t) => t.employeeId === empId);

// ─────────────────────────────────────── Plans de développement
export const DEV_PLANS: DevelopmentPlan[] = EVALUATIONS.filter((ev) => ev.performanceRating !== 'low').slice(0, 10).map((ev, i) => ({
  id: `dp-${ev.id}`, ref: `DP-2026-${String(i + 1).padStart(4, '0')}`,
  evaluationId: ev.id, employeeId: ev.employeeId, cycleId: ev.cycleId,
  managerEmployeeId: ev.managerEmployeeId,
  status: i < 3 ? 'in_progress' : i < 7 ? 'agreed' : 'draft',
  reviewDate: '2026-12-15',
  actions: [
    { id: `dpa-${ev.id}-1`, category: 'formation', title: 'Programme Leadership Advanced (40 h)', status: i < 3 ? 'in_progress' : 'planned', deadline: '2026-10-30', ownerEmployeeId: ev.employeeId },
    { id: `dpa-${ev.id}-2`, category: 'mentorat',  title: `Mentorat exec (mensuel) avec ${ev.managerEmployeeId === 'e1' ? 'CEO' : 'Awa Koné'}`, status: 'planned', deadline: '2026-12-15', ownerEmployeeId: ev.managerEmployeeId },
    { id: `dpa-${ev.id}-3`, category: 'mission_transverse', title: 'Lead projet stratégique cross-département', status: 'planned', deadline: '2026-12-31', ownerEmployeeId: ev.employeeId },
  ],
}));
export const devPlanByEmployee = (empId: string) => DEV_PLANS.find((d) => d.employeeId === empId);

// ─────────────────────────────────────── 1-1 rituels
export const ONE_ON_ONES: OneOnOne[] = EMPLOYEES.filter((e) => e.manager).slice(0, 10).flatMap((e, i) => {
  const mgrId = EMPLOYEES.find((m) => `${m.firstName} ${m.lastName}` === e.manager)?.id ?? 'e1';
  const dates = ['2026-05-19','2026-06-02','2026-06-16'];
  return dates.map((d, k) => ({
    id: `oo-${e.id}-${k}`,
    managerEmployeeId: mgrId, employeeId: e.id,
    scheduledAt: `${d}T10:${(i * 5) % 60}:00Z`,
    durationMin: 30, cadence: 'biweekly' as const,
    status: k < 2 ? 'completed' as const : 'planned' as const,
    agenda: 'Revue progrès · blockers · feedback · plan développement',
    notes: k < 2 ? 'RAS · bon momentum sur le périmètre' : undefined,
    followUpActions: k === 0 ? 'Lancer formation Leadership · cadrer projet stratégique' : undefined,
  }));
});

// ─────────────────────────────────────── KPIs
export function kpis(): EvalKPI {
  const totalEvals = EVALUATIONS.length;
  const completed = EVALUATIONS.filter((e) => ['shared','signed','closed'].includes(e.status)).length;
  const autoSub = EVALUATIONS.filter((e) => !!e.autoSubmittedAt).length;
  const mgrSub = EVALUATIONS.filter((e) => !!e.managerSubmittedAt).length;
  const avgScore = EVALUATIONS.reduce((s, e) => s + (e.overallScore ?? 0), 0) / Math.max(1, EVALUATIONS.length);
  const high = TALENT_BOXES.filter((t) => t.potential === 'high').length;
  const lowPerf = TALENT_BOXES.filter((t) => t.performance === 'low').length;
  return {
    cyclesActifs: CYCLES.filter((c) => c.status === 'in_progress' || c.status === 'calibration').length,
    campagnesEnCours: CALIBRATIONS.filter((c) => c.status === 'planned' || c.status === 'in_progress').length,
    evaluationsActives: totalEvals,
    completionPct: Math.round((completed / totalEvals) * 100),
    autoEvalSubmittedPct: Math.round((autoSub / totalEvals) * 100),
    managerEvalSubmittedPct: Math.round((mgrSub / totalEvals) * 100),
    calibrationPlanifiees: CALIBRATIONS.length,
    scoresMoyens: Math.round(avgScore * 10) / 10,
    hautPotentielPct: Math.round((high / totalEvals) * 100),
    bas_perfPct: Math.round((lowPerf / totalEvals) * 100),
    plansDevActifs: DEV_PLANS.length,
  };
}
