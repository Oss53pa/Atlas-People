/**
 * OD de paie du cycle — contrôle d'équilibre sur les données réelles du cycle,
 * qui portent des retenues (avance 421, mutuelle/opposition 427, prêt 425).
 *
 * Ce fichier vaut aussi constat du défaut corrigé : le schéma précédent de
 * ComptabilitePage (ratio 45/55 sur les cotisations, retenues omises, net en
 * 421) est reconstitué ici pour montrer qu'il tombait faux sur ce même cycle.
 */
import { describe, it, expect } from 'vitest';
import { usePayrollCycle } from '../../../store/usePayrollCycle';
import { cycleBulletins, cycleTotals, cycleJournalEntries, cycleOdEntry } from '../cycle';
import { DEFAULT_ACCOUNTING_PLAN as PLAN } from '../../payroll/AccountingPlan';
import type { JournalEntry } from '../../payroll/AccountingMapper';

const { variables, statuses, prevNet } = usePayrollCycle.getState();
const rows = cycleBulletins(variables, statuses, prevNet);
const totals = cycleTotals(rows);
const od = cycleOdEntry(variables);

const debitOf = (e: JournalEntry, account: string) =>
  e.lines.filter((l) => l.account === account).reduce((s, l) => s + Number(l.debitUnits), 0);
const creditOf = (e: JournalEntry, account: string) =>
  e.lines.filter((l) => l.account === account).reduce((s, l) => s + Number(l.creditUnits), 0);

describe('OD du cycle — équilibre', () => {
  it('le cycle porte bien des retenues diverses (sinon le test ne prouve rien)', () => {
    expect(totals.retenues).toBeGreaterThan(0);
  });

  it('OD consolidée équilibrée', () => {
    expect(od.balanced).toBe(true);
    expect(Number(od.totalDebitUnits)).toBe(Number(od.totalCreditUnits));
  });

  it('chaque écriture individuelle est équilibrée', () => {
    for (const e of cycleJournalEntries(variables)) expect(e.balanced).toBe(true);
  });

  it('les retenues sont portées par l\'OD, sur leurs comptes de contrepartie', () => {
    const comptesRetenue = od.lines
      .filter((l) => l.account.startsWith('42') && l.account !== PLAN.net)
      .reduce((s, l) => s + Number(l.creditUnits), 0);
    expect(comptesRetenue).toBe(totals.retenues);
  });
});

describe('OD du cycle — imputations exactes', () => {
  it('661 = brut, 664 + 637 = charges patronales', () => {
    expect(debitOf(od, PLAN.gross)).toBe(totals.brut);
    expect(debitOf(od, PLAN.employerSocial) + debitOf(od, PLAN.employerTaxExpense))
      .toBe(totals.patronal);
  });

  it('422 = net à payer (et non 421)', () => {
    expect(creditOf(od, PLAN.net)).toBe(totals.net);
    expect(PLAN.net).toBe('422000');
  });

  it('447 = impôt réel du moteur, 431 = cotisations sociales sal. + pat.', () => {
    expect(creditOf(od, PLAN.incomeTax)).toBe(totals.impot);
    expect(creditOf(od, PLAN.social))
      .toBe(totals.cotisationsSociales + debitOf(od, PLAN.employerSocial));
  });

  it('cotisationsEmp se décompose exactement en cotisations sociales + impôt', () => {
    expect(totals.cotisationsSociales + totals.impot).toBe(totals.cotisationsEmp);
  });
});

describe('OD du cycle — le schéma précédent était faux', () => {
  // Reconstitution littérale de ComptabilitePage avant correction.
  const ancien = [
    { debit: totals.brut, credit: 0 },
    { debit: totals.patronal, credit: 0 },
    { debit: 0, credit: Math.round(totals.cotisationsEmp * 0.45) + totals.patronal },
    { debit: 0, credit: Math.round(totals.cotisationsEmp * 0.55) },
    { debit: 0, credit: totals.net },
  ];
  const ancienDebit = ancien.reduce((s, l) => s + l.debit, 0);
  const ancienCredit = ancien.reduce((s, l) => s + l.credit, 0);

  it('la clé 45/55 ne retrouve pas l\'impôt réel', () => {
    expect(Math.round(totals.cotisationsEmp * 0.55)).not.toBe(totals.impot);
  });

  it('l\'ancienne OD était déséquilibrée du montant des retenues omises', () => {
    expect(ancienDebit).not.toBe(ancienCredit);
    // L'écart est exactement les retenues, à l'arrondi de la clé 45/55 près.
    const arrondi =
      totals.cotisationsEmp
      - Math.round(totals.cotisationsEmp * 0.45)
      - Math.round(totals.cotisationsEmp * 0.55);
    expect(ancienDebit - ancienCredit).toBe(totals.retenues + arrondi);
  });
});
