import type { EmployeeRecord } from '../../data/mock';
import { memberOkr } from './perf';

/** M8 — Reporting & pilotage. Dérivations déterministes et AGRÉGÉES (démo).
 *  Règles dures :
 *   - R12 : masse salariale agrégée uniquement, jamais de montant individuel ;
 *           toute statistique masquée si périmètre < 5 (anti ré-identification).
 *   - Aucune nature médicale détaillée (absentéisme par grande catégorie). */

const TODAY = '2026-05-28';
export const MIN_AGG = 5; // seuil d'anonymisation

function hash(id: string): number { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; }
export const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
function yearsSince(iso: string) { return (new Date(`${TODAY}T00:00:00`).getTime() - new Date(`${iso}T00:00:00`).getTime()) / (365.25 * 86400000); }

// ---- déductions déterministes individuelles (jamais exposées telles quelles) ----
const ageOf = (e: EmployeeRecord) => 24 + (hash(e.id) % 26);              // 24..49
const isFemale = (e: EmployeeRecord) => (hash(e.id + 'g') & 1) === 0;
const siteOf = (e: EmployeeRecord) => (hash(e.id + 's') % 3 === 0 ? 'Cosmos Angré' : 'Cosmos Yopougon');
const monthlyCost = (e: EmployeeRecord) => e.baseSalary + e.taxableAllowances + e.nonTaxableAllowances;

// ============================== REP.1 — KPI ==============================
export interface KpiSummary {
  total: number; deltaHeadcount: number; women: number; men: number; pctWomen: number; pctMen: number;
  avgSeniority: number; avgAge: number;
  departures12m: number; turnoverRate: number; companyTurnover: number;
  absMonth: number; absDelta: number; absYear: number; companyAbs: number;
  hoursWorked: number; otYear: number; otTarget: number; recupAvailable: number;
  payrollMasked: boolean; payrollMonth: number; payrollBudget: number; payrollDeltaPct: number;
  trainingBudget: number; trainingSpent: number; trainingHours: number;
  okrGlobal: number; promotions: number; mobilities: number;
  engagement: number; satisfaction: number; rpsAlerts: number;
}

export function kpiSummary(team: EmployeeRecord[]): KpiSummary {
  const total = team.length;
  const women = team.filter(isFemale).length;
  const men = total - women;
  const departures12m = team.filter((e) => e.status === 'notice').length;
  const payroll = team.reduce((s, e) => s + monthlyCost(e), 0);
  const payrollBudget = Math.round(payroll * 0.982);
  const okrGlobal = total ? Math.round(team.reduce((s, e) => s + memberOkr(e).progress, 0) / total) : 0;
  const eng = total ? 6.5 + ((team.reduce((s, e) => s + (100 - e.retentionAttention), 0) / total) / 100) * 3 : 0;

  return {
    total, deltaHeadcount: 1,
    women, men,
    pctWomen: total ? Math.round((women / total) * 100) : 0,
    pctMen: total ? Math.round((men / total) * 100) : 0,
    avgSeniority: total ? Math.round((team.reduce((s, e) => s + yearsSince(e.hireDate), 0) / total) * 10) / 10 : 0,
    avgAge: total ? Math.round(team.reduce((s, e) => s + ageOf(e), 0) / total) : 0,
    departures12m,
    turnoverRate: total ? Math.round((departures12m / total) * 1000) / 10 : 0,
    companyTurnover: 7.5,
    absMonth: 4.2, absDelta: -0.5, absYear: 4.8, companyAbs: 5.1,
    hoursWorked: total * 156,
    otYear: Math.round(total * 15.6), otTarget: total * 220,
    recupAvailable: Math.round(total * 2),
    payrollMasked: total < MIN_AGG,
    payrollMonth: payroll, payrollBudget,
    payrollDeltaPct: payrollBudget ? Math.round(((payroll - payrollBudget) / payrollBudget) * 1000) / 10 : 0,
    trainingBudget: 4_000_000, trainingSpent: 1_850_000, trainingHours: total * 7,
    okrGlobal, promotions: 1, mobilities: 2,
    engagement: Math.round(eng * 10) / 10, satisfaction: 4.1, rpsAlerts: 0,
  };
}

// ============================== REP.2 — Effectif ==============================
export interface Band { label: string; count: number }
export function ageBands(team: EmployeeRecord[]): Band[] {
  const buckets: Record<string, number> = { '-25': 0, '25-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0 };
  for (const e of team) {
    const a = ageOf(e);
    const k = a < 25 ? '-25' : a < 30 ? '25-29' : a < 40 ? '30-39' : a < 50 ? '40-49' : a < 60 ? '50-59' : '60+';
    buckets[k]++;
  }
  return Object.entries(buckets).reverse().map(([label, count]) => ({ label, count }));
}
export function seniorityBands(team: EmployeeRecord[]): Band[] {
  const buckets: Record<string, number> = { '-1 an': 0, '1-3 ans': 0, '3-5 ans': 0, '5-10 ans': 0, '10+ ans': 0 };
  for (const e of team) {
    const y = yearsSince(e.hireDate);
    const k = y < 1 ? '-1 an' : y < 3 ? '1-3 ans' : y < 5 ? '3-5 ans' : y < 10 ? '5-10 ans' : '10+ ans';
    buckets[k]++;
  }
  return Object.entries(buckets).reverse().map(([label, count]) => ({ label, count }));
}
export function siteSplit(team: EmployeeRecord[]): Band[] {
  const m: Record<string, number> = {};
  for (const e of team) { const s = siteOf(e); m[s] = (m[s] ?? 0) + 1; }
  return Object.entries(m).map(([label, count]) => ({ label, count }));
}
export function headcountTrend(team: EmployeeRecord[]): { month: string; value: number }[] {
  const months = ['Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Janv', 'Fév', 'Mars', 'Avr', 'Mai'];
  const base = Math.max(team.length - 2, 1);
  return months.map((month, i) => ({ month, value: Math.min(base + Math.round(i / 3), team.length) }));
}

// ============================== REP.3 — Temps ==============================
export interface AbsCause { label: string; pct: number }
export const ABSENCE_CAUSES: AbsCause[] = [
  { label: 'Maladie ordinaire', pct: 56 },
  { label: 'Congés spéciaux familiaux', pct: 22 },
  { label: 'Accident du travail', pct: 0 },
  { label: 'Autres', pct: 22 },
];
export function overtimeByMember(team: EmployeeRecord[]): { name: string; hours: number; pct: number }[] {
  const raw = team.map((e) => ({ name: `${e.firstName} ${e.lastName.charAt(0)}.`, hours: 4 + (hash(e.id + 'ot') % 90) }));
  const tot = raw.reduce((s, r) => s + r.hours, 0) || 1;
  return raw.map((r) => ({ ...r, pct: Math.round((r.hours / tot) * 100) })).sort((a, b) => b.hours - a.hours);
}
export interface TimeStats { leaveBalance: number; leaveTakenQ: number; leaveExpiring: number; expiringPeople: number; otTotal: number; otTarget: number; otPaidPct: number; otRecupPct: number; clockAnomalies: number; anomaliesDelta: number; }
export function timeStats(team: EmployeeRecord[]): TimeStats {
  const t = team.length;
  return { leaveBalance: t * 12, leaveTakenQ: t * 3, leaveExpiring: 13, expiringPeople: Math.min(2, t), otTotal: overtimeByMember(team).reduce((s, r) => s + r.hours, 0), otTarget: t * 220, otPaidPct: 60, otRecupPct: 40, clockAnomalies: t + 2, anomaliesDelta: -3 };
}

// ============================== REP.4 — Masse salariale ==============================
export interface PayrollNature { label: string; pct: number }
export const PAYROLL_NATURE: PayrollNature[] = [
  { label: 'Salaires de base', pct: 65 },
  { label: 'Indemnités obligatoires', pct: 12 },
  { label: 'Primes variables', pct: 8 },
  { label: 'HS / Compléments', pct: 5 },
  { label: 'Charges patronales', pct: 10 },
];
export interface PayrollAgg {
  masked: boolean; month: number; budget: number; deltaPct: number;
  bySite: { label: string; amount: number; pct: number }[];
  costPerEtp: number;
  trend: { month: string; value: number }[];
  projectionYear: number; budgetYear: number; projectionDeltaPct: number;
}
export function payrollAggregated(team: EmployeeRecord[]): PayrollAgg {
  const month = team.reduce((s, e) => s + monthlyCost(e), 0);
  const budget = Math.round(month * 0.982);
  const siteMap: Record<string, number> = {};
  for (const e of team) { const s = siteOf(e); siteMap[s] = (siteMap[s] ?? 0) + monthlyCost(e); }
  const months = ['Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Janv', 'Fév', 'Mars', 'Avr', 'Mai'];
  return {
    masked: team.length < MIN_AGG,
    month, budget,
    deltaPct: budget ? Math.round(((month - budget) / budget) * 1000) / 10 : 0,
    bySite: Object.entries(siteMap).map(([label, amount]) => ({ label, amount, pct: month ? Math.round((amount / month) * 100) : 0 })),
    costPerEtp: team.length ? Math.round(month / team.length) : 0,
    trend: months.map((month2, i) => ({ month: month2, value: Math.round(month * (0.93 + i * 0.006)) })),
    projectionYear: month * 12,
    budgetYear: budget * 12,
    projectionDeltaPct: 1.8,
  };
}

// ============================== REP.5 — Formation ==============================
export const TRAINING_CATEGORIES: Band[] = [
  { label: 'Technique métier', count: 45 },
  { label: 'Management', count: 30 },
  { label: 'Soft skills', count: 15 },
  { label: 'Sécurité / obligatoire', count: 10 },
];
export function trainingByMember(team: EmployeeRecord[]): { name: string; hours: number }[] {
  return team.map((e) => ({ name: `${e.firstName} ${e.lastName.charAt(0)}.`, hours: 2 + (hash(e.id + 'tr') % 18) })).sort((a, b) => b.hours - a.hours);
}

// ============================== REP.6 — Performance ==============================
export interface OkrDistribution { label: string; pct: number; tone: 'ok' | 'info' | 'warn' | 'danger' }
export const OKR_DISTRIBUTION: OkrDistribution[] = [
  { label: 'Atteint', pct: 5, tone: 'ok' },
  { label: 'En avance', pct: 25, tone: 'ok' },
  { label: 'En cours', pct: 40, tone: 'info' },
  { label: 'En risque', pct: 22, tone: 'warn' },
  { label: 'Bas', pct: 8, tone: 'danger' },
];
export function evalDistribution(team: EmployeeRecord[]): { label: string; count: number }[] {
  const buckets = [0, 0, 0, 0, 0, 0]; // 1..5 + non évalué
  for (const e of team) {
    if (e.status === 'onboarding') { buckets[5]++; continue; }
    const note = 2 + (hash(e.id + 'ev') % 4); // 2..5
    buckets[note - 1]++;
  }
  return [
    { label: '5 / 5', count: buckets[4] },
    { label: '4 / 5', count: buckets[3] },
    { label: '3 / 5', count: buckets[2] },
    { label: '2 / 5', count: buckets[1] },
    { label: '1 / 5', count: buckets[0] },
    { label: 'Non évalué (essai)', count: buckets[5] },
  ];
}

// ============================== REP.9 — Exports ==============================
export interface ExportKind { key: string; label: string; format: 'PDF' | 'Excel' }
export const QUICK_EXPORTS: ExportKind[] = [
  { key: 'kpi', label: 'KPI équipe (format comité)', format: 'PDF' },
  { key: 'headcount', label: 'Données effectif', format: 'Excel' },
  { key: 'time', label: 'Analyse temps', format: 'Excel' },
  { key: 'payroll', label: 'Masse salariale agrégée', format: 'PDF' },
  { key: 'training', label: 'Formation', format: 'PDF' },
  { key: 'performance', label: 'Performance', format: 'PDF' },
];
export interface RecentExport { name: string; date: string }
export const RECENT_EXPORTS: RecentExport[] = [
  { name: 'Reporting Avril 2026.pdf', date: '15/05/2026' },
  { name: 'KPI Q1 2026.xlsx', date: '02/04/2026' },
];
