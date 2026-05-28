/**
 * PayrollVerifier — vérification indépendante (cahier §2.3 + §5.3).
 *
 * Double run : PayrollEngine + PayrollVerifier (implémentations INDÉPENDANTES).
 * Tout écart = blocage de l'émission du bulletin.
 *
 * Cette implémentation recalcule volontairement les totaux critiques par un
 * chemin de code différent (réduction fonctionnelle, regroupement distinct)
 * afin de détecter une erreur de codage dans le moteur principal.
 */

import { Money } from '../money';
import type { PayrollInput, PayslipResult, Regime, TaxBracket } from './types';

export interface VerificationResult {
  ok: boolean;
  discrepancies: Array<{ field: string; engine: string; verifier: string }>;
}

function progressive(taxable: Money, brackets: TaxBracket[]): Money {
  // Chemin alternatif : accumulation par reduce sur des bornes pré-calculées.
  const currency = taxable.currency;
  const bounds = brackets.map((b, i) => ({
    floor: i === 0 ? 0 : (brackets[i - 1].upTo ?? 0),
    ceil: b.upTo ?? Number.MAX_SAFE_INTEGER,
    bps: b.bps,
  }));

  return bounds.reduce((tax, band) => {
    const top = Math.min(taxable.toInt(), band.ceil);
    const width = top - band.floor;
    if (width <= 0) return tax;
    return tax.add(Money.of(width, currency).applyRateBps(band.bps));
  }, Money.zero(currency));
}

export class PayrollVerifier {
  static verify(input: PayrollInput, regime: Regime, result: PayslipResult): VerificationResult {
    const { currency } = regime;
    const grossTaxable = Money.of(
      input.baseSalary + (input.taxableAllowances ?? 0),
      currency,
    );
    const fiscalParts = Math.max(1, Math.round(input.fiscalParts ?? 1));

    // Recalcul indépendant des cotisations salariales (reduce direct).
    const employeeContribution = regime.contributions.reduce((acc, c) => {
      if (c.employeeBps <= 0) return acc;
      const base =
        c.base === 'capped' && c.ceiling != null
          ? Money.min(grossTaxable, Money.of(c.ceiling, currency))
          : grossTaxable;
      return acc.add(base.applyRateBps(c.employeeBps));
    }, Money.zero(currency));

    // Recalcul indépendant de l'impôt.
    const afterSocial = grossTaxable.subtract(employeeContribution).clampPositive();
    const netTaxable = regime.incomeTax.abatementBps
      ? afterSocial.subtract(afterSocial.applyRateBps(regime.incomeTax.abatementBps)).clampPositive()
      : afterSocial;
    const incomeTax = progressive(netTaxable.divideInt(fiscalParts), regime.incomeTax.brackets).multiplyInt(
      fiscalParts,
    );

    // Retenues diverses (somme indépendante).
    const otherDeductions = (input.otherDeductions ?? []).reduce(
      (acc, d) => acc.add(Money.of(d.amount, currency)),
      Money.zero(currency),
    );

    // Net à payer indépendant.
    const grossTotal = grossTaxable.add(Money.of(input.nonTaxableAllowances ?? 0, currency));
    const netToPay = grossTotal.subtract(employeeContribution).subtract(incomeTax).subtract(otherDeductions);

    const checks: Array<[string, Money, string]> = [
      ['totalEmployeeContribution', employeeContribution, result.totalEmployeeContributionUnits],
      ['incomeTax', incomeTax, result.incomeTaxUnits],
      ['netToPay', netToPay, result.netToPayUnits],
    ];

    const discrepancies = checks
      .filter(([, computed, engineUnits]) => computed.toJSON().units !== engineUnits)
      .map(([field, computed, engineUnits]) => ({
        field,
        engine: engineUnits,
        verifier: computed.toJSON().units,
      }));

    return { ok: discrepancies.length === 0, discrepancies };
  }
}
