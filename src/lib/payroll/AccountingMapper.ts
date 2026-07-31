/**
 * AccountingMapper — génération DÉTERMINISTE des écritures SYSCOHADA
 * déversées dans Atlas FNA (cahier §3 M3, §5.3).
 *
 * Comptes : 66 charges de personnel, 42 personnel, 43 organismes sociaux,
 * 447 État (impôts), 637 autres charges (taxes patronales formation).
 * L'écriture produite est toujours équilibrée (Σ débit = Σ crédit).
 */

import { Money, type Currency } from '../money';
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
  /**
   * Devise de l'écriture. Les lignes ne portent que des `units` : sans cette
   * information au niveau de l'écriture, agréger des bulletins XOF et XAF
   * produirait un total silencieusement faux au lieu d'une erreur.
   */
  currency: Currency;
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
        // `||` et non `??` : une rubrique mal paramétrée porte un compte VIDE
        // plus souvent qu'un compte absent, et une ligne sans compte casse le
        // déversement bien plus loin (côté Atlas FNA).
        return credit(l.account || plan.deductionDefault, l.label, positive);
      });

    const lines: JournalLine[] = [
      // Le segment avant le tiret est celui que `aggregate` conserve sur l'OD
      // consolidée : il est choisi identique au libellé produit côté SQL
      // (migration 0057) pour que l'écran et la base disent la même chose.
      debit(plan.gross, `Rémunérations du personnel (brut) — ${employeeLabel}`, grossTotal),
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
      currency,
    };
  }

  /**
   * Consolide plusieurs écritures individuelles (une par bulletin) en UNE
   * écriture de campagne, agrégée par compte — c'est l'OD de paie du cycle.
   *
   * Somme de deux écritures équilibrées ⇒ écriture équilibrée : le `balanced`
   * retourné n'est donc pas un contrôle décoratif, il ne peut tomber à `false`
   * que si l'une des écritures sources l'était déjà. Le contrôle reste explicite
   * (et affiché) parce qu'un déversement comptable ne se fait jamais à l'aveugle.
   *
   * ⚠️ Devise unique, vérifiée écriture par écriture : les lignes ne portant que
   * des `units`, une campagne XOF + XAF s'additionnerait sans broncher et
   * produirait un total dénué de sens. Une campagne multi-zone doit être agrégée
   * par devise (une OD par devise), jamais convertie ici.
   */
  static aggregate(entries: JournalEntry[], currency: Currency): JournalEntry {
    const byAccount = new Map<
      string,
      { label: string; mixedLabels: boolean; debit: Money; credit: Money }
    >();

    for (const entry of entries) {
      if (entry.currency !== currency) {
        throw new Error(
          `AccountingMapper.aggregate: mélange de devises interdit (${entry.currency} dans une OD ${currency})`,
        );
      }
      for (const line of entry.lines) {
        const acc = byAccount.get(line.account) ?? {
          label: line.label,
          mixedLabels: false,
          debit: Money.zero(currency),
          credit: Money.zero(currency),
        };
        acc.mixedLabels = acc.mixedLabels || acc.label !== line.label;
        acc.debit = acc.debit.add(Money.fromJSON({ units: line.debitUnits, currency }));
        acc.credit = acc.credit.add(Money.fromJSON({ units: line.creditUnits, currency }));
        byAccount.set(line.account, acc);
      }
    }

    const lines: JournalLine[] = [...byAccount.entries()].map(([account, v]) => ({
      account,
      label: v.mixedLabels ? collectiveLabel(v.label) : v.label,
      debitUnits: v.debit.toJSON().units,
      creditUnits: v.credit.toJSON().units,
    }));

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
      currency,
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

/**
 * Libellé d'une ligne consolidée dont les sources divergent — en pratique le
 * compte 661, dont l'écriture individuelle porte le nom du salarié
 * (« Rémunérations — Awa Koné »). Garder le premier nommerait un salarié au
 * hasard sur une ligne qui les agrège tous : on ne conserve que le segment
 * commun, avant le tiret cadratin.
 */
function collectiveLabel(label: string): string {
  const [head] = label.split(' — ');
  return head.trim() || label;
}
