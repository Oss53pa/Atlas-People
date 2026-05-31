/**
 * M5 RECRUTEMENT — types du module ATS (Applicant Tracking System).
 * Pipeline candidatures, entretiens, scorecards, offres, sourcing, cooptation.
 * Conformité RGPD : consentement, conservation 2 ans, droit à l'oubli.
 * Intégration : M4 Admin RH (candidat retenu → contrat), M6 Onboarding (handoff).
 */

// ───────────────────────────────────────── Besoin de recrutement (amont)
export type NeedType = 'CREATION' | 'REMPLACEMENT' | 'RENFORT' | 'TRANSFORMATION' | 'PROJET';
export type NeedUrgency = 'standard' | 'urgent' | 'critique';
export type NeedStatus =
  | 'draft' | 'pending_rrh' | 'pending_daf' | 'pending_drh' | 'pending_dg'
  | 'approved' | 'rejected' | 'in_progress' | 'hired' | 'closed_no_hire' | 'cancelled';
export type NeedValidationDecision = 'pending' | 'approved' | 'approved_with_changes' | 'info_requested' | 'rejected';

export interface NeedValidationStep {
  role: 'RRH' | 'DAF' | 'DRH' | 'DG';
  validatorName: string;
  required: boolean;
  decision: NeedValidationDecision;
  decidedAt?: string;
  comment?: string;
  slaDays: number;
}

export interface RecruitmentNeed {
  id: string;
  ref: string;                  // BES-2026-0245
  type: NeedType;
  volume: number;               // nb de postes
  urgency: NeedUrgency;
  status: NeedStatus;
  // poste
  title: string;
  department: string;
  hiringManagerId: string;      // employee id
  category: string;             // ex. Cadre B
  echelon?: string;
  contractType: JobContractType;
  location: string;
  countryCode: string;
  remotePolicy?: string;
  // remplacement / transformation
  replacesEmployeeId?: string;
  suppressedPositions?: string[];
  // profil (résumé — détail dans l'offre)
  experienceMin: number;
  experienceMax: number;
  educationMin: string;
  // rémunération & budget
  salaryMin: number;
  salaryMax: number;
  salaryMedian: number;
  allowancesMonthly: number;
  employerCostMonthly: number;  // estimé
  recruitmentCost: number;      // estimé one-shot
  budgetYear1: number;          // coût employé + recrutement
  budgetEnvelope?: string;      // rattachement budgétaire (ex. DC-2026)
  // calendrier
  idealStartDate: string;
  latestStartDate: string;
  forecastStartDate?: string;   // calculé
  // workflow
  createdAt: string;
  createdById: string;
  motivation: string;
  businessCase?: string;
  validations: NeedValidationStep[];
  plannedChannels: string[];    // codes canaux envisagés
  createdOfferIds?: string[];   // offres issues du besoin
}

// ─────────────────────────────────────────────────────── Postes
export type JobStatus = 'draft' | 'open' | 'on_hold' | 'closed_filled' | 'closed_cancelled';
export type JobLevel = 'junior' | 'confirme' | 'senior' | 'lead' | 'manager' | 'director';
export type JobContractType = 'CDI' | 'CDD' | 'STAGE' | 'APPR' | 'INTERIM';

export interface JobPosting {
  id: string;
  ref: string;                 // JOB-2026-0042
  title: string;
  department: string;
  location: string;
  countryCode: string;
  contractType: JobContractType;
  level: JobLevel;
  salaryRangeMin: number;
  salaryRangeMax: number;
  status: JobStatus;
  openedAt: string;
  closedAt?: string;
  targetCloseAt?: string;      // SLA time-to-fill cible
  hiringManager: string;       // employee id
  recruiter: string;           // employee id
  summary: string;
  responsibilities: string[];
  requirements: string[];
  perks: string[];
  publishedChannels: string[]; // codes canaux
  applicationsCount: number;
  remoteAllowed?: boolean;
  cooptationBonus?: number;
}

// ─────────────────────────────────────────────── Candidats & candidatures
export type ApplicationStage =
  | 'sourced' | 'applied' | 'screening' | 'interview' | 'assessment'
  | 'offer' | 'hired' | 'rejected' | 'withdrawn';

export type RecommendationLevel = 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';

export interface Candidate {
  id: string;
  anonRef: string;             // CDT-2026-… (référence anonymisable RGPD)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoSeed?: string;
  currentRole?: string;
  currentCompany?: string;
  location: string;
  countryCode: string;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  availability: string;        // 'immédiate' | '1 mois' | …
  yearsExperience: number;
  skills: string[];
  tags: string[];
  source: string;              // code canal
  referrerEmployeeId?: string; // cooptation
  rgpdConsent: boolean;
  rgpdConsentAt: string;
  rgpdRetentionUntil: string;  // +2 ans
  cvUrl?: string;              // mock
  linkedinUrl?: string;
}

export interface Application {
  id: string;
  ref: string;                 // APP-2026-…
  candidateId: string;
  jobId: string;
  stage: ApplicationStage;
  stageEnteredAt: string;
  appliedAt: string;
  score?: number;              // 0-100 (match poste/profil)
  lastActivityAt: string;
  notes?: string;
  rejectionReasonCode?: string;
  hiredAt?: string;
  withdrawnAt?: string;
}

// ─────────────────────────────────────────────── Entretiens & scorecards
export type InterviewType = 'phone_screen' | 'manager' | 'team' | 'tech' | 'culture' | 'final' | 'reference';
export type InterviewMode = 'visio' | 'physical' | 'phone';
export type InterviewStatus = 'planned' | 'completed' | 'no_show' | 'cancelled' | 'rescheduled';

export interface InterviewParticipant {
  employeeId?: string;        // panel interne
  externalName?: string;      // panel externe (consultant, …)
  role: string;
}

export interface Interview {
  id: string;
  ref: string;
  applicationId: string;
  type: InterviewType;
  mode: InterviewMode;
  scheduledAt: string;        // ISO
  durationMin: number;
  location?: string;          // adresse ou lien visio
  participants: InterviewParticipant[];
  status: InterviewStatus;
  rescheduleReason?: string;
}

export interface ScorecardCriterion {
  name: string;
  score: number;              // 1-5
  notes?: string;
}

export interface Scorecard {
  id: string;
  interviewId: string;
  applicationId: string;
  interviewerEmployeeId: string;
  submittedAt: string;
  criteria: ScorecardCriterion[];
  overall: number;            // 1-5 moyenne ou globale
  recommendation: RecommendationLevel;
  strengths?: string;
  concerns?: string;
}

// ─────────────────────────────────────────────────────── Offres
export type OfferStatus = 'draft' | 'sent' | 'negotiating' | 'accepted' | 'declined' | 'expired' | 'withdrawn';

export interface Offer {
  id: string;
  ref: string;                 // OFF-2026-…
  applicationId: string;
  status: OfferStatus;
  contractType: JobContractType;
  baseSalary: number;
  allowancesTotal: number;
  totalPackage: number;        // brut annuel
  startDate: string;
  draftAt: string;
  sentAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  declinedReason?: string;
  validUntil: string;          // expiration de l'offre
  signatureWorkflow?: 'advist_pending' | 'advist_signed_both' | 'advist_employee_pending';
}

// ──────────────────────────────────────────────────────── Sourcing
export type ChannelType = 'jobboard' | 'social' | 'school' | 'cooptation' | 'agency' | 'direct' | 'event';
export interface SourcingChannel {
  code: string;
  name: string;
  type: ChannelType;
  cost12m: number;             // FCFA
  applications12m: number;
  hires12m: number;
  active: boolean;
}

// ──────────────────────────────────────────────────────── Cooptation
export type ReferralStatus = 'submitted' | 'in_pipeline' | 'hired' | 'paid' | 'rejected';
export interface Referral {
  id: string;
  ref: string;
  referrerEmployeeId: string;
  candidateId: string;
  jobId: string;
  status: ReferralStatus;
  submittedAt: string;
  bonusAmount: number;
  paidAt?: string;
}

// ───────────────────────────────────────────── Notes & activité
export interface Note {
  id: string;
  applicationId: string;
  authorEmployeeId: string;
  at: string;
  body: string;
  visibility: 'recruiter' | 'panel' | 'all';
}

export interface ActivityEvent {
  id: string;
  at: string;
  actor: string;
  applicationId?: string;
  candidateId?: string;
  jobId?: string;
  kind: 'stage_changed' | 'interview_scheduled' | 'scorecard_submitted' | 'offer_sent' | 'offer_accepted' | 'offer_declined' | 'note_added' | 'rejected' | 'application_created';
  detail: string;
}

// ────────────────────────────────────── Vivier (talent pool)
export interface PoolEntry {
  id: string;
  candidateId: string;
  pools: string[];             // tags-pools ex. 'Data 2025', 'Top Tech', 'Future leaders'
  lastContactAt?: string;
  nextFollowupAt?: string;
  ownerEmployeeId: string;
}

// ───────────────────────────────────────────────────── KPIs Cockpit
export interface RecrutKPI {
  postesOuverts: number;
  candidaturesEnCours: number;
  entretiensSemaine: number;
  offresEnAttente: number;
  embauchesMoisCourant: number;
  timeToFillJoursMedian: number;
  acceptanceRate: number;      // % offres acceptées
  costPerHire: number;
}

// ───────────────────────────────────────────── Tests & assessments (doc 08)
export type TestCategory = 'technique' | 'psychometrique' | 'cognitif' | 'mise_situation' | 'langue' | 'assessment';
export type TestScoring = 'auto' | 'manual' | 'hybrid';
export type PassationStatus = 'invited' | 'in_progress' | 'submitted' | 'scored' | 'expired';

export interface RecruitmentTest {
  id: string;
  name: string;
  category: TestCategory;
  description: string;
  durationMin: number;
  questionsCount: number;
  scoring: TestScoring;
  maxScore: number;
  passingScore: number;        // % requis
  proctoring: boolean;         // anti-triche webcam
  copyPasteDisabled: boolean;
  tabSwitchDetection: boolean;
  passations: number;
  avgScore?: number;           // % moyen (undefined si psychométrique)
  active: boolean;
}

export interface TestPassation {
  id: string;
  testId: string;
  candidateId: string;
  applicationId?: string;
  status: PassationStatus;
  invitedAt: string;
  submittedAt?: string;
  score?: number;              // %
  passed?: boolean;
  flags?: string[];            // anti-triche (tab switch, copier-coller…)
}

// ───────────────────────────────────────────── Marque employeur (doc 13)
export interface CareerSiteSection {
  key: string;
  label: string;
  enabled: boolean;
  summary: string;
}
export interface Testimonial {
  id: string;
  employeeId?: string;
  authorName: string;
  role: string;
  quote: string;
  hasVideo: boolean;
}
export interface EmployerBrandKPI {
  visitorsMonth: number;
  visitorsDelta: number;       // % vs M-1
  conversionRate: number;      // visiteur → candidature %
  glassdoorScore: number;      // /5
  acceptanceRate: number;      // %
  spontaneousApps: number;     // /mois
}

// ───────────────────────────────────────────── Audit M5 (doc 16)
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;              // recruitment.offer.published…
  severity: AuditSeverity;
  detail: string;
  hash: string;
}
export type FraudKind = 'cooptation_abusive' | 'conflit_interet' | 'biais_discrimination' | 'offre_fictive' | 'doublon_candidat';
export interface FraudAlert {
  id: string;
  kind: FraudKind;
  severity: AuditSeverity;
  message: string;
  detectedAt: string;
  status: 'open' | 'reviewing' | 'cleared' | 'confirmed';
}
