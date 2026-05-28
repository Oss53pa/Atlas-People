// Port Deno fidèle du moteur de paie (src/lib/payroll/PayrollEngine.ts).
// RÈGLE DURE (cahier §2.3) : calcul 100% déterministe, AUCUN LLM. Le serveur
// recalcule le bulletin de manière autoritative ; le résultat est identique au
// front (même Money bigint), ce qui garantit la cohérence du hash d'audit.
import { Money, type Currency } from './money.ts';

export interface Contribution {
  code: string; label: string; base: 'gross' | 'capped'; ceiling?: number;
  employeeBps: number; employerBps: number;
}
export interface TaxBracket { upTo: number | null; bps: number }
export interface IncomeTax { code: string; label: string; abatementBps?: number; brackets: TaxBracket[] }
export interface EmployerTax { code: string; label: string; bps: number; account: string }
export interface Regime {
  countryCode: string; currency: Currency; version: string;
  contributions: Contribution[]; incomeTax: IncomeTax; employerTaxes: EmployerTax[];
}
export interface OtherDeduction { code: string; label: string; amount: number; account: string }
export interface PayrollInput {
  baseSalary: number; taxableAllowances?: number; nonTaxableAllowances?: number;
  fiscalParts?: number; otherDeductions?: OtherDeduction[];
}
export interface PayslipLine {
  code: string; label: string; kind: string; baseUnits: string; rateBps?: number; amountUnits: string; account?: string;
}
export interface PayslipResult {
  currency: Currency; regimeVersion: string; countryCode: string; lines: PayslipLine[];
  grossTaxableUnits: string; grossTotalUnits: string; totalEmployeeContributionUnits: string;
  incomeTaxUnits: string; totalOtherDeductionsUnits: string; netToPayUnits: string;
  totalEmployerContributionUnits: string; totalEmployerTaxUnits: string; employerCostUnits: string;
}

function progressiveTax(taxable: Money, brackets: TaxBracket[], currency: Currency): Money {
  let tax = Money.zero(currency);
  let previousCeiling = 0;
  for (const b of brackets) {
    const upperBound = b.upTo ?? Number.MAX_SAFE_INTEGER;
    const upper = Money.of(upperBound, currency);
    const lower = Money.of(previousCeiling, currency);
    const sliceTop = Money.min(taxable, upper);
    const slice = sliceTop.subtract(lower);
    if (slice.isNegative() || slice.isZero()) {
      if (taxable.lte(upper)) break;
      previousCeiling = upperBound;
      continue;
    }
    tax = tax.add(slice.applyRateBps(b.bps));
    previousCeiling = upperBound;
    if (taxable.lte(upper)) break;
  }
  return tax;
}

const earning = (code: string, label: string, amount: Money): PayslipLine => ({
  code, label, kind: 'earning', baseUnits: amount.toJSON().units, amountUnits: amount.toJSON().units,
});

export function computePayslip(input: PayrollInput, regime: Regime): PayslipResult {
  const { currency } = regime;
  const lines: PayslipLine[] = [];

  const baseSalary = Money.of(input.baseSalary, currency);
  const taxableAllowances = Money.of(input.taxableAllowances ?? 0, currency);
  const nonTaxableAllowances = Money.of(input.nonTaxableAllowances ?? 0, currency);
  const fiscalParts = Math.max(1, Math.round(input.fiscalParts ?? 1));

  const grossTaxable = baseSalary.add(taxableAllowances);
  const grossTotal = grossTaxable.add(nonTaxableAllowances);

  lines.push(earning('SAL_BASE', 'Salaire de base', baseSalary));
  if (!taxableAllowances.isZero()) lines.push(earning('PRIME_IMP', 'Primes imposables', taxableAllowances));
  if (!nonTaxableAllowances.isZero()) lines.push(earning('IND_TRANSP', 'Indemnités non imposables', nonTaxableAllowances));

  let employeeContrib = Money.zero(currency);
  let employerContrib = Money.zero(currency);
  for (const c of regime.contributions) {
    const base = c.base === 'capped' && c.ceiling != null ? Money.min(grossTaxable, Money.of(c.ceiling, currency)) : grossTaxable;
    if (c.employeeBps > 0) {
      const amount = base.applyRateBps(c.employeeBps);
      employeeContrib = employeeContrib.add(amount);
      lines.push({ code: c.code, label: c.label, kind: 'employee_contribution', baseUnits: base.toJSON().units, rateBps: c.employeeBps, amountUnits: amount.negate().toJSON().units });
    }
    if (c.employerBps > 0) {
      const amount = base.applyRateBps(c.employerBps);
      employerContrib = employerContrib.add(amount);
      lines.push({ code: `${c.code}_PAT`, label: `${c.label} (part patronale)`, kind: 'employer_contribution', baseUnits: base.toJSON().units, rateBps: c.employerBps, amountUnits: amount.toJSON().units });
    }
  }

  const afterSocial = grossTaxable.subtract(employeeContrib).clampPositive();
  const abatement = regime.incomeTax.abatementBps ? afterSocial.applyRateBps(regime.incomeTax.abatementBps) : Money.zero(currency);
  const netTaxable = afterSocial.subtract(abatement).clampPositive();
  const taxablePerPart = netTaxable.divideInt(fiscalParts);
  const taxPerPart = progressiveTax(taxablePerPart, regime.incomeTax.brackets, currency);
  const incomeTax = taxPerPart.multiplyInt(fiscalParts);
  lines.push({ code: regime.incomeTax.code, label: regime.incomeTax.label, kind: 'tax', baseUnits: netTaxable.toJSON().units, amountUnits: incomeTax.negate().toJSON().units });

  let otherDeductions = Money.zero(currency);
  for (const d of input.otherDeductions ?? []) {
    const amount = Money.of(d.amount, currency);
    otherDeductions = otherDeductions.add(amount);
    lines.push({ code: d.code, label: d.label, kind: 'deduction', baseUnits: amount.toJSON().units, amountUnits: amount.negate().toJSON().units, account: d.account });
  }

  let employerTax = Money.zero(currency);
  for (const t of regime.employerTaxes) {
    const amount = grossTaxable.applyRateBps(t.bps);
    employerTax = employerTax.add(amount);
    lines.push({ code: t.code, label: t.label, kind: 'employer_tax', baseUnits: grossTaxable.toJSON().units, rateBps: t.bps, amountUnits: amount.toJSON().units });
  }

  const netToPay = grossTotal.subtract(employeeContrib).subtract(incomeTax).subtract(otherDeductions);
  const employerCost = grossTotal.add(employerContrib).add(employerTax);

  return {
    currency, regimeVersion: regime.version, countryCode: regime.countryCode, lines,
    grossTaxableUnits: grossTaxable.toJSON().units, grossTotalUnits: grossTotal.toJSON().units,
    totalEmployeeContributionUnits: employeeContrib.toJSON().units, incomeTaxUnits: incomeTax.toJSON().units,
    totalOtherDeductionsUnits: otherDeductions.toJSON().units, netToPayUnits: netToPay.toJSON().units,
    totalEmployerContributionUnits: employerContrib.toJSON().units, totalEmployerTaxUnits: employerTax.toJSON().units,
    employerCostUnits: employerCost.toJSON().units,
  };
}

/** SMIG mensuel indicatif par pays (FCFA) — miroir de ComplianceGuard. */
const MONTHLY_SMIG: Record<string, number> = { CI: 75_000, SN: 64_500, CM: 41_875 };
export const monthlySmig = (countryCode: string): number => MONTHLY_SMIG[countryCode] ?? 60_000;

export function checkSalaryFloor(monthlySalary: number, countryCode: string): { ok: boolean; smig: number; message: string } {
  const smig = monthlySmig(countryCode);
  return monthlySalary < smig
    ? { ok: false, smig, message: `Salaire (${monthlySalary}) inférieur au SMIG ${countryCode} (${smig} FCFA) — paie bloquée.` }
    : { ok: true, smig, message: `Salaire conforme (≥ SMIG ${smig} FCFA).` };
}
