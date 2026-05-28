/**
 * Règles de congés & durée légale du travail par pays (illustratif, versionnable).
 * L'acquisition du congé annuel diffère selon le droit national.
 */
export interface CountryTimeRules {
  /** Congé annuel légal (jours ouvrables). */
  annualLeaveDays: number;
  /** Acquisition mensuelle (jours ouvrables / mois travaillé). */
  monthlyAccrual: number;
  /** Durée légale hebdomadaire (heures), base des heures supplémentaires. */
  weeklyHours: number;
  /** Congé maternité légal (jours). */
  maternityDays: number;
}

export const COUNTRY_TIME_RULES: Record<string, CountryTimeRules> = {
  CI: { annualLeaveDays: 26, monthlyAccrual: 2.2, weeklyHours: 40, maternityDays: 98 },
  SN: { annualLeaveDays: 24, monthlyAccrual: 2.0, weeklyHours: 40, maternityDays: 98 },
};

export function timeRulesFor(country: string): CountryTimeRules {
  return COUNTRY_TIME_RULES[country] ?? COUNTRY_TIME_RULES.CI;
}

export const LEAVE_TYPES = [
  { code: 'annual', label: 'Congé annuel', tone: 'amber' as const },
  { code: 'sick', label: 'Maladie', tone: 'info' as const },
  { code: 'maternity', label: 'Maternité / Paternité', tone: 'ok' as const },
  { code: 'unpaid', label: 'Sans solde', tone: 'neutral' as const },
  { code: 'family', label: 'Événement familial', tone: 'warn' as const },
];

/** Solde de congé annuel acquis selon l'ancienneté et la règle du pays. */
export function accruedAnnualLeave(hireDateISO: string, country: string, asOf = new Date()): number {
  const rules = timeRulesFor(country);
  const hire = new Date(hireDateISO);
  // Acquisition plafonnée à l'année en cours (report géré ailleurs).
  const startOfYear = new Date(asOf.getFullYear(), 0, 1);
  const from = hire > startOfYear ? hire : startOfYear;
  const months = Math.max(0, (asOf.getMonth() - from.getMonth()) + (asOf.getFullYear() - from.getFullYear()) * 12 + 1);
  return Math.min(rules.annualLeaveDays, Math.round(months * rules.monthlyAccrual * 10) / 10);
}
