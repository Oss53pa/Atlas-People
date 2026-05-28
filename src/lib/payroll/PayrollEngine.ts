/**
 * PayrollEngine — moteur de paie déterministe, paramétré par régime-pays.
 *
 * RÈGLE DURE (cahier §2.3) : aucun LLM n'intervient ici. Calcul TypeScript pur.
 * Le LLM n'interprète QUE l'intention d'une requête en langage naturel ;
 * il ne calcule jamais un montant.
 */

import { Money } from '../money';
import type { PayrollInput, PayslipLine, PayslipResult, Regime, TaxBracket } from './types';

/** Barème progressif marginal appliqué à un revenu mensuel. */
function computeProgressiveTax(
  taxable: Money,
  brackets: TaxBracket[],
  currency: Money['currency'],
): Money {
  let tax = Money.zero(currency);
  let previousCeiling = 0;

  for (const bracket of brackets) {
    const upperBound = bracket.upTo ?? Number.MAX_SAFE_INTEGER;
    const upper = Money.of(upperBound, currency);
    const lower = Money.of(previousCeiling, currency);

    // Part du revenu tombant dans cette tranche.
    const sliceTop = Money.min(taxable, upper);
    const slice = sliceTop.subtract(lower);
    if (slice.isNegative() || slice.isZero()) {
      if (taxable.lte(upper)) break;
      previousCeiling = upperBound;
      continue;
    }

    tax = tax.add(slice.applyRateBps(bracket.bps));
    previousCeiling = upperBound;
    if (taxable.lte(upper)) break;
  }

  return tax;
}

export class PayrollEngine {
  static run(input: PayrollInput, regime: Regime): PayslipResult {
    const { currency } = regime;
    const lines: PayslipLine[] = [];

    const baseSalary = Money.of(input.baseSalary, currency);
    const taxableAllowances = Money.of(input.taxableAllowances ?? 0, currency);
    const nonTaxableAllowances = Money.of(input.nonTaxableAllowances ?? 0, currency);
    const fiscalParts = Math.max(1, Math.round(input.fiscalParts ?? 1));

    const grossTaxable = baseSalary.add(taxableAllowances);
    const grossTotal = grossTaxable.add(nonTaxableAllowances);

    // --- Gains ---
    lines.push(earning('SAL_BASE', 'Salaire de base', baseSalary));
    if (!taxableAllowances.isZero()) {
      lines.push(earning('PRIME_IMP', 'Primes imposables', taxableAllowances));
    }
    if (!nonTaxableAllowances.isZero()) {
      lines.push(earning('IND_TRANSP', 'Indemnités non imposables', nonTaxableAllowances));
    }

    // --- Cotisations sociales ---
    let totalEmployeeContribution = Money.zero(currency);
    let totalEmployerContribution = Money.zero(currency);

    for (const c of regime.contributions) {
      const base =
        c.base === 'capped' && c.ceiling != null
          ? Money.min(grossTaxable, Money.of(c.ceiling, currency))
          : grossTaxable;

      if (c.employeeBps > 0) {
        const amount = base.applyRateBps(c.employeeBps);
        totalEmployeeContribution = totalEmployeeContribution.add(amount);
        lines.push({
          code: c.code,
          label: c.label,
          kind: 'employee_contribution',
          baseUnits: base.toJSON().units,
          rateBps: c.employeeBps,
          amountUnits: amount.negate().toJSON().units,
        });
      }
      if (c.employerBps > 0) {
        const amount = base.applyRateBps(c.employerBps);
        totalEmployerContribution = totalEmployerContribution.add(amount);
        lines.push({
          code: `${c.code}_PAT`,
          label: `${c.label} (part patronale)`,
          kind: 'employer_contribution',
          baseUnits: base.toJSON().units,
          rateBps: c.employerBps,
          amountUnits: amount.toJSON().units,
        });
      }
    }

    // --- Impôt sur le revenu (cotisations sociales déductibles + abattement) ---
    const afterSocial = grossTaxable.subtract(totalEmployeeContribution).clampPositive();
    const abatement = regime.incomeTax.abatementBps
      ? afterSocial.applyRateBps(regime.incomeTax.abatementBps)
      : Money.zero(currency);
    const netTaxable = afterSocial.subtract(abatement).clampPositive();

    // Quotient familial : impôt par part puis re-multiplication.
    const taxablePerPart = netTaxable.divideInt(fiscalParts);
    const taxPerPart = computeProgressiveTax(taxablePerPart, regime.incomeTax.brackets, currency);
    const incomeTax = taxPerPart.multiplyInt(fiscalParts);

    lines.push({
      code: regime.incomeTax.code,
      label: regime.incomeTax.label,
      kind: 'tax',
      baseUnits: netTaxable.toJSON().units,
      amountUnits: incomeTax.negate().toJSON().units,
    });

    // --- Retenues diverses (avances, prêts, oppositions — après impôt) ---
    let totalOtherDeductions = Money.zero(currency);
    for (const d of input.otherDeductions ?? []) {
      const amount = Money.of(d.amount, currency);
      totalOtherDeductions = totalOtherDeductions.add(amount);
      lines.push({
        code: d.code,
        label: d.label,
        kind: 'deduction',
        baseUnits: amount.toJSON().units,
        amountUnits: amount.negate().toJSON().units,
        account: d.account,
      });
    }

    // --- Taxes patronales (FDFP, CFCE…) ---
    let totalEmployerTax = Money.zero(currency);
    for (const t of regime.employerTaxes) {
      const amount = grossTaxable.applyRateBps(t.bps);
      totalEmployerTax = totalEmployerTax.add(amount);
      lines.push({
        code: t.code,
        label: t.label,
        kind: 'employer_tax',
        baseUnits: grossTaxable.toJSON().units,
        rateBps: t.bps,
        amountUnits: amount.toJSON().units,
      });
    }

    // --- Net à payer + coût employeur ---
    const netToPay = grossTotal
      .subtract(totalEmployeeContribution)
      .subtract(incomeTax)
      .subtract(totalOtherDeductions);
    const employerCost = grossTotal.add(totalEmployerContribution).add(totalEmployerTax);

    return {
      currency,
      regimeVersion: regime.version,
      countryCode: regime.countryCode,
      lines,
      grossTaxableUnits: grossTaxable.toJSON().units,
      grossTotalUnits: grossTotal.toJSON().units,
      totalEmployeeContributionUnits: totalEmployeeContribution.toJSON().units,
      incomeTaxUnits: incomeTax.toJSON().units,
      totalOtherDeductionsUnits: totalOtherDeductions.toJSON().units,
      netToPayUnits: netToPay.toJSON().units,
      totalEmployerContributionUnits: totalEmployerContribution.toJSON().units,
      totalEmployerTaxUnits: totalEmployerTax.toJSON().units,
      employerCostUnits: employerCost.toJSON().units,
    };
  }
}

function earning(code: string, label: string, amount: Money): PayslipLine {
  return {
    code,
    label,
    kind: 'earning',
    baseUnits: amount.toJSON().units,
    amountUnits: amount.toJSON().units,
  };
}
