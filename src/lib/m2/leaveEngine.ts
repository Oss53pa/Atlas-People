/**
 * M2 — Moteur déterministe de temps & congés (thèmes β, ε, ζ). Pur TypeScript,
 * aucune dépendance LLM. Décompte de jours (hors WE + fériés), acquisition des
 * congés payés (base + ancienneté + mère de famille + jeune travailleur),
 * soldes & report, conversion heures sup ↔ récupération.
 */
import { holidaySet, type Holiday } from './holidays';
import type { CountUnit } from './leaveTypes';

const MS_DAY = 86_400_000;
const round1 = (n: number) => Math.round(n * 10) / 10;

function eachDay(startISO: string, endISO: string): Date[] {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  const out: Date[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += MS_DAY) out.push(new Date(t));
  return out;
}

function iso(d: Date): string { return d.toISOString().slice(0, 10); }
function isWeekend(d: Date): boolean { const g = d.getDay(); return g === 0 || g === 6; }
function isSunday(d: Date): boolean { return d.getDay() === 0; }

/**
 * Décompte des jours d'un congé selon le mode :
 *  - working_days (ouvrés)   : lun–ven, hors fériés
 *  - open_days (ouvrables)   : lun–sam, hors fériés (dimanche exclu)
 *  - calendar_days           : tous les jours
 */
export function countLeaveDays(
  startISO: string,
  endISO: string,
  mode: CountUnit,
  opts: { countryCode?: string; holidays?: Holiday[]; halfDayStart?: boolean; halfDayEnd?: boolean } = {},
): number {
  if (mode === 'hours') return 0;
  const fer = mode === 'calendar_days' ? new Set<string>() : holidaySet(opts.countryCode ?? 'CI', opts.holidays);
  let count = 0;
  for (const d of eachDay(startISO, endISO)) {
    if (mode === 'working_days' && isWeekend(d)) continue;
    if (mode === 'open_days' && isSunday(d)) continue;
    if (fer.has(iso(d))) continue;
    count++;
  }
  if (count > 0 && opts.halfDayStart) count -= 0.5;
  if (count > 0 && opts.halfDayEnd) count -= 0.5;
  return round1(count);
}

// --- Acquisition des congés payés (thème β) ---
export interface AccrualRules {
  baseRatePerMonth: number;                          // ex. 2.2 j ouvrables / mois
  seniorityBonus: { years: number; days: number }[]; // paliers cumulés (le plus haut atteint)
  motherBonusPerChild: number;
  motherChildAgeMax: number;
  youngWorker?: { ageMax: number; days: number };
  carryoverPolicy: 'full' | 'partial' | 'none';
  carryoverMaxDays?: number;
  expiryMonths?: number;
}

/** Régime indicatif Côte d'Ivoire (OHANA/OHADA). */
export const DEFAULT_ACCRUAL_CI: AccrualRules = {
  baseRatePerMonth: 2.2,
  seniorityBonus: [{ years: 5, days: 1 }, { years: 10, days: 2 }, { years: 15, days: 3 }, { years: 20, days: 5 }],
  motherBonusPerChild: 2,
  motherChildAgeMax: 14,
  youngWorker: { ageMax: 18, days: 2 },
  carryoverPolicy: 'partial',
  carryoverMaxDays: 10,
  expiryMonths: 13,
};

export function seniorityBonusDays(rules: AccrualRules, seniorityYears: number): number {
  let bonus = 0;
  for (const tier of rules.seniorityBonus) if (seniorityYears >= tier.years) bonus = tier.days;
  return bonus;
}

export interface AccrualContext { seniorityYears: number; childrenUnder14?: number; age?: number }

/** Droit annuel théorique (jours) : base × 12 + majorations. */
export function annualEntitlement(rules: AccrualRules, ctx: AccrualContext): number {
  const base = rules.baseRatePerMonth * 12;
  const seniority = seniorityBonusDays(rules, ctx.seniorityYears);
  const mother = (ctx.childrenUnder14 ?? 0) * rules.motherBonusPerChild;
  const young = rules.youngWorker && ctx.age !== undefined && ctx.age < rules.youngWorker.ageMax ? rules.youngWorker.days : 0;
  return round1(base + seniority + mother + young);
}

/** Acquisition mensuelle de base (les majorations sont créditées annuellement). */
export function monthlyAccrual(rules: AccrualRules): number {
  return round1(rules.baseRatePerMonth);
}

// --- Soldes & report (thème β) ---
export interface LeaveBalance { acquired: number; taken: number; pending: number; carriedOver: number }

export function availableBalance(b: LeaveBalance): number {
  return round1(b.acquired + b.carriedOver - b.taken - b.pending);
}

/** Reliquat reportable en fin de période selon la politique. */
export function carryOver(rules: AccrualRules, remaining: number): number {
  if (rules.carryoverPolicy === 'none') return 0;
  if (rules.carryoverPolicy === 'full') return round1(Math.max(0, remaining));
  return round1(Math.min(Math.max(0, remaining), rules.carryoverMaxDays ?? 0));
}

// --- Heures supplémentaires (thème ζ) ---
export interface OvertimeRules {
  weeklyThresholdHours: number;
  tier1Hours: number; tier1RatePct: number;
  tier2RatePct: number;
}

/** Régime indicatif Côte d'Ivoire : 40h/sem, +15% (8 premières h sup), puis +50%. */
export const DEFAULT_OVERTIME_CI: OvertimeRules = {
  weeklyThresholdHours: 40,
  tier1Hours: 8,
  tier1RatePct: 15,
  tier2RatePct: 50,
};

export interface OvertimeBreakdown { tier1Hours: number; tier1RatePct: number; tier2Hours: number; tier2RatePct: number; totalOvertimeHours: number }

/** Décomposition déterministe des heures sup d'une semaine selon les paliers. */
export function computeWeeklyOvertime(weeklyHoursWorked: number, rules: OvertimeRules = DEFAULT_OVERTIME_CI): OvertimeBreakdown {
  const over = Math.max(0, round1(weeklyHoursWorked - rules.weeklyThresholdHours));
  const tier1 = Math.min(over, rules.tier1Hours);
  const tier2 = round1(Math.max(0, over - rules.tier1Hours));
  return { tier1Hours: round1(tier1), tier1RatePct: rules.tier1RatePct, tier2Hours: tier2, tier2RatePct: rules.tier2RatePct, totalOvertimeHours: over };
}
