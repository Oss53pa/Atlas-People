/**
 * Calcul des jours ouvrés (lun-ven, hors jours fériés du pays).
 * Règle paramétrable : les fériés tombant pendant un congé ne sont pas décomptés.
 */
import { isHoliday } from './holidays';

function parse(d: string): Date {
  return new Date(`${d}T00:00:00`);
}

export function workingDaysBetween(startISO: string, endISO: string, country: string): number {
  const start = parse(startISO);
  const end = parse(endISO);
  if (end < start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay(); // 0 = dim, 6 = sam
    if (day !== 0 && day !== 6 && !isHoliday(cur, country)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function calendarDaysBetween(startISO: string, endISO: string): number {
  const ms = parse(endISO).getTime() - parse(startISO).getTime();
  return ms < 0 ? 0 : Math.round(ms / 86_400_000) + 1;
}
