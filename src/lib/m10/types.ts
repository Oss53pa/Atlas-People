/**
 * M10 CARRIÈRES & SUCCESSION — types du module.
 * Filières métier · trajectoires · postes clés · plans de succession · hauts potentiels · mentorat.
 */

export type CareerPathType = 'vertical' | 'horizontal' | 'expert';

export interface CareerLevel {
  level: number;               // 1-7
  title: string;
  minYearsExperience: number;
  scope: string;               // 'Individuel' / 'Équipe' / 'Département' / 'Entreprise'
}

export interface CareerFiliere {
  code: string;
  label: string;
  department: string;
  type: CareerPathType;
  description: string;
  levels: CareerLevel[];
  activeEmployeesCount: number;
}

export interface CareerTrajectory {
  id: string;
  employeeId: string;
  filiereCode: string;
  currentLevel: number;
  joinedAt: string;
  nextStepTarget?: string;     // ex. 'Lead Developer dans 18 mois'
  nextStepETA?: string;        // YYYY-MM
  readinessPct: number;        // 0-100
  blockers?: string[];
  aspirations?: string;
}

export type SuccessorReadiness = 'ready_now' | '1_2_years' | '3_5_years';

export interface CriticalRole {
  id: string;
  ref: string;                 // CR-2026-…
  title: string;
  department: string;
  currentHolderEmployeeId: string;
  criticality: 'high' | 'medium' | 'low'; // impact si départ
  successorsCount: number;
  benchStrength: 'strong' | 'adequate' | 'weak' | 'none';
}

export interface SuccessorMapping {
  id: string;
  criticalRoleId: string;
  candidateEmployeeId: string;
  readiness: SuccessorReadiness;
  developmentActions?: string[];
  managerNotes?: string;
}

export type HighPotProgram = 'leadership_excellence' | 'expert_track' | 'next_managers' | 'global_mobility';
export interface HighPotEmployee {
  employeeId: string;
  program: HighPotProgram;
  enrolledAt: string;
  graduationTarget: string;
  status: 'enrolled' | 'in_progress' | 'graduated' | 'churned';
  mentorEmployeeId?: string;
}

export interface MentorshipPair {
  id: string;
  mentorEmployeeId: string;
  menteeEmployeeId: string;
  startedAt: string;
  cadence: 'weekly' | 'biweekly' | 'monthly';
  focus: string;               // 'Leadership' / 'Expertise technique' / 'Stratégie'
  status: 'active' | 'completed' | 'paused';
}

export interface InternalOpportunity {
  id: string;
  ref: string;                 // OPP-2026-…
  title: string;
  department: string;
  type: 'promotion' | 'mobilite' | 'mission' | 'detachement';
  publishedAt: string;
  closingDate: string;
  applicationsCount: number;
  status: 'open' | 'closed' | 'filled';
}

export interface SkillsMappingEntry {
  employeeId: string;
  skillCode: string;
  skillLabel: string;
  level: 1 | 2 | 3 | 4 | 5;    // novice → expert
  category: 'tech' | 'leadership' | 'business' | 'soft';
  certified: boolean;
}

export interface CareerKPI {
  filieresActives: number;
  postesCleses: number;
  benchStrengthPct: number;    // % postes clés avec ≥ 1 successeur ready_now
  hautsPotentielsCount: number;
  mentorshipActifs: number;
  opportunitesOuvertes: number;
  promotionsLast12m: number;
  mobilitesLast12m: number;
  retentionTopTalentsPct: number;
  successionCoveragePct: number;
}
