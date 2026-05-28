/**
 * Jours fériés par pays (config illustrative 2026, à valider par la veille).
 * Le calcul des jours ouvrés s'appuie dessus.
 */
export interface Holiday {
  date: string; // YYYY-MM-DD
  label: string;
}

export const PUBLIC_HOLIDAYS_2026: Record<string, Holiday[]> = {
  CI: [
    { date: '2026-01-01', label: "Jour de l'An" },
    { date: '2026-05-01', label: 'Fête du Travail' },
    { date: '2026-08-07', label: 'Fête Nationale' },
    { date: '2026-08-15', label: 'Assomption' },
    { date: '2026-11-01', label: 'Toussaint' },
    { date: '2026-12-25', label: 'Noël' },
  ],
  SN: [
    { date: '2026-01-01', label: "Jour de l'An" },
    { date: '2026-04-04', label: "Fête de l'Indépendance" },
    { date: '2026-05-01', label: 'Fête du Travail' },
    { date: '2026-08-15', label: 'Assomption' },
    { date: '2026-11-01', label: 'Toussaint' },
    { date: '2026-12-25', label: 'Noël' },
  ],
};

export function holidaysFor(country: string): Holiday[] {
  return PUBLIC_HOLIDAYS_2026[country] ?? [];
}

export function isHoliday(date: Date, country: string): boolean {
  const iso = date.toISOString().slice(0, 10);
  return holidaysFor(country).some((h) => h.date === iso);
}
