/**
 * Données de démonstration Atlas People (mode démo, sans backend).
 * Montants en francs entiers ; la devise dépend du pays (UEMOA → XOF, CEMAC → XAF).
 * Noms et organisations fictifs.
 */
import { buildExpiryAlert, type ExpiryAlert } from '../lib/alerts';
import { currencyOf } from './countries';
import type { Currency } from '../lib/money';

export interface EmployeeRecord {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  countryCode: string;
  email: string;
  contractType: 'CDI' | 'CDD' | 'Stage';
  hireDate: string;
  /**
   * Présence opérationnelle (axe ESS/MSS), distincte du cycle de vie contractuel
   * (draft→…→left) porté par les workflows avenant/sortie. Voir la vue SQL
   * `employee_status_overview` qui consolide les deux axes.
   */
  status: 'active' | 'onboarding' | 'leave' | 'notice';
  baseSalary: number;
  taxableAllowances: number;
  nonTaxableAllowances: number;
  fiscalParts: number;
  manager?: string;
  /** Signal de risque agrégé/éthique 0..100 (orienté soin, jamais punitif). */
  retentionAttention: number;
  /** Retenues diverses (avances, prêts, oppositions). */
  otherDeductions?: { code: string; label: string; amount: number; account: string }[];
  /** Dates de suivi (alertes d'expiration M1.7). */
  idExpiry?: string;
  medicalVisit?: string;
  probationEnd?: string;
  cddEnd?: string;
  /** Coordonnées éditables (P1.4). */
  phone?: string;
  address?: string;
  /** Versement (sensible — P1.4 audit fort). */
  mobileMoneyNumber?: string;
  /** Genre (F/M) — index parité/anti-discrimination (colonne employees.gender). */
  gender?: 'F' | 'M';
}

export function employeeAlerts(e: EmployeeRecord): ExpiryAlert[] {
  return [
    buildExpiryAlert("Pièce d'identité", e.idExpiry),
    buildExpiryAlert('Visite médicale', e.medicalVisit),
    buildExpiryAlert("Fin de période d'essai", e.probationEnd),
    buildExpiryAlert('Fin de CDD', e.cddEnd),
  ].filter((a): a is ExpiryAlert => a !== null);
}

/** Id du manager (résolu depuis le nom — base de l'organigramme M1.8). */
export function managerIdOf(e: EmployeeRecord): string | undefined {
  if (!e.manager) return undefined;
  return EMPLOYEES.find((m) => employeeName(m) === e.manager)?.id;
}

const fullName = (e: EmployeeRecord) => `${e.firstName} ${e.lastName}`;
export const employeeName = fullName;

/** Devise de versement du collaborateur, dérivée de son pays de rattachement. */
export function employeeCurrency(e: EmployeeRecord): Currency {
  return currencyOf(e.countryCode);
}

export const EMPLOYEES: EmployeeRecord[] = [
  { id: 'e1', firstName: 'Awa', lastName: 'Koné', role: 'Directrice Financière', department: 'Finance', countryCode: 'CI', email: 'a.kone@atlas.demo', contractType: 'CDI', hireDate: '2019-03-12', status: 'active', baseSalary: 1_850_000, taxableAllowances: 250_000, nonTaxableAllowances: 75_000, fiscalParts: 3, retentionAttention: 12 },
  { id: 'e2', firstName: 'Kouadio', lastName: 'N’Guessan', role: 'Lead Developer', department: 'Technologie', countryCode: 'CI', email: 'k.nguessan@atlas.demo', contractType: 'CDI', hireDate: '2021-09-01', status: 'active', baseSalary: 1_250_000, taxableAllowances: 120_000, nonTaxableAllowances: 50_000, fiscalParts: 2, manager: 'Awa Koné', retentionAttention: 68, idExpiry: '2026-06-20', medicalVisit: '2026-07-02' },
  { id: 'e3', firstName: 'Fatou', lastName: 'Diop', role: 'Responsable RH', department: 'Ressources Humaines', countryCode: 'SN', email: 'f.diop@atlas.demo', contractType: 'CDI', hireDate: '2020-01-15', status: 'active', baseSalary: 1_100_000, taxableAllowances: 90_000, nonTaxableAllowances: 60_000, fiscalParts: 2.5, retentionAttention: 22 },
  { id: 'e4', firstName: 'Ibrahim', lastName: 'Traoré', role: 'Commercial Senior', department: 'Ventes', countryCode: 'CI', email: 'i.traore@atlas.demo', contractType: 'CDI', hireDate: '2022-06-20', status: 'active', baseSalary: 780_000, taxableAllowances: 200_000, nonTaxableAllowances: 50_000, fiscalParts: 1, manager: 'Awa Koné', retentionAttention: 41, otherDeductions: [{ code: 'AVANCE', label: 'Remboursement avance sur salaire', amount: 100_000, account: '421000' }] },
  { id: 'e5', firstName: 'Mariam', lastName: 'Cissé', role: 'Designer Produit', department: 'Technologie', countryCode: 'SN', email: 'm.cisse@atlas.demo', contractType: 'CDI', hireDate: '2023-02-01', status: 'active', baseSalary: 850_000, taxableAllowances: 60_000, nonTaxableAllowances: 50_000, fiscalParts: 1.5, manager: 'Kouadio N’Guessan', retentionAttention: 35 },
  { id: 'e6', firstName: 'Yao', lastName: 'Brou', role: 'Comptable', department: 'Finance', countryCode: 'CI', email: 'y.brou@atlas.demo', contractType: 'CDI', hireDate: '2018-11-05', status: 'active', baseSalary: 620_000, taxableAllowances: 40_000, nonTaxableAllowances: 40_000, fiscalParts: 3, manager: 'Awa Koné', retentionAttention: 18 },
  { id: 'e7', firstName: 'Aminata', lastName: 'Sow', role: 'Chargée de recrutement', department: 'Ressources Humaines', countryCode: 'SN', email: 'a.sow@atlas.demo', contractType: 'CDD', hireDate: '2024-04-10', status: 'active', baseSalary: 540_000, taxableAllowances: 30_000, nonTaxableAllowances: 40_000, fiscalParts: 1, manager: 'Fatou Diop', retentionAttention: 29, cddEnd: '2026-06-10' },
  { id: 'e8', firstName: 'Serge', lastName: 'Aké', role: 'DevOps Engineer', department: 'Technologie', countryCode: 'CI', email: 's.ake@atlas.demo', contractType: 'CDI', hireDate: '2022-10-03', status: 'active', baseSalary: 1_050_000, taxableAllowances: 80_000, nonTaxableAllowances: 50_000, fiscalParts: 2, manager: 'Kouadio N’Guessan', retentionAttention: 57 },
  { id: 'e9', firstName: 'Khady', lastName: 'Ndiaye', role: 'Office Manager', department: 'Opérations', countryCode: 'SN', email: 'k.ndiaye@atlas.demo', contractType: 'CDI', hireDate: '2021-05-18', status: 'leave', baseSalary: 480_000, taxableAllowances: 20_000, nonTaxableAllowances: 35_000, fiscalParts: 2, retentionAttention: 24 },
  { id: 'e10', firstName: 'Modeste', lastName: 'Yapo', role: 'Data Analyst', department: 'Technologie', countryCode: 'CI', email: 'm.yapo@atlas.demo', contractType: 'CDI', hireDate: '2023-08-22', status: 'active', baseSalary: 760_000, taxableAllowances: 50_000, nonTaxableAllowances: 45_000, fiscalParts: 1, manager: 'Kouadio N’Guessan', retentionAttention: 47 },
  { id: 'e11', firstName: 'Rokhaya', lastName: 'Fall', role: 'Customer Success', department: 'Ventes', countryCode: 'SN', email: 'r.fall@atlas.demo', contractType: 'CDI', hireDate: '2024-01-08', status: 'onboarding', baseSalary: 560_000, taxableAllowances: 60_000, nonTaxableAllowances: 40_000, fiscalParts: 1, manager: 'Ibrahim Traoré', retentionAttention: 15, probationEnd: '2026-06-05' },
  { id: 'e12', firstName: 'Désiré', lastName: 'Kouamé', role: 'Technicien support', department: 'Opérations', countryCode: 'CI', email: 'd.kouame@atlas.demo', contractType: 'CDD', hireDate: '2024-09-02', status: 'active', baseSalary: 420_000, taxableAllowances: 15_000, nonTaxableAllowances: 35_000, fiscalParts: 1, retentionAttention: 33 },
  { id: 'e13', firstName: 'Bineta', lastName: 'Gueye', role: 'Marketing Lead', department: 'Ventes', countryCode: 'SN', email: 'b.gueye@atlas.demo', contractType: 'CDI', hireDate: '2020-07-30', status: 'notice', baseSalary: 920_000, taxableAllowances: 100_000, nonTaxableAllowances: 50_000, fiscalParts: 2, retentionAttention: 74 },
  { id: 'e14', firstName: 'Olivier', lastName: 'Tanoh', role: 'Product Manager', department: 'Technologie', countryCode: 'CI', email: 'o.tanoh@atlas.demo', contractType: 'CDI', hireDate: '2021-11-11', status: 'active', baseSalary: 1_320_000, taxableAllowances: 140_000, nonTaxableAllowances: 55_000, fiscalParts: 2, manager: 'Awa Koné', retentionAttention: 38 },
];

export const DEPARTMENTS = ['Technologie', 'Finance', 'Ventes', 'Ressources Humaines', 'Opérations'];

export function employeeById(id: string): EmployeeRecord | undefined {
  return EMPLOYEES.find((e) => e.id === id);
}

/** Matricule déterministe à partir de l'id. */
export function matricule(e: EmployeeRecord): string {
  return `AP-${e.countryCode}-${e.id.replace('e', '').padStart(4, '0')}`;
}

/** Numéro Mobile Money masqué (versement salaire). */
export function mobileMoney(e: EmployeeRecord): string {
  const seed = e.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const last = (seed % 90) + 10;
  return e.countryCode === 'SN' ? `+221 77 ••• •• ${last}` : `+225 07 ••• •• ${last}`;
}

export interface TimelineEvent {
  date: string;
  type: 'hire' | 'training' | 'raise' | 'evaluation' | 'mobility';
  label: string;
}

/** Historique du dossier vivant (mis à jour par événements, pas par ressaisie). */
export function employeeTimeline(e: EmployeeRecord): TimelineEvent[] {
  const hire = new Date(e.hireDate);
  const plus = (months: number) => {
    const d = new Date(hire);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  };
  const events: TimelineEvent[] = [
    { date: e.hireDate, type: 'hire', label: `Embauche · ${e.contractType} — ${e.role}` },
    { date: plus(6), type: 'training', label: 'Formation onboarding métier complétée' },
    { date: plus(14), type: 'evaluation', label: 'Évaluation continue — objectifs atteints' },
  ];
  if (e.baseSalary > 800_000) events.push({ date: plus(20), type: 'raise', label: 'Révision salariale annuelle (+6 %)' });
  if (e.retentionAttention >= 55) events.push({ date: plus(26), type: 'mobility', label: 'Entretien carrière — piste de mobilité interne' });
  return events.filter((ev) => new Date(ev.date) <= new Date()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function employeeLeaveBalance(e: EmployeeRecord): { acquired: number; taken: number; remaining: number } {
  const acquired = 26;
  const taken = (e.id.charCodeAt(1) % 18) + 2;
  return { acquired, taken, remaining: acquired - taken };
}

export function employeeDocuments(e: EmployeeRecord): { name: string; kind: string; date: string }[] {
  return [
    { name: 'Contrat de travail', kind: 'PDF', date: e.hireDate },
    { name: 'Bulletin Avril 2026', kind: 'PDF', date: '2026-04-28' },
    { name: 'Bulletin Mars 2026', kind: 'PDF', date: '2026-03-28' },
    { name: 'Attestation de travail', kind: 'PDF', date: '2026-02-10' },
    { name: 'Pièce d’identité', kind: 'IMG', date: e.hireDate },
  ];
}

export function employeeSkillSet(e: EmployeeRecord): { name: string; level: number }[] {
  const byDept: Record<string, string[]> = {
    Technologie: ['React / TypeScript', 'Infrastructure cloud', 'Sécurité applicative', 'Design produit'],
    Finance: ['Paie SYSCOHADA', 'Contrôle de gestion', 'Conformité OHADA'],
    Ventes: ['Négociation commerciale', 'Management d’équipe'],
    'Ressources Humaines': ['Conformité OHADA', 'Management d’équipe'],
    Opérations: ['Management d’équipe', 'Analyse de données'],
  };
  const names = byDept[e.department] ?? ['Management d’équipe'];
  return names.map((name, i) => ({ name, level: Math.max(1, Math.min(5, 3 + ((e.id.charCodeAt(1) + i) % 3) - 1)) }));
}

// --- Agrégats Cockpit DRH ---

export const HEADCOUNT_TREND = [
  { label: 'Déc', value: 9 },
  { label: 'Jan', value: 10 },
  { label: 'Fév', value: 11 },
  { label: 'Mar', value: 12 },
  { label: 'Avr', value: 13 },
  { label: 'Mai', value: 14 },
];

export const HEADCOUNT_BY_DEPT = [
  { label: 'Technologie', value: 5, color: '#EF9F27' },
  { label: 'Ventes', value: 3, color: '#3B82C4' },
  { label: 'Finance', value: 2, color: '#1B9E6B' },
  { label: 'RH', value: 2, color: '#F4D03F' },
  { label: 'Opérations', value: 2, color: '#C97E12' },
];

export const CLIMATE_TREND = [
  { label: 'Jan', value: 71 },
  { label: 'Fév', value: 69 },
  { label: 'Mar', value: 73 },
  { label: 'Avr', value: 76 },
  { label: 'Mai', value: 78 },
];

// --- Graphe de compétences (M9) ---
export interface SkillNode {
  name: string;
  domain: 'Technologie' | 'Finance' | 'Soft skills' | 'Conformité' | 'Data';
  holders: number; // nombre de détenteurs
  avgLevel: number; // niveau moyen 0..4
  /** Manque projeté à 12-18 mois (positif = pénurie anticipée). */
  projectedGap: number;
}

export const SKILLS: SkillNode[] = [
  { name: 'React / TypeScript', domain: 'Technologie', holders: 4, avgLevel: 3.2, projectedGap: 1 },
  { name: 'Infrastructure cloud', domain: 'Technologie', holders: 1, avgLevel: 3.5, projectedGap: 2 },
  { name: 'Paie SYSCOHADA', domain: 'Finance', holders: 2, avgLevel: 3.8, projectedGap: 0 },
  { name: 'Analyse de données', domain: 'Data', holders: 2, avgLevel: 2.8, projectedGap: 2 },
  { name: 'Conformité OHADA', domain: 'Conformité', holders: 1, avgLevel: 4, projectedGap: 1 },
  { name: 'Négociation commerciale', domain: 'Soft skills', holders: 3, avgLevel: 3, projectedGap: 0 },
  { name: 'Management d’équipe', domain: 'Soft skills', holders: 4, avgLevel: 2.9, projectedGap: 1 },
  { name: 'Sécurité applicative', domain: 'Technologie', holders: 1, avgLevel: 2.5, projectedGap: 3 },
  { name: 'Design produit', domain: 'Technologie', holders: 1, avgLevel: 3.4, projectedGap: 1 },
  { name: 'Contrôle de gestion', domain: 'Finance', holders: 2, avgLevel: 3.1, projectedGap: 0 },
];

// --- Paquet 1 : Famille, nationalités, langues, bénéficiaires (thèmes A, B) ---
export interface FamilyMember {
  id: string;
  type: 'spouse' | 'child' | 'ascendant' | 'other';
  name: string;
  relation: string;
  birthDate?: string;
  fiscalDependent: boolean;
  healthBeneficiary: boolean;
  status: 'alive' | 'deceased';
}

const SPOUSE_NAMES = ['Aya Konan', 'Mariam Touré', 'Awa Diallo', 'Fatou Mbaye', 'Salimata Bâ'];
const CHILD_NAMES = ['Yann', 'Ama', 'Koffi', 'Aïcha', 'Sékou', 'Nina', 'Ismaël', 'Lola'];

export function employeeFamily(e: EmployeeRecord): FamilyMember[] {
  const seed = e.id.charCodeAt(1);
  const fp = e.fiscalParts;
  const members: FamilyMember[] = [];
  if (fp >= 1.5) {
    members.push({ id: `${e.id}-sp`, type: 'spouse', name: SPOUSE_NAMES[seed % SPOUSE_NAMES.length], relation: 'Conjoint(e)', birthDate: '1990-07-14', fiscalDependent: true, healthBeneficiary: true, status: 'alive' });
  }
  const nbChildren = Math.min(4, Math.max(0, Math.round((fp - 1) * 2)));
  for (let i = 0; i < nbChildren; i++) {
    const year = 2010 + ((seed + i) % 12);
    members.push({ id: `${e.id}-c${i}`, type: 'child', name: `${CHILD_NAMES[(seed + i) % CHILD_NAMES.length]} ${e.lastName}`, relation: `Enfant · ${2026 - year} ans`, birthDate: `${year}-03-0${(i % 8) + 1}`, fiscalDependent: true, healthBeneficiary: true, status: 'alive' });
  }
  if (fp >= 2.5) {
    members.push({ id: `${e.id}-asc`, type: 'ascendant', name: `Mère de ${e.firstName}`, relation: 'Mère (à charge)', fiscalDependent: false, healthBeneficiary: false, status: 'alive' });
  }
  return members;
}

export interface Beneficiary {
  id: string;
  benefit: string;
  name: string;
  share: number;
}

export function employeeBeneficiaries(e: EmployeeRecord): Beneficiary[] {
  const fam = employeeFamily(e);
  const spouse = fam.find((m) => m.type === 'spouse');
  const children = fam.filter((m) => m.type === 'child');
  if (!spouse && children.length === 0) return [];
  const out: Beneficiary[] = [];
  if (spouse) out.push({ id: `${e.id}-b1`, benefit: 'Capital décès', name: spouse.name, share: children.length ? 60 : 100 });
  children.forEach((c, i) => out.push({ id: `${e.id}-b${i + 2}`, benefit: 'Capital décès', name: c.name, share: Math.round(40 / children.length) }));
  return out;
}

export interface Nationality {
  code: string;
  primary: boolean;
}
export function employeeNationalities(e: EmployeeRecord): Nationality[] {
  return [{ code: e.countryCode, primary: true }];
}

export interface LangSkill {
  label: string;
  level: string;
}
export function employeeLanguages(e: EmployeeRecord): LangSkill[] {
  const langs: LangSkill[] = [{ label: 'Français', level: 'Langue maternelle' }];
  if (e.department === 'Technologie' || e.role.toLowerCase().includes('lead') || e.role.toLowerCase().includes('manager')) {
    langs.push({ label: 'Anglais', level: 'Avancé (C1)' });
  }
  langs.push(e.countryCode === 'SN' ? { label: 'Wolof', level: 'Langue maternelle' } : { label: 'Dioula', level: 'Courant' });
  return langs;
}

// --- Paquet 2 : rémunération détaillée, avantages, prêts (thèmes I, J, K) ---
function seniorityYears(e: EmployeeRecord): number {
  return Math.floor((new Date('2026-05-27').getTime() - new Date(e.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
}

export interface CompLine {
  code: string;
  label: string;
  category: string;
  fiscal: string;
  amount: number;
}
export function employeeCompensation(e: EmployeeRecord): CompLine[] {
  const sen = seniorityYears(e);
  const lines: CompLine[] = [{ code: 'I-SB', label: 'Salaire de base', category: 'Salaire de base', fiscal: 'Imposable', amount: e.baseSalary }];
  if (sen >= 2) lines.push({ code: 'I-PA', label: "Prime d'ancienneté", category: 'Prime structurelle', fiscal: 'Imposable', amount: Math.round(e.baseSalary * 0.02 * Math.min(5, sen)) });
  if (e.taxableAllowances > 0) lines.push({ code: 'I-PF', label: 'Prime de fonction', category: 'Prime structurelle', fiscal: 'Imposable', amount: e.taxableAllowances });
  lines.push({ code: 'I-IT', label: 'Indemnité de transport', category: 'Indemnité', fiscal: 'Non imposable ≤ 25 000', amount: Math.min(25_000, e.nonTaxableAllowances || 25_000) });
  lines.push({ code: 'I-13M', label: '13ᵉ mois (provision mensuelle)', category: 'Prime événementielle', fiscal: 'Imposable', amount: Math.round(e.baseSalary / 12) });
  return lines;
}

export interface InKindBenefit {
  type: string;
  label: string;
  monthlyValue: number;
  taxable: boolean;
}
export function employeeBenefitsInKind(e: EmployeeRecord): InKindBenefit[] {
  const out: InKindBenefit[] = [];
  if (e.baseSalary >= 1_000_000) {
    out.push({ type: 'vehicle', label: 'Véhicule de fonction', monthlyValue: 120_000, taxable: true });
    out.push({ type: 'phone', label: 'Téléphone professionnel', monthlyValue: 15_000, taxable: false });
  }
  if (e.baseSalary >= 1_300_000) out.push({ type: 'housing', label: 'Logement de fonction', monthlyValue: 200_000, taxable: true });
  return out;
}

export interface Loan {
  reference: string;
  purpose: string;
  totalAmount: number;
  monthlyInstallment: number;
  remainingBalance: number;
  installmentsRemaining: number;
  status: 'active' | 'repaid';
}
export function employeeLoans(e: EmployeeRecord): Loan[] {
  const map: Record<string, Loan> = {
    e1: { reference: 'LOAN-2025-0007', purpose: 'Logement', totalAmount: 6_000_000, monthlyInstallment: 250_000, remainingBalance: 3_500_000, installmentsRemaining: 14, status: 'active' },
    e8: { reference: 'LOAN-2025-0019', purpose: 'Véhicule', totalAmount: 3_000_000, monthlyInstallment: 125_000, remainingBalance: 1_125_000, installmentsRemaining: 9, status: 'active' },
    e14: { reference: 'LOAN-2024-0042', purpose: 'Études enfants', totalAmount: 1_500_000, monthlyInstallment: 62_500, remainingBalance: 250_000, installmentsRemaining: 4, status: 'active' },
  };
  return map[e.id] ? [map[e.id]] : [];
}

export interface FinAdvance {
  reference: string;
  motive: string;
  amount: number;
  monthlyDeduction: number;
  status: 'active' | 'cleared';
}
export function employeeAdvances(e: EmployeeRecord): FinAdvance[] {
  return (e.otherDeductions ?? []).map((d, i) => ({ reference: `ADV-2026-00${i + 1}`, motive: d.label, amount: d.amount, monthlyDeduction: d.amount, status: 'active' as const }));
}

/** Endettement mensuel total (prêts + avances) en francs. */
export function employeeMonthlyDebt(e: EmployeeRecord): number {
  return employeeLoans(e).reduce((s, l) => s + l.monthlyInstallment, 0) + employeeAdvances(e).reduce((s, a) => s + a.monthlyDeduction, 0);
}

// --- Paquet 3 : profil professionnel (thèmes M–Q) ---
export interface Membership { organization: string; type: string; status: string; linkToJob: 'mandatory' | 'recommended' | 'personal'; }
export function employeeMemberships(e: EmployeeRecord): Membership[] {
  if (e.department === 'Ressources Humaines') return [{ organization: 'Association des DRH de Côte d’Ivoire', type: 'Association professionnelle', status: 'active', linkToJob: 'recommended' }];
  if (e.department === 'Finance') return [{ organization: 'ONECCA — Ordre des Experts-Comptables', type: 'Ordre professionnel', status: 'active', linkToJob: 'mandatory' }];
  return [];
}

export interface Mandate { category: 'staff_representation' | 'external'; type: string; start: string; end: string; protectionEnd?: string; status: string; }
export function employeeMandates(e: EmployeeRecord): Mandate[] {
  const map: Record<string, Mandate[]> = {
    e6: [{ category: 'staff_representation', type: 'Délégué du personnel titulaire', start: '2024-06-01', end: '2027-06-01', protectionEnd: '2027-12-01', status: 'active' }],
    e3: [{ category: 'staff_representation', type: 'Membre Comité Santé & Sécurité', start: '2025-01-01', end: '2028-01-01', protectionEnd: '2028-07-01', status: 'active' }],
    e14: [{ category: 'external', type: 'Administrateur association', start: '2023-03-01', end: '2026-12-31', status: 'active' }],
  };
  return map[e.id] ?? [];
}
/** Date jusqu'à laquelle le salarié est protégé (mandat actif), sinon null. */
export function employeeProtectedUntil(e: EmployeeRecord): string | null {
  const ends = employeeMandates(e).filter((m) => m.category === 'staff_representation' && m.status === 'active' && m.protectionEnd).map((m) => m.protectionEnd!);
  return ends.length ? ends.sort().reverse()[0] : null;
}

export interface Authorization { code: string; label: string; category: string; obtained: string; expiry: string; status: 'active' | 'expired'; }
export function employeeAuthorizations(e: EmployeeRecord): Authorization[] {
  const out: Authorization[] = [{ code: 'SST', label: 'Sauveteur Secouriste du Travail', category: 'Sécurité', obtained: '2024-09-01', expiry: '2026-09-01', status: 'active' }];
  if (e.department === 'Opérations') {
    out.push({ code: 'MAN-CACES', label: 'CACES R489 cat. 3', category: 'Manutention', obtained: '2022-05-01', expiry: '2027-05-01', status: 'active' });
    out.push({ code: 'INC-EPI', label: 'Équipier Première Intervention', category: 'Sécurité', obtained: '2025-02-01', expiry: '2026-02-01', status: 'expired' });
  }
  return out;
}

export interface Certification { label: string; certifier: string; obtained: string; expiry?: string; status: string; }
export function employeeCertifications(e: EmployeeRecord): Certification[] {
  const r = e.role.toLowerCase();
  if (r.includes('product') || r.includes('manager')) return [{ label: 'PMP — Project Management Professional', certifier: 'PMI', obtained: '2023-04-01', expiry: '2026-04-01', status: 'active' }];
  if (e.department === 'Technologie') return [{ label: 'AWS Solutions Architect Associate', certifier: 'Amazon', obtained: '2024-01-15', expiry: '2027-01-15', status: 'active' }];
  if (e.department === 'Finance') return [{ label: 'DSCG', certifier: 'État', obtained: '2018-07-01', status: 'active' }];
  return [];
}

export interface Diploma { title: string; institution: string; year: number; level: string; }
export function employeeEducationLevel(e: EmployeeRecord): string {
  if (e.baseSalary >= 1_200_000) return 'Master 2 / Ingénieur (BAC+5)';
  if (e.baseSalary >= 800_000) return 'Licence (BAC+3)';
  return 'BTS / DUT (BAC+2)';
}
export function employeeDiplomas(e: EmployeeRecord): Diploma[] {
  const lvl = employeeEducationLevel(e);
  const inst = e.countryCode === 'SN' ? 'UCAD — Dakar' : 'INP-HB / Université FHB — Abidjan';
  const yr = new Date(e.hireDate).getFullYear() - 1;
  return [{ title: lvl.split(' (')[0] + ' — ' + e.department, institution: inst, year: yr, level: lvl }];
}

export interface CareerStep { date: string; title: string; type: 'initial_hiring' | 'promotion' | 'mobility'; }
export function employeeCareer(e: EmployeeRecord): CareerStep[] {
  const steps: CareerStep[] = [{ date: e.hireDate, title: `Embauche · ${e.role}`, type: 'initial_hiring' }];
  const hire = new Date(e.hireDate);
  if (e.baseSalary > 900_000) {
    const d = new Date(hire); d.setFullYear(d.getFullYear() + 2);
    if (d <= new Date('2026-05-27')) steps.push({ date: d.toISOString().slice(0, 10), title: `Promotion · ${e.role}`, type: 'promotion' });
  }
  return steps.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// =====================================================================
// Paquet 4 (thèmes R–T) — suivi médical (métadonnées), communication, système.
// RÈGLE DURE : aucune donnée médicale (diagnostic, pathologie) ici. Les
// restrictions sont OPÉRATIONNELLES, jamais médicales.
// =====================================================================
function eidNum(e: EmployeeRecord): number { return parseInt(e.id.replace(/\D/g, ''), 10) || 1; }
const APTITUDE_LABEL: Record<string, string> = {
  fit: 'Apte', fit_with_restrictions: 'Apte avec restrictions',
  temporarily_unfit: 'Inapte temporaire', permanently_unfit: 'Inapte définitif', pending_opinion: "En attente d'avis",
};

// R — Suivi médical professionnel (métadonnées uniquement)
export interface MedicalFollowup {
  doctor: string; service: string;
  lastVisit: string; lastVisitType: string; nextVisit: string;
  aptitude: keyof typeof APTITUDE_LABEL; aptitudeLabel: string;
  restrictions: string[]; validUntil: string | null;
}
export function employeeMedicalFollowup(e: EmployeeRecord): MedicalFollowup {
  const month = String(((eidNum(e) % 12) + 1)).padStart(2, '0');
  const lastVisit = `2025-${month}-12`;
  const nextVisit = e.medicalVisit ?? `2027-${month}-12`;
  const restricted = e.department === 'Opérations';
  return {
    doctor: e.countryCode === 'SN' ? 'Dr Awa Diop' : 'Dr Aya Coulibaly',
    service: 'Service de santé au travail interne',
    lastVisit, lastVisitType: 'Visite périodique', nextVisit,
    aptitude: restricted ? 'fit_with_restrictions' : 'fit',
    aptitudeLabel: APTITUDE_LABEL[restricted ? 'fit_with_restrictions' : 'fit'],
    restrictions: restricted ? ['Pas de port de charges > 15 kg', 'Aménagement horaire (pauses)'] : [],
    validUntil: restricted ? '2026-12-31' : null,
  };
}

export interface Vaccination { label: string; status: 'up_to_date' | 'recall_due_soon' | 'expired'; nextRecall: string | null; obligatory: boolean; }
export function employeeVaccinations(e: EmployeeRecord): Vaccination[] {
  const ops = e.department === 'Opérations';
  const out: Vaccination[] = [
    { label: 'Tétanos / Polio', status: ops ? 'recall_due_soon' : 'up_to_date', nextRecall: ops ? '2026-11-30' : '2030-06-15', obligatory: ops },
  ];
  if (ops) out.unshift({ label: 'Hépatite B', status: 'up_to_date', nextRecall: null, obligatory: true });
  return out;
}

// S — Communication & préférences (vue compacte)
export interface CommunicationPrefs { language: string; mainChannel: string; disconnection: 'enabled' | 'disabled' | 'not_applicable'; disconnectionLabel: string; customized: boolean; }
export function employeeCommunicationPrefs(e: EmployeeRecord): CommunicationPrefs {
  const cadre = e.baseSalary >= 1_200_000;
  const disconnection = cadre ? 'enabled' : 'not_applicable';
  return {
    language: 'Français', mainChannel: 'Application + Email',
    disconnection, disconnectionLabel: disconnection === 'enabled' ? 'Activé' : 'Non applicable',
    customized: eidNum(e) % 2 === 0,
  };
}

export interface Consent { code: string; label: string; granted: boolean; }
export function employeeConsents(e: EmployeeRecord): Consent[] {
  const n = eidNum(e);
  return [
    { code: 'CONS-1', label: 'Annuaire interne', granted: true },
    { code: 'CONS-2', label: 'Photo dans l’organigramme', granted: n % 3 !== 0 },
    { code: 'CONS-3', label: 'Événements personnels (anniversaires…)', granted: n % 2 === 0 },
    { code: 'CONS-4', label: 'Newsletter & communication interne', granted: true },
  ];
}

// T — Métadonnées système
export interface SystemMeta {
  lifecycleLabel: string; lifecycleTone: 'ok' | 'info' | 'warn' | 'danger';
  createdAt: string; createdBy: string; lastModified: string; modificationCount: number;
  contractSignedAt: string; effectiveEntry: string; exitDate: string | null; anonymizationDue: string | null;
  legalEntity: string; branch: string; fiscalNumber: string;
  hrReferent: string; hrBackup: string;
}
const LIFECYCLE: Record<EmployeeRecord['status'], { label: string; tone: SystemMeta['lifecycleTone'] }> = {
  active: { label: 'Actif', tone: 'ok' },
  onboarding: { label: 'En attente de signature', tone: 'info' },
  leave: { label: 'Suspension (autre)', tone: 'warn' },
  notice: { label: 'Préavis de sortie', tone: 'danger' },
};
export function employeeSystemMeta(e: EmployeeRecord): SystemMeta {
  const lc = LIFECYCLE[e.status];
  const created = new Date(e.hireDate); created.setDate(created.getDate() - 12);
  const entity = e.countryCode === 'SN' ? 'Atlas Studio Sénégal SUARL' : e.countryCode === 'CI' ? 'Atlas Studio CI SARL' : 'Atlas Studio SA';
  return {
    lifecycleLabel: lc.label, lifecycleTone: lc.tone,
    createdAt: created.toISOString().slice(0, 10), createdBy: 'Valentina Okou (DRH)',
    lastModified: '2026-05-20', modificationCount: eidNum(e) * 3 + 4,
    contractSignedAt: e.hireDate, effectiveEntry: e.hireDate,
    exitDate: e.status === 'notice' ? (e.cddEnd ?? '2026-07-31') : null,
    anonymizationDue: null,
    legalEntity: entity, branch: 'Siège', fiscalNumber: `${matricule(e)}-FISC`,
    hrReferent: 'Valentina Okou', hrBackup: 'Mariam Cissé',
  };
}

// --- M2 Temps & absences ---
export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string; // code LEAVE_TYPES
  start: string; // YYYY-MM-DD
  end: string;
  status: 'pending' | 'approved' | 'refused';
}

export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'l1', employeeId: 'e2', type: 'annual', start: '2026-05-18', end: '2026-05-22', status: 'pending' },
  { id: 'l2', employeeId: 'e4', type: 'family', start: '2026-05-29', end: '2026-05-29', status: 'pending' },
  { id: 'l3', employeeId: 'e10', type: 'sick', start: '2026-05-12', end: '2026-05-13', status: 'approved' },
  { id: 'l4', employeeId: 'e8', type: 'annual', start: '2026-05-25', end: '2026-05-27', status: 'pending' },
  { id: 'l5', employeeId: 'e6', type: 'annual', start: '2026-05-20', end: '2026-05-23', status: 'approved' },
];

// --- M4 Notes de frais ---
export interface ExpenseClaim {
  id: string;
  employeeId: string;
  category: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'refused';
  hasReceipt: boolean;
}

export const EXPENSE_CLAIMS: ExpenseClaim[] = [
  { id: 'x1', employeeId: 'e4', category: 'transport', amount: 85_000, date: '2026-05-08', status: 'pending', hasReceipt: true },
  { id: 'x2', employeeId: 'e4', category: 'restauration', amount: 32_000, date: '2026-05-09', status: 'pending', hasReceipt: true },
  { id: 'x3', employeeId: 'e2', category: 'hebergement', amount: 72_000, date: '2026-05-10', status: 'approved', hasReceipt: true },
  // Doublon volontaire (x5 identique à x4)
  { id: 'x4', employeeId: 'e10', category: 'carburant', amount: 45_000, date: '2026-05-11', status: 'pending', hasReceipt: false },
  { id: 'x5', employeeId: 'e10', category: 'carburant', amount: 45_000, date: '2026-05-11', status: 'pending', hasReceipt: false },
  // Fractionnement volontaire (e8 : 2 frais ~plafond restauration 25k sur 2 jours)
  { id: 'x6', employeeId: 'e8', category: 'restauration', amount: 24_000, date: '2026-05-14', status: 'pending', hasReceipt: true },
  { id: 'x7', employeeId: 'e8', category: 'restauration', amount: 23_500, date: '2026-05-15', status: 'pending', hasReceipt: true },
  { id: 'x8', employeeId: 'e14', category: 'transport', amount: 320_000, date: '2026-05-06', status: 'pending', hasReceipt: true },
];

// Heatmap d'assiduité (42 jours, intensité 0..1)
export const ATTENDANCE_MATRIX = Array.from({ length: 42 }, (_, i) => {
  const seed = (i * 73 + 17) % 100;
  return seed < 12 ? 0 : seed < 35 ? 0.3 : seed < 70 ? 0.6 : 1;
});
