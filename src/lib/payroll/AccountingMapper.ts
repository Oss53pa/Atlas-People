/**
 * AccountingMapper — génération DÉTERMINISTE des écritures SYSCOHADA
 * déversées dans Atlas FNA (cahier §3 M3, §5.3).
 *
 * Comptes : 66 charges de personnel, 42 personnel, 43 organismes sociaux,
 * 447 État (impôts), 637 autres charges (taxes patronales formation).
 * L'écriture produite est toujours équilibrée (Σ débit = Σ crédit).
 */

import { Money } from '../money';
import type { PayslipResult } from './types';
import { DEFAULT_ACCOUNTING_PLAN, type AccountingPlan } from './AccountingPlan';

export interface JournalLine {
  account: string;
  label: string;
  debitUnits: string;
  creditUnits: string;
}

export interface JournalEntry {
  lines: JournalLine[];
  balanced: boolean;
  totalDebitUnits: string;
  totalCreditUnits: string;
}

export class AccountingMapper {
  static fromPayslip(
    result: PayslipResult,
    employeeLabel: string,
    plan: AccountingPlan = DEFAULT_ACCOUNTING_PLAN,
  ): JournalEntry {
    const { currency } = result;
    const M = (units: string) => Money.fromJSON({ units, currency });

    const grossTotal = M(result.grossTotalUnits);
    const employeeContrib = M(result.totalEmployeeContributionUnits);
    const employerContrib = M(result.totalEmployerContributionUnits);
    const employerTax = M(result.totalEmployerTaxUnits);
    const incomeTax = M(result.incomeTaxUnits);
    const netToPay = M(result.netToPayUnits);

    const socialDue = employeeContrib.add(employerContrib);

    // Retenues diverses : créditées sur leur compte de contrepartie (421/427…).
    const deductionLines = result.lines
      .filter((l) => l.kind === 'deduction')
      .map((l) => {
        const amount = M(l.amountUnits); // négatif côté salarié
        const positive = amount.isNegative() ? amount.negate() : amount;
        return credit(l.account ?? '421000', l.label, positive);
      });

    const lines: JournalLine[] = [
      debit(plan.gross, `Rémunérations — ${employeeLabel}`, grossTotal),
      debit(plan.employerSocial, 'Charges sociales patronales', employerContrib),
      debit(plan.employerTaxExpense, 'Cotisations formation prof. (FDFP/CFCE)', employerTax),
      credit(plan.net, 'Personnel — rémunérations dues (net)', netToPay),
      credit(plan.social, 'Sécurité sociale (caisses)', socialDue),
      credit(plan.incomeTax, 'État — impôt sur salaires', incomeTax),
      credit(plan.employerTaxLiability, 'Organismes sociaux — taxes formation', employerTax),
      ...deductionLines,
    ].filter((l) => !isZero(l));

    const totalDebit = Money.sum(
      lines.map((l) => Money.fromJSON({ units: l.debitUnits, currency })),
      currency,
    );
    const totalCredit = Money.sum(
      lines.map((l) => Money.fromJSON({ units: l.creditUnits, currency })),
      currency,
    );

    return {
      lines,
      balanced: totalDebit.equals(totalCredit),
      totalDebitUnits: totalDebit.toJSON().units,
      totalCreditUnits: totalCredit.toJSON().units,
    };
  }
}

function debit(account: string, label: string, amount: Money): JournalLine {
  return { account, label, debitUnits: amount.toJSON().units, creditUnits: '0' };
}
function credit(account: string, label: string, amount: Money): JournalLine {
  return { account, label, debitUnits: '0', creditUnits: amount.toJSON().units };
}
function isZero(l: JournalLine): boolean {
  return l.debitUnits === '0' && l.creditUnits === '0';
}
