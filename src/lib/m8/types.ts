/**
 * M8 ÉVALUATIONS — types du module Performance & Talents.
 * Cycles annuels / semestriels / probatoires, autoévaluation + manager + 360°,
 * calibration HR commission, 9-box performance × potentiel, plans de
 * développement, rituels 1-1.
 */

export type EvalCycleType = 'annuel' | 'semestriel' | 'probatoire' | 'mid_year' | '360';
export type EvalCycleStatus = 'planned' | 'launched' | 'in_progress' | 'calibration' | 'closed';

export interface EvalCycle {
  id: string;
  ref: string;                 // EVAL-2026-Annuel
  label: string;
  type: EvalCycleType;
  startDate: string;
  endDate: string;
  status: EvalCycleStatus;
  autoEvalDeadline: string;
  managerEvalDeadline: string;
  calibrationDate?: string;
  closedAt?: string;
  participantsCount: number;
  completionPct: number;
}

export type EvaluationStatus = 'not_started' | 'auto_in_progress' | 'auto_submitted' | 'manager_in_progress' | 'manager_submitted' | 'feedback_360' | 'calibration' | 'shared' | 'signed' | 'closed';

export interface ScoreRow {
  dimension: string;             // 'Performance', 'Compétences', 'Comportements', 'OKR'
  weight: number;                // pourcentage (somme = 100)
  autoScore?: number;            // 1-5
  managerScore?: number;
  finalScore?: number;
  notes?: string;
}

export interface Evaluation {
  id: string;
  ref: string;                   // EVAL-2026-AN-0042
  cycleId: string;
  employeeId: string;
  managerEmployeeId: string;
  status: EvaluationStatus;
  autoSubmittedAt?: string;
  managerSubmittedAt?: string;
  calibrationApprovedAt?: string;
  sharedAt?: string;
  signedAt?: string;
  overallScore?: number;         // 1-5 final pondéré
  performanceRating?: 'low' | 'meets' | 'exceeds' | 'outstanding';
  potentialRating?: 'low' | 'core' | 'high' | 'top';
  scores: ScoreRow[];
  strengths?: string;
  developmentAreas?: string;
  managerComments?: string;
  employeeComments?: string;
  acknowledgmentSignedAt?: string;
}

export type FeedbackRole = 'self' | 'manager' | 'peer' | 'direct_report' | 'cross';
export interface Feedback360 {
  id: string;
  evaluationId: string;
  participantEmployeeId?: string;  // peut être null si invité externe
  role: FeedbackRole;
  submittedAt?: string;
  status: 'invited' | 'in_progress' | 'submitted' | 'declined';
  scores?: { dimension: string; score: number }[];
  strengths?: string;
  developmentAreas?: string;
  freeText?: string;
}

export interface CalibrationSession {
  id: string;
  ref: string;
  cycleId: string;
  scopeLabel: string;            // 'Direction Tech' / 'Toute l\'entreprise'
  scheduledAt: string;
  status: 'planned' | 'in_progress' | 'closed';
  facilitatorEmployeeId: string;
  participantsEmployeeIds: string[];
  evaluationsCount: number;
  decisionsCount: number;
  notes?: string;
}

export type TalentBoxKey =
  | 'A1' | 'A2' | 'A3'
  | 'B1' | 'B2' | 'B3'
  | 'C1' | 'C2' | 'C3';

export interface TalentBoxAssignment {
  evaluationId: string;
  employeeId: string;
  cycleId: string;
  performance: 'low' | 'meets' | 'exceeds';   // axe X
  potential: 'low' | 'core' | 'high';          // axe Y
  box: TalentBoxKey;
  rationale?: string;
}

export type DevPlanCategory =
  | 'formation' | 'mentorat' | 'coaching' | 'mission_transverse'
  | 'mobilité_interne' | 'lecture_certif' | 'shadow' | 'autre';

export interface DevelopmentAction {
  id: string;
  category: DevPlanCategory;
  title: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  deadline: string;
  ownerEmployeeId: string;
  notes?: string;
}

export interface DevelopmentPlan {
  id: string;
  ref: string;
  evaluationId: string;
  employeeId: string;
  cycleId: string;
  managerEmployeeId: string;
  actions: DevelopmentAction[];
  reviewDate?: string;
  status: 'draft' | 'agreed' | 'in_progress' | 'completed';
}

export interface OneOnOne {
  id: string;
  managerEmployeeId: string;
  employeeId: string;
  scheduledAt: string;
  durationMin: number;
  cadence: 'weekly' | 'biweekly' | 'monthly';
  status: 'planned' | 'completed' | 'rescheduled' | 'cancelled';
  agenda?: string;
  notes?: string;
  followUpActions?: string;
}

export interface EvalKPI {
  cyclesActifs: number;
  campagnesEnCours: number;
  evaluationsActives: number;
  completionPct: number;
  autoEvalSubmittedPct: number;
  managerEvalSubmittedPct: number;
  calibrationPlanifiees: number;
  scoresMoyens: number;          // 0-5
  hautPotentielPct: number;
  bas_perfPct: number;
  plansDevActifs: number;
}
