/**
 * M2 — Agrégation & décompte du temps (déterministe, pur TypeScript).
 *
 * Croise les trois sources opérationnelles du module Temps & absences :
 *   - pointages   (useClocking)  → présence réelle, anomalies
 *   - congés      (useTimeOff)   → absences décomptées par type
 *   - heures sup  (useOvertime)  → HS détectées / validées
 *
 * Produit le décompte mensuel par collaborateur qui alimente la paie (M3) :
 *   jours ouvrés − absences décomptées = jours travaillés payables (+ HS).
 * Le LLM ne calcule jamais ce décompte : toute la logique est ici.
 */
import { workingDaysBetween } from '../time/workingDays';
import { leaveTypeByCode, type LeaveCategory } from './leaveTypes';
import type { Clocking } from '../../store/useClocking';
import type { TimeOffRequest } from '../../store/useTimeOff';
import type { OvertimeRecord } from '../../store/useOvertime';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Bornes ISO d'un mois `YYYY-MM` (premier / dernier jour calendaire). */
export function monthBounds(month: string): { start: string; end: string; days: number } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${String(last).padStart(2, '0')}`, days: last };
}

/** Intersection d'une période [start,end] avec un mois, ou null si disjointe. */
function clipToMonth(start: string, end: string, month: string): { start: string; end: string } | null {
  const b = monthBounds(month);
  const s = start > b.start ? start : b.start;
  const e = end < b.end ? end : b.end;
  return s > e ? null : { start: s, end: e };
}

export interface LeaveLine {
  code: string;
  label: string;
  category: LeaveCategory;
  days: number;          // jours ouvrés décomptés sur le mois
  status: TimeOffRequest['status'];
}

export interface MonthDecompte {
  employeeId: string;
  month: string;
  /** Jours ouvrés théoriques du mois (hors WE + fériés). */
  workingDays: number;
  /** Jours ouvrés d'absence approuvée tombant sur des jours ouvrés. */
  absenceDays: number;
  /** Jours ouvrés d'absence encore en attente de validation. */
  pendingAbsenceDays: number;
  /** Jours effectivement travaillés payables = workingDays − absenceDays. */
  workedDays: number;
  /** Détail des absences (approuvées + en attente) imputées au mois. */
  leaveLines: LeaveLine[];
  /** Décompte d'absence par catégorie (jours ouvrés, approuvées seulement). */
  byCategory: Partial<Record<LeaveCategory, number>>;
  /** Pointages enregistrés sur le mois. */
  clockCount: number;
  /** Jours pointés (au moins une entrée) distincts. */
  pointedDays: number;
  /** Anomalies de pointage (entrée sans sortie, ou à vérifier). */
  anomalies: number;
  /** Heures sup validées (à reporter en paie). */
  hsValidatedHours: number;
  /** Heures sup détectées/déclarées en attente. */
  hsPendingHours: number;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Compte les anomalies de pointage du mois : jours avec une entrée sans sortie,
 *  ou tout pointage marqué « à vérifier ». */
function clockingAnomalies(monthClockings: Clocking[]): number {
  let anomalies = monthClockings.filter((c) => c.verification === 'to_verify').length;
  const byDay = new Map<string, { in: number; out: number }>();
  for (const c of monthClockings) {
    const k = dayKey(c.at);
    const slot = byDay.get(k) ?? { in: 0, out: 0 };
    if (c.type === 'in') slot.in += 1;
    if (c.type === 'out') slot.out += 1;
    byDay.set(k, slot);
  }
  for (const slot of byDay.values()) {
    if (slot.in > 0 && slot.out === 0) anomalies += 1;
  }
  return anomalies;
}

/** Décompte mensuel d'un collaborateur à partir des trois flux opérationnels. */
export function buildMonthDecompte(
  employeeId: string,
  month: string,
  country: string,
  sources: { clockings: Clocking[]; requests: TimeOffRequest[]; overtime: OvertimeRecord[] },
): MonthDecompte {
  const b = monthBounds(month);
  const workingDays = workingDaysBetween(b.start, b.end, country);

  // --- Absences (congés) ---
  const leaveLines: LeaveLine[] = [];
  const byCategory: Partial<Record<LeaveCategory, number>> = {};
  let absenceDays = 0;
  let pendingAbsenceDays = 0;

  for (const r of sources.requests) {
    if (r.employeeId !== employeeId) continue;
    if (r.status === 'refused') continue;
    const clip = clipToMonth(r.start, r.end, month);
    if (!clip) continue;
    // jours ouvrés réellement absents sur le mois (impact présence/paie)
    const days = workingDaysBetween(clip.start, clip.end, country);
    if (days <= 0) continue;
    const def = leaveTypeByCode(r.code);
    const category = def?.category ?? 'other';
    leaveLines.push({ code: r.code, label: r.label, category, days: round1(days), status: r.status });
    if (r.status === 'approved') {
      absenceDays += days;
      byCategory[category] = round1((byCategory[category] ?? 0) + days);
    } else {
      pendingAbsenceDays += days;
    }
  }
  absenceDays = round1(absenceDays);
  pendingAbsenceDays = round1(pendingAbsenceDays);

  // --- Pointages ---
  const monthClockings = sources.clockings.filter(
    (c) => c.employeeId === employeeId && c.at.slice(0, 7) === month,
  );
  const pointedDays = new Set(monthClockings.filter((c) => c.type === 'in').map((c) => dayKey(c.at))).size;
  const anomalies = clockingAnomalies(monthClockings);

  // --- Heures supplémentaires ---
  const monthOt = sources.overtime.filter((r) => r.employeeId === employeeId && r.date.slice(0, 7) === month);
  const hsValidatedHours = round1(monthOt.filter((r) => r.status === 'validated').reduce((s, r) => s + r.overtimeHours, 0));
  const hsPendingHours = round1(
    monthOt.filter((r) => r.status === 'pending' || r.status === 'detected').reduce((s, r) => s + r.overtimeHours, 0),
  );

  return {
    employeeId,
    month,
    workingDays: round1(workingDays),
    absenceDays,
    pendingAbsenceDays,
    workedDays: round1(Math.max(0, workingDays - absenceDays)),
    leaveLines,
    byCategory,
    clockCount: monthClockings.length,
    pointedDays,
    anomalies,
    hsValidatedHours,
    hsPendingHours,
  };
}

export interface FleetDecompte {
  month: string;
  rows: MonthDecompte[];
  totals: {
    headcount: number;
    workingDays: number;
    absenceDays: number;
    workedDays: number;
    pendingAbsenceDays: number;
    hsValidatedHours: number;
    hsPendingHours: number;
    anomalies: number;
  };
}

/** Agrège le décompte mensuel sur tout un effectif (périmètre pays). */
export function buildFleetDecompte(
  employeeIds: string[],
  month: string,
  country: string,
  sources: { clockings: Clocking[]; requests: TimeOffRequest[]; overtime: OvertimeRecord[] },
): FleetDecompte {
  const rows = employeeIds.map((id) => buildMonthDecompte(id, month, country, sources));
  const totals = rows.reduce(
    (acc, r) => ({
      headcount: acc.headcount + 1,
      workingDays: acc.workingDays + r.workingDays,
      absenceDays: round1(acc.absenceDays + r.absenceDays),
      workedDays: round1(acc.workedDays + r.workedDays),
      pendingAbsenceDays: round1(acc.pendingAbsenceDays + r.pendingAbsenceDays),
      hsValidatedHours: round1(acc.hsValidatedHours + r.hsValidatedHours),
      hsPendingHours: round1(acc.hsPendingHours + r.hsPendingHours),
      anomalies: acc.anomalies + r.anomalies,
    }),
    { headcount: 0, workingDays: 0, absenceDays: 0, workedDays: 0, pendingAbsenceDays: 0, hsValidatedHours: 0, hsPendingHours: 0, anomalies: 0 },
  );
  return { month, rows, totals };
}
