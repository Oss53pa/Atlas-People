/**
 * M6 ONBOARDING — types du module Intégration des nouveaux arrivants (90 jours).
 * Parcours 30/60/90 jours, tâches admin/IT/workspace, buddy program, pulse feedback,
 * documents de bienvenue, validation période d'essai (lien M4).
 */

export type MilestoneCode = 'PRE_J7' | 'J0' | 'J7' | 'J30' | 'J60' | 'J90';
export type TaskCategory =
  | 'ADMIN' | 'IT' | 'WORKSPACE' | 'FORMATION' | 'BUDDY' | 'TEAM' | 'BUSINESS' | 'CULTURE';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
export type OwnerRole = 'rh' | 'manager' | 'it' | 'office' | 'buddy' | 'newcomer';

export interface OnboardingTask {
  id: string;
  ref: string;                // ONB-2026-…
  journeyId: string;
  title: string;
  category: TaskCategory;
  milestone: MilestoneCode;
  dueDate: string;
  status: TaskStatus;
  ownerRole: OwnerRole;
  ownerEmployeeId?: string;
  completedAt?: string;
  notes?: string;
  blocking?: boolean;         // bloque le passage à la milestone suivante
}

export interface OnboardingMilestone {
  code: MilestoneCode;
  label: string;
  daysFromHire: number;       // négatif pour PRE_J7
  required: boolean;
}

export interface OnboardingJourney {
  id: string;
  ref: string;                // PARC-2026-…
  employeeId: string;
  templateCode: string;
  hireDate: string;
  buddyEmployeeId?: string;
  managerEmployeeId: string;
  hrLeadEmployeeId: string;
  status: 'planned' | 'in_progress' | 'completed' | 'extended' | 'failed';
  progressPct: number;        // 0-100
  startedAt?: string;
  completedAt?: string;
  nps?: number;               // NPS final (-100 à 100, donné J90)
}

export interface OnboardingTemplate {
  code: string;
  label: string;
  description: string;
  appliesTo: string;          // 'Tous' / 'Cadres' / 'Tech' / 'Commercial' / 'Stage'
  durationDays: number;       // 90 par défaut
  taskCount: number;
  active: boolean;
}

export interface PulseFeedback {
  id: string;
  journeyId: string;
  milestone: 'J7' | 'J30' | 'J60' | 'J90';
  submittedAt: string;
  overallScore: number;       // 1-5
  npsScore?: number;          // -100 à 100 (uniquement J90)
  answers: { question: string; score: number; comment?: string }[];
  freeText?: string;
}

export interface BuddyAssignment {
  id: string;
  buddyEmployeeId: string;
  newcomerEmployeeId: string;
  journeyId: string;
  startedAt: string;
  weeklyHours: number;        // heures dédiées par semaine
  status: 'active' | 'completed' | 'switched';
  satisfactionScore?: number; // 1-5 — donné par le newcomer
}

export interface MandatoryTraining {
  code: string;
  label: string;
  durationHours: number;
  format: 'elearning' | 'classroom' | 'mixed';
  required: boolean;
}

export interface TrainingCompletion {
  id: string;
  journeyId: string;
  trainingCode: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  assignedAt: string;
  completedAt?: string;
  score?: number;             // % résultat quiz
}

export interface WelcomeDocument {
  code: string;
  label: string;
  category: 'livret' | 'charte' | 'guide' | 'organigramme' | 'process';
  signatureRequired: boolean;
}

export interface DocumentDelivery {
  id: string;
  journeyId: string;
  docCode: string;
  status: 'pending' | 'sent' | 'read' | 'signed';
  sentAt?: string;
  signedAt?: string;
}

// ─────────────────────────────────────── Cockpit / KPIs
export interface OnboardingKPI {
  arrivantsActifs: number;
  prochainsJ7: number;        // hires dans 7 jours
  completionMoyenne: number;  // % tâches complétées
  npsJ90: number;             // NPS moyen sur les 12 derniers mois
  tachesEnRetard: number;
  pulsesPendings: number;
  buddyPairings: number;
  timeToProductivityJours: number;
}
