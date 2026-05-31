/**
 * M10 CARRIÈRES — données démo.
 * Filières par département · trajectoires individuelles · 8 postes clés
 * avec successeurs identifiés · pool hauts potentiels · mentorat actif.
 */
import { EMPLOYEES } from '../../data/mock';
import { CAREER_LEVELS } from './referentiels';
import type {
  CareerFiliere, CareerTrajectory, CriticalRole, SuccessorMapping,
  HighPotEmployee, MentorshipPair, InternalOpportunity, SkillsMappingEntry, CareerKPI,
} from './types';

// ─────────────────────────────────────── Filières
function buildLevels(opts: Partial<Record<number, string>>) {
  return CAREER_LEVELS.map((l) => ({
    level: l.level,
    title: opts[l.level] ?? l.title,
    minYearsExperience: l.minYears,
    scope: l.scope,
  }));
}
export const FILIERES: CareerFiliere[] = [
  { code: 'TECH-ENG', label: 'Engineering', department: 'Technologie', type: 'vertical',
    description: 'Filière développement & ingénierie · vertical management',
    levels: buildLevels({ 1: 'Junior Engineer', 2: 'Engineer', 3: 'Senior Engineer', 4: 'Lead Engineer', 5: 'Engineering Manager', 6: 'Director Engineering', 7: 'VP Engineering' }),
    activeEmployeesCount: EMPLOYEES.filter(e => e.department === 'Technologie').length },
  { code: 'TECH-EXP', label: 'Tech Expert', department: 'Technologie', type: 'expert',
    description: 'Filière individual contributor expert · pas de management',
    levels: buildLevels({ 1: 'Junior IC', 2: 'IC', 3: 'Senior IC', 4: 'Staff IC', 5: 'Principal IC', 6: 'Distinguished IC', 7: 'Fellow' }),
    activeEmployeesCount: 0 },
  { code: 'COMMERCIAL', label: 'Commercial / Ventes', department: 'Ventes', type: 'vertical',
    description: 'Filière commerciale · account management',
    levels: buildLevels({ 1: 'Junior AE', 2: 'Account Executive', 3: 'Senior AE', 4: 'Account Director', 5: 'Sales Manager', 6: 'Director Sales', 7: 'VP Sales' }),
    activeEmployeesCount: EMPLOYEES.filter(e => e.department === 'Ventes').length },
  { code: 'RH', label: 'Ressources Humaines', department: 'Ressources Humaines', type: 'vertical',
    description: 'Filière RH · de chargé à DRH',
    levels: buildLevels({ 1: 'Assistant RH', 2: 'Chargé RH', 3: 'Senior HRBP', 4: 'Lead HRBP', 5: 'Head of People Ops', 6: 'DRH adjoint', 7: 'DRH groupe' }),
    activeEmployeesCount: EMPLOYEES.filter(e => e.department === 'Ressources Humaines').length },
  { code: 'FIN', label: 'Finance & Comptabilité', department: 'Finance', type: 'vertical',
    description: 'Filière finance · contrôle de gestion · direction financière',
    levels: buildLevels({ 1: 'Junior Compta', 2: 'Comptable', 3: 'Senior Comptable', 4: 'Contrôleur de gestion', 5: 'Finance Manager', 6: 'Director Finance', 7: 'CFO' }),
    activeEmployeesCount: EMPLOYEES.filter(e => e.department === 'Finance').length },
  { code: 'OPS', label: 'Opérations', department: 'Opérations', type: 'horizontal',
    description: 'Filière opérationnelle transverse · multi-métiers',
    levels: buildLevels({ 1: 'Agent', 2: 'Coordinateur', 3: 'Senior Ops', 4: 'Lead Ops', 5: 'Ops Manager', 6: 'Director Operations', 7: 'COO' }),
    activeEmployeesCount: EMPLOYEES.filter(e => e.department === 'Opérations').length },
];

function pickFiliere(role: string, dept: string): string {
  if (dept === 'Technologie') return role.toLowerCase().includes('lead') || role.toLowerCase().includes('manager') ? 'TECH-ENG' : 'TECH-ENG';
  if (dept === 'Ventes') return 'COMMERCIAL';
  if (dept === 'Ressources Humaines') return 'RH';
  if (dept === 'Finance') return 'FIN';
  return 'OPS';
}
function pickLevel(role: string, years: number): number {
  const r = role.toLowerCase();
  if (r.includes('director') || r.includes('directeur') || r.includes('directrice')) return 6;
  if (r.includes('lead') || r.includes('head')) return 4;
  if (r.includes('manager')) return 5;
  if (r.includes('senior')) return 3;
  if (years < 2) return 1;
  if (years < 5) return 2;
  if (years < 7) return 3;
  return 4;
}

// ─────────────────────────────────────── Trajectoires
export const TRAJECTORIES: CareerTrajectory[] = EMPLOYEES.map((e) => {
  const years = 2026 - new Date(e.hireDate).getFullYear();
  const level = pickLevel(e.role, years);
  const filiere = pickFiliere(e.role, e.department);
  return {
    id: `traj-${e.id}`,
    employeeId: e.id, filiereCode: filiere, currentLevel: level,
    joinedAt: e.hireDate,
    nextStepTarget: level < 7 ? `${FILIERES.find((f) => f.code === filiere)?.levels[level]?.title ?? 'Promotion'}` : undefined,
    nextStepETA: level < 7 ? '2027-Q2' : undefined,
    readinessPct: 30 + ((parseInt(e.id.slice(1)) * 11) % 60),
    aspirations: level >= 4 ? 'Évoluer vers un rôle de direction sous 3 ans' : 'Devenir expert reconnu sur mon domaine',
  };
});
export const trajectoryOf = (empId: string) => TRAJECTORIES.find((t) => t.employeeId === empId);

// ─────────────────────────────────────── Postes clés
export const CRITICAL_ROLES: CriticalRole[] = [
  { id: 'cr-cto',  ref: 'CR-2026-0001', title: 'CTO',             department: 'Technologie',         currentHolderEmployeeId: 'e2',  criticality: 'high', successorsCount: 2, benchStrength: 'adequate' },
  { id: 'cr-cfo',  ref: 'CR-2026-0002', title: 'CFO',             department: 'Finance',             currentHolderEmployeeId: 'e1',  criticality: 'high', successorsCount: 1, benchStrength: 'weak' },
  { id: 'cr-drh',  ref: 'CR-2026-0003', title: 'DRH',             department: 'Ressources Humaines', currentHolderEmployeeId: 'e3',  criticality: 'high', successorsCount: 2, benchStrength: 'adequate' },
  { id: 'cr-sales',ref: 'CR-2026-0004', title: 'Director Sales',  department: 'Ventes',              currentHolderEmployeeId: 'e4',  criticality: 'high', successorsCount: 3, benchStrength: 'strong' },
  { id: 'cr-prod', ref: 'CR-2026-0005', title: 'Head of Product', department: 'Technologie',         currentHolderEmployeeId: 'e14', criticality: 'medium', successorsCount: 1, benchStrength: 'weak' },
  { id: 'cr-mkt',  ref: 'CR-2026-0006', title: 'Marketing Lead',  department: 'Ventes',              currentHolderEmployeeId: 'e13', criticality: 'medium', successorsCount: 0, benchStrength: 'none' },
  { id: 'cr-devops',ref: 'CR-2026-0007', title: 'DevOps Lead',    department: 'Technologie',         currentHolderEmployeeId: 'e8',  criticality: 'medium', successorsCount: 2, benchStrength: 'adequate' },
  { id: 'cr-ops',  ref: 'CR-2026-0008', title: 'Office / Ops Manager', department: 'Opérations',     currentHolderEmployeeId: 'e9',  criticality: 'low', successorsCount: 1, benchStrength: 'adequate' },
];

export const SUCCESSORS: SuccessorMapping[] = [
  { id: 's1',  criticalRoleId: 'cr-cto',  candidateEmployeeId: 'e8',  readiness: '1_2_years', developmentActions: ['Formation Leadership Excellence', 'Mentorat avec CTO', 'Lead projet stratégique cross-département'] },
  { id: 's2',  criticalRoleId: 'cr-cto',  candidateEmployeeId: 'e10', readiness: '3_5_years', developmentActions: ['Programme Next Managers', 'Première équipe à manager'] },
  { id: 's3',  criticalRoleId: 'cr-cfo',  candidateEmployeeId: 'e6',  readiness: '1_2_years', developmentActions: ['MBA Executive', 'Mission transverse direction'] },
  { id: 's4',  criticalRoleId: 'cr-drh',  candidateEmployeeId: 'e7',  readiness: '1_2_years', developmentActions: ['Formation HRBP Senior', 'Coaching exécutif'] },
  { id: 's5',  criticalRoleId: 'cr-drh',  candidateEmployeeId: 'e3',  readiness: 'ready_now', developmentActions: ['Plan de prise de fonction (DRH adjoint déjà)'] },
  { id: 's6',  criticalRoleId: 'cr-sales', candidateEmployeeId: 'e11',readiness: 'ready_now', developmentActions: ['Prise de fonction Q4 2026'] },
  { id: 's7',  criticalRoleId: 'cr-sales', candidateEmployeeId: 'e13',readiness: '1_2_years', developmentActions: ['Mentor : Director Sales'] },
  { id: 's8',  criticalRoleId: 'cr-sales', candidateEmployeeId: 'e4', readiness: '3_5_years', developmentActions: ['Programme Global Mobility'] },
  { id: 's9',  criticalRoleId: 'cr-prod', candidateEmployeeId: 'e5',  readiness: '1_2_years', developmentActions: ['Programme Leadership Excellence'] },
  { id: 's10', criticalRoleId: 'cr-devops', candidateEmployeeId: 'e10',readiness: '1_2_years', developmentActions: ['Formation SRE avancée'] },
  { id: 's11', criticalRoleId: 'cr-devops', candidateEmployeeId: 'e2',readiness: 'ready_now',  developmentActions: ['Backup CTO/DevOps Lead'] },
  { id: 's12', criticalRoleId: 'cr-ops',  candidateEmployeeId: 'e12', readiness: '1_2_years', developmentActions: ['Formation Lean Six Sigma'] },
];

export const successorsOf = (crId: string) => SUCCESSORS.filter((s) => s.criticalRoleId === crId);

// ─────────────────────────────────────── Hauts potentiels (pool)
export const HIGH_POTS: HighPotEmployee[] = [
  { employeeId: 'e8',  program: 'leadership_excellence', enrolledAt: '2026-01-15', graduationTarget: '2027-06-30', status: 'in_progress', mentorEmployeeId: 'e2' },
  { employeeId: 'e11', program: 'next_managers',         enrolledAt: '2026-02-01', graduationTarget: '2027-02-01', status: 'in_progress', mentorEmployeeId: 'e4' },
  { employeeId: 'e5',  program: 'leadership_excellence', enrolledAt: '2026-03-10', graduationTarget: '2027-09-10', status: 'in_progress', mentorEmployeeId: 'e1' },
  { employeeId: 'e10', program: 'expert_track',          enrolledAt: '2026-01-20', graduationTarget: '2028-01-20', status: 'in_progress', mentorEmployeeId: 'e2' },
  { employeeId: 'e6',  program: 'next_managers',         enrolledAt: '2026-04-01', graduationTarget: '2027-04-01', status: 'enrolled',    mentorEmployeeId: 'e1' },
  { employeeId: 'e14', program: 'leadership_excellence', enrolledAt: '2026-03-15', graduationTarget: '2027-09-15', status: 'in_progress', mentorEmployeeId: 'e1' },
];
export const highPotOf = (empId: string) => HIGH_POTS.find((h) => h.employeeId === empId);

// ─────────────────────────────────────── Mentorat
export const MENTORSHIPS: MentorshipPair[] = HIGH_POTS.map((h, i) => ({
  id: `ment-${h.employeeId}`,
  mentorEmployeeId: h.mentorEmployeeId ?? 'e1',
  menteeEmployeeId: h.employeeId,
  startedAt: h.enrolledAt,
  cadence: i % 2 === 0 ? 'monthly' as const : 'biweekly' as const,
  focus: h.program === 'leadership_excellence' ? 'Leadership' : h.program === 'expert_track' ? 'Expertise technique' : h.program === 'next_managers' ? 'Premier rôle managérial' : 'Mobilité internationale',
  status: h.status === 'churned' ? 'paused' as const : 'active' as const,
}));

// ─────────────────────────────────────── Opportunités internes
export const OPPORTUNITIES: InternalOpportunity[] = [
  { id: 'opp-1', ref: 'OPP-2026-0001', title: 'Tech Lead Squad Paie',     department: 'Technologie',         type: 'promotion',  publishedAt: '2026-05-15', closingDate: '2026-06-20', applicationsCount: 4, status: 'open' },
  { id: 'opp-2', ref: 'OPP-2026-0002', title: 'HRBP Senior Sénégal',      department: 'Ressources Humaines', type: 'mobilite',   publishedAt: '2026-05-10', closingDate: '2026-06-10', applicationsCount: 2, status: 'open' },
  { id: 'opp-3', ref: 'OPP-2026-0003', title: 'Mission Tigre · refonte stratégie commerciale', department: 'Ventes', type: 'mission', publishedAt: '2026-05-20', closingDate: '2026-06-15', applicationsCount: 6, status: 'open' },
  { id: 'opp-4', ref: 'OPP-2026-0004', title: 'Détachement Mali (6 mois)', department: 'Opérations',          type: 'detachement', publishedAt: '2026-04-10', closingDate: '2026-05-15', applicationsCount: 3, status: 'closed' },
];

// ─────────────────────────────────────── Cartographie compétences (échantillon)
const SKILL_BASE = [
  { code: 'NODE', label: 'Node.js', category: 'tech' as const },
  { code: 'GO',   label: 'Go',      category: 'tech' as const },
  { code: 'AWS',  label: 'AWS',     category: 'tech' as const },
  { code: 'LEAD', label: 'Leadership', category: 'leadership' as const },
  { code: 'COACH', label: 'Coaching', category: 'leadership' as const },
  { code: 'STRAT', label: 'Stratégie', category: 'business' as const },
  { code: 'FIN',  label: 'Finance', category: 'business' as const },
  { code: 'COMM', label: 'Communication', category: 'soft' as const },
  { code: 'OHADA',label: 'OHADA / Droit social', category: 'business' as const },
];
export const SKILLS_MAPPING: SkillsMappingEntry[] = EMPLOYEES.flatMap((e, i) =>
  SKILL_BASE.map((s, j) => {
    const level = ((i + j) % 5) + 1 as 1 | 2 | 3 | 4 | 5;
    return { employeeId: e.id, skillCode: s.code, skillLabel: s.label, level, category: s.category, certified: level >= 4 && (i + j) % 3 === 0 };
  }),
);

// ─────────────────────────────────────── KPIs
export function kpis(): CareerKPI {
  const benchOk = CRITICAL_ROLES.filter((r) => r.benchStrength === 'strong' || r.benchStrength === 'adequate').length;
  const benchPct = Math.round((benchOk / CRITICAL_ROLES.length) * 100);
  const successCoverage = Math.round((SUCCESSORS.filter((s) => s.readiness === 'ready_now' || s.readiness === '1_2_years').length / Math.max(1, CRITICAL_ROLES.length * 2)) * 100);
  return {
    filieresActives: FILIERES.length,
    postesCleses: CRITICAL_ROLES.length,
    benchStrengthPct: benchPct,
    hautsPotentielsCount: HIGH_POTS.filter((h) => h.status === 'enrolled' || h.status === 'in_progress').length,
    mentorshipActifs: MENTORSHIPS.filter((m) => m.status === 'active').length,
    opportunitesOuvertes: OPPORTUNITIES.filter((o) => o.status === 'open').length,
    promotionsLast12m: 4,
    mobilitesLast12m: 7,
    retentionTopTalentsPct: 94,
    successionCoveragePct: Math.min(100, successCoverage),
  };
}

export const filiereByCode = (code: string) => FILIERES.find((f) => f.code === code);
