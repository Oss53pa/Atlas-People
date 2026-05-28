/**
 * Heures supplémentaires : majorations légales par pays + calcul du montant.
 * Calcul déterministe via Money.ts. Le plafond hebdomadaire est appliqué par
 * ComplianceGuard (blocage), pas ici.
 */
import { Money, type Currency } from '../money';
import { timeRulesFor } from './leaveRules';

interface OvertimeBracket {
  /** Limite haute de la tranche (heures hebdo cumulées). */
  upToHours: number | null;
  /** Majoration en points de base (15 % = 1500). */
  majorationBps: number;
}

// Barèmes illustratifs (à valider par la veille).
const BRACKETS: Record<string, OvertimeBracket[]> = {
  CI: [
    { upToHours: 8, majorationBps: 1500 }, // +15 %
    { upToHours: null, majorationBps: 5000 }, // +50 %
  ],
  SN: [
    { upToHours: 8, majorationBps: 1500 },
    { upToHours: null, majorationBps: 6000 }, // +60 %
  ],
};

export function overtimeBrackets(country: string): OvertimeBracket[] {
  return BRACKETS[country] ?? BRACKETS.CI;
}

/** Taux horaire dérivé du salaire mensuel et de la durée légale. */
export function hourlyRate(monthlyBase: number, country: string, currency: Currency): Money {
  const rules = timeRulesFor(country);
  const monthlyHours = Math.round((rules.weeklyHours * 52) / 12); // ≈ 173 h/mois
  return Money.of(monthlyBase, currency).divideInt(monthlyHours);
}

export interface OvertimeBreakdownLine {
  hours: number;
  majorationBps: number;
  amountUnits: string;
}

/** Montant total des heures supplémentaires + détail par tranche. */
export function computeOvertime(
  monthlyBase: number,
  overtimeHours: number,
  country: string,
  currency: Currency,
): { totalUnits: string; lines: OvertimeBreakdownLine[] } {
  const rate = hourlyRate(monthlyBase, country, currency);
  const brackets = overtimeBrackets(country);
  const lines: OvertimeBreakdownLine[] = [];
  let total = Money.zero(currency);
  let remaining = overtimeHours;
  let previous = 0;

  for (const b of brackets) {
    if (remaining <= 0) break;
    const cap = b.upToHours ?? Number.MAX_SAFE_INTEGER;
    const inBracket = Math.min(remaining, cap - previous);
    if (inBracket <= 0) {
      previous = cap;
      continue;
    }
    const amount = rate.multiplyInt(inBracket).applyRateBps(10_000 + b.majorationBps);
    total = total.add(amount);
    lines.push({ hours: inBracket, majorationBps: b.majorationBps, amountUnits: amount.toJSON().units });
    remaining -= inBracket;
    previous = cap;
  }

  return { totalUnits: total.toJSON().units, lines };
}
