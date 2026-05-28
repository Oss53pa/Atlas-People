/**
 * Jours fériés (M2 ↔ M1 P1.18). Référentiel déterministe pour le décompte des
 * congés (hors fériés) et les majorations. Aligné sur le seed SQL
 * (migration 0011 public_holidays — CI 2026).
 */
export interface Holiday {
  label: string;
  date: string; // YYYY-MM-DD
  type: 'civil' | 'muslim' | 'christian' | 'national' | 'customary';
  countryCode: string;
  variable: boolean; // fête mobile (lunaire / Pâques)
}

export const HOLIDAYS_2026: Holiday[] = [
  { label: 'Nouvel An', date: '2026-01-01', type: 'civil', countryCode: 'CI', variable: false },
  { label: 'Lundi de Pâques', date: '2026-04-06', type: 'christian', countryCode: 'CI', variable: true },
  { label: 'Aïd el-Fitr', date: '2026-03-20', type: 'muslim', countryCode: 'CI', variable: true },
  { label: 'Fête du Travail', date: '2026-05-01', type: 'civil', countryCode: 'CI', variable: false },
  { label: 'Aïd el-Kébir (Tabaski)', date: '2026-05-27', type: 'muslim', countryCode: 'CI', variable: true },
  { label: "Fête de l'Indépendance", date: '2026-08-07', type: 'national', countryCode: 'CI', variable: false },
  { label: 'Assomption', date: '2026-08-15', type: 'christian', countryCode: 'CI', variable: false },
  { label: 'Noël', date: '2026-12-25', type: 'christian', countryCode: 'CI', variable: false },
];

/** Ensemble des dates fériées (YYYY-MM-DD) pour un pays donné. */
export function holidaySet(countryCode: string, holidays: Holiday[] = HOLIDAYS_2026): Set<string> {
  return new Set(holidays.filter((h) => h.countryCode === countryCode).map((h) => h.date));
}
