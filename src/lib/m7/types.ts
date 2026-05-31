/**
 * M7 OKR — Objectifs & Key Results (méthodologie Doerr / Google).
 * Cascade Entreprise → Département → Équipe → Individu.
 * Cycle trimestriel ou semestriel. Scoring 0.0-1.0. Check-ins hebdo.
 */

export type OkrLevel = 'company' | 'department' | 'team' | 'individual';
export type OkrCycleStatus = 'planned' | 'active' | 'review' | 'closed';
export type ConfidenceLevel = 'green' | 'amber' | 'red';
export type KrType = 'numeric' | 'percent' | 'binary' | 'milestone' | 'currency';
export type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'abandoned';

export interface OkrCycle {
  id: string;
  ref: string;                   // OKR-2026-Q2
  label: string;                 // 'Q2 2026' | 'S1 2026'
  startDate: string;
  endDate: string;
  status: OkrCycleStatus;
  checkInCadence: 'weekly' | 'biweekly';
  reviewDate?: string;
  objectivesCount: number;
}

export interface Objective {
  id: string;
  ref: string;                   // OBJ-Q2-2026-…
  cycleId: string;
  level: OkrLevel;
  title: string;
  description?: string;
  ownerEmployeeId?: string;      // individu/team lead/dept lead
  ownerTeam?: string;            // department/team label si pas d'owner
  parentObjectiveId?: string;    // alignement cascade
  status: ObjectiveStatus;
  progress: number;              // 0-1 (moyenne pondérée KR)
  confidence: ConfidenceLevel;
  startedAt: string;
  closedAt?: string;
  finalScore?: number;           // 0.0-1.0 (post-clôture)
  retrospective?: string;
}

export interface KeyResult {
  id: string;
  ref: string;                   // KR-…
  objectiveId: string;
  title: string;
  type: KrType;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit?: string;                 // % / k FCFA / nb …
  ownerEmployeeId?: string;
  weight: number;                // 1-5 (importance)
  confidence: ConfidenceLevel;
  lastUpdatedAt: string;
}

export interface CheckIn {
  id: string;
  ref: string;
  objectiveId: string;
  authorEmployeeId: string;
  weekOf: string;                // YYYY-WW
  submittedAt: string;
  progressDelta: number;         // changement de progression depuis la semaine d'avant
  confidence: ConfidenceLevel;
  highlights: string;
  blockers?: string;
  nextSteps?: string;
}

export interface AlignmentEdge {
  childObjectiveId: string;
  parentObjectiveId: string;
  contribution: 'primary' | 'secondary';
}

export interface OkrKPI {
  cyclesActifs: number;
  objectifsActifs: number;
  krsActifs: number;
  progressionMoyenne: number;    // 0-1
  confidenceGreenPct: number;
  checkInsEnRetard: number;
  alignementCoveragePct: number; // % objectifs équipe/indiv liés à un parent
  scoreMoyenCloture: number;     // 0-1
}
