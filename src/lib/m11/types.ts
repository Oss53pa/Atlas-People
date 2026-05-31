/**
 * M11 FORMATION — types du module Apprentissage & Développement.
 * Catalogue (e-learning + présentiel + blended), plans annuels par BU,
 * sessions, inscriptions, évaluations Kirkpatrick 4 niveaux, ROI,
 * déclarations FDFP/CDC OHADA, certifications, cartographie compétences.
 */

// ─────────────────────────────────────── Catalogue formations
export type LearningModality = 'e_learning' | 'classroom' | 'blended' | 'workshop' | 'coaching' | 'mentoring' | 'conference' | 'certification_prep';
export type LearningProvider = 'internal' | 'external' | 'mooc';
export type LearningCategory =
  | 'leadership' | 'management' | 'technical' | 'business' | 'language'
  | 'compliance' | 'safety' | 'product' | 'sales' | 'soft_skills' | 'digital' | 'finance';
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type CourseStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface CourseObjective {
  /** Objectif pédagogique mesurable (action verb). */
  text: string;
  /** Compétence ciblée (code M9). */
  skillCode?: string;
  /** Niveau ciblé 1-5 (M9). */
  targetLevel?: number;
}

export interface Course {
  id: string;
  ref: string;                      // FRM-2026-0142
  title: string;
  modality: LearningModality;
  provider: LearningProvider;
  providerName: string;
  category: LearningCategory;
  level: LearningLevel;
  language: 'FR' | 'EN' | 'BIL';
  durationHours: number;
  /** Coût par participant (FCFA). */
  costPerHead: number;
  /** Coût session (forfait, FCFA) pour présentiel intra. */
  costPerSession?: number;
  minParticipants?: number;
  maxParticipants?: number;
  summary: string;
  objectives: CourseObjective[];
  prerequisites?: string[];
  certificationCode?: string;       // si délivre une certification
  fdfpEligible: boolean;            // imputable FDFP (CI)
  status: CourseStatus;
  /** Évaluation Kirkpatrick prévue (niveaux activés). */
  kirkpatrickLevels: 1 | 2 | 3 | 4;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

// ─────────────────────────────────── Plan de formation annuel
export type PlanStatus = 'draft' | 'pending_drh' | 'pending_daf' | 'pending_dg' | 'approved' | 'in_execution' | 'closed';
export type PlanItemStatus = 'planned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type PlanOrigin = 'evaluation' | 'okr' | 'career_path' | 'legal' | 'strategic' | 'individual_request';

export interface PlanItem {
  id: string;
  courseId: string;
  targetEmployeeIds: string[];      // bénéficiaires identifiés
  targetTeams?: string[];
  origin: PlanOrigin;
  priority: 'critical' | 'high' | 'medium' | 'low';
  forecastQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  forecastCost: number;             // FCFA total ligne
  realisedCost?: number;
  status: PlanItemStatus;
  rationale?: string;
}

export interface TrainingPlan {
  id: string;
  ref: string;                      // PLN-2026
  year: number;
  scope: 'company' | 'BU' | 'department';
  scopeLabel: string;
  status: PlanStatus;
  budgetEnvelope: number;           // FCFA validé
  budgetConsumed: number;
  fdfpRebateForecast: number;       // remboursement FDFP estimé (CI)
  beneficiariesForecast: number;
  hoursForecast: number;
  items: PlanItem[];
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
  createdById: string;
}

// ─────────────────────────────────────────── Sessions
export type SessionStatus = 'scheduled' | 'open_registration' | 'closed_registration' | 'in_progress' | 'completed' | 'cancelled';
export type SessionDeliveryMode = 'on_site' | 'remote' | 'hybrid';

export interface SessionTrainer {
  type: 'internal' | 'external';
  employeeId?: string;
  externalName?: string;
  organization?: string;
  hourlyRate?: number;
}

export interface SessionDay {
  date: string;                     // YYYY-MM-DD
  startTime: string;                // HH:mm
  endTime: string;
}

export interface TrainingSession {
  id: string;
  ref: string;                      // SES-2026-0089
  courseId: string;
  planId?: string;
  status: SessionStatus;
  deliveryMode: SessionDeliveryMode;
  location?: string;
  meetingUrl?: string;
  trainers: SessionTrainer[];
  days: SessionDay[];
  totalHours: number;
  capacity: number;
  registeredCount: number;
  waitlistCount: number;
  attendedCount?: number;
  completionRate?: number;          // 0-1
  averageScore?: number;            // moyenne quiz éval acquis (L2)
  averageReactionScore?: number;    // moyenne satisfaction (L1) 1-5
  costTotal: number;                // coût réel session
  countryCode: string;
  fdfpDeclarationRef?: string;      // si déclaré
}

// ───────────────────────────────────────── Inscriptions
export type RegistrationStatus =
  | 'requested' | 'waitlisted' | 'approved' | 'confirmed' | 'attended'
  | 'partial' | 'no_show' | 'completed' | 'failed' | 'cancelled';

export interface Registration {
  id: string;
  ref: string;                      // REG-2026-…
  sessionId: string;
  employeeId: string;
  status: RegistrationStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedById?: string;
  confirmedAt?: string;
  attendedHours?: number;
  /** Score quiz d'évaluation acquis (0-100). */
  learningScore?: number;
  /** Score satisfaction (1-5). */
  reactionScore?: number;
  /** Note narratif. */
  reactionComment?: string;
  certificateId?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  /** Coût alloué à ce participant. */
  allocatedCost: number;
}

// ──────────────────────────────────────── Évaluation Kirkpatrick
export type KirkpatrickLevel = 1 | 2 | 3 | 4;
export type KirkpatrickStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface KirkpatrickEvaluation {
  id: string;
  sessionId: string;
  level: KirkpatrickLevel;
  /** Délai après la formation (jours). */
  triggerDays: number;
  status: KirkpatrickStatus;
  launchedAt?: string;
  closedAt?: string;
  /** Cible nb répondants. */
  targetRespondents: number;
  respondents: number;
  /** Score agrégé selon niveau (1-5 pour L1/L3, 0-100 pour L2/L4 ROI). */
  aggregateScore?: number;
  /** Insights/synthesis. */
  insights?: string[];
}

// ─────────────────────────────────────── Certifications
export type CertificationStatus = 'active' | 'expired' | 'revoked' | 'pending_renewal';
export interface Certification {
  id: string;
  ref: string;                      // CERT-2026-…
  employeeId: string;
  courseId: string;
  certificateCode: string;
  issuedAt: string;
  expiresAt?: string;               // pour certifs périssables (HSE…)
  issuer: string;                   // organisme certificateur
  status: CertificationStatus;
  pdfUrl?: string;                  // mock
  validatedById?: string;
}

// ──────────────────────────────────────────── ROI Formation
export interface RoiCalculation {
  /** Coût total (FCFA) — formation + temps salariés + opportunité. */
  totalCost: number;
  /** Gain estimé (FCFA) sur 12 mois — productivité, baisse turnover, qualité… */
  estimatedGain12m: number;
  /** Ratio (gain - coût) / coût. */
  roi: number;
  /** Méthode utilisée. */
  method: 'Phillips' | 'Kirkpatrick_L4' | 'Productivity_Delta' | 'Turnover_Reduction';
  /** Période d'amortissement (mois). */
  paybackMonths?: number;
}

// ─────────────────────────────────── FDFP / déclarations
export type FdfpDeclarationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'reimbursed' | 'rejected';
export interface FdfpDeclaration {
  id: string;
  ref: string;                      // FDFP-2026-001
  countryCode: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  status: FdfpDeclarationStatus;
  sessionsCount: number;
  hoursTotal: number;
  beneficiariesCount: number;
  costDeclared: number;             // FCFA
  rebateExpected: number;           // FCFA remboursement attendu
  rebateReceived?: number;
  submittedAt?: string;
  reimbursedAt?: string;
  rejectionReason?: string;
}

// ───────────────────────────────────────── Cartographie compétences acquises
export interface SkillUpliftEntry {
  employeeId: string;
  skillCode: string;
  preLevel: number;                 // 1-5 (avant)
  postLevel: number;                // 1-5 (après)
  acquiredViaSessionId: string;
  acquiredAt: string;
}

// ─────────────────────────────────────────── KPIs Cockpit
export interface FormationKPI {
  beneficiairesYTD: number;
  /** Taux accès = collab ayant ≥ 1 formation / effectif total. */
  tauxAcces: number;                // 0-1
  heuresMoyennesParCollab: number;
  budgetConsomme: number;
  budgetTotal: number;
  satisfactionMoyenneL1: number;    // 1-5
  acquisMoyenL2: number;            // 0-100
  transfertL3: number;              // 0-1 (% confirmé par manager)
  roiMoyen: number;                 // ratio
  certificationsActives: number;
  certificationsExpirantes30j: number;
  sessionsPlanifiees30j: number;
  fdfpRecuperableYTD: number;
}
