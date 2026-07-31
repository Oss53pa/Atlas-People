/**
 * Tests de la chaîne comptable : mapping SYSCOHADA d'un bulletin, puis
 * consolidation en OD de campagne.
 *
 * L'enjeu central est l'ÉQUILIBRE EN PRÉSENCE DE RETENUES DIVERSES. Sans
 * retenue, `brut = cotisations salariales + impôt + net` et à peu près
 * n'importe quel schéma « tombe juste ». Dès qu'une avance ou une opposition
 * apparaît, cette égalité est fausse : le net baisse sans que le brut ni les
 * cotisations bougent, et l'écart n'est absorbé que si la retenue est imputée
 * sur son compte de contrepartie (421 avances / 427 oppositions).
 */
import { describe, it, expect } from 'vitest';
import { computePayslip } from '../index';
import { AccountingMapper } from '../AccountingMapper';
import { DEFAULT_ACCOUNTING_PLAN as PLAN } from '../AccountingPlan';
import { REGIME_CI } from '../regimes/cnps_ci';
import { REGIME_SN } from '../regimes/ipres_sn';
import type { JournalEntry } from '../AccountingMapper';
import type { PayrollInput } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────

function entryFor(input: PayrollInput, regime = REGIME_CI): JournalEntry {
  return computePayslip(input, regime, 'Collaborateur test').accounting;
}

/** Cumul débit d'un compte dans une écriture (0 si le compte est absent). */
function debitOf(entry: JournalEntry, account: string): number {
  return entry.lines
    .filter((l) => l.account === account)
    .reduce((s, l) => s + Number(l.debitUnits), 0);
}

function creditOf(entry: JournalEntry, account: string): number {
  return entry.lines
    .filter((l) => l.account === account)
    .reduce((s, l) => s + Number(l.creditUnits), 0);
}

const AVANCE = { code: 'X300_AVANCE', label: 'Avance sur salaire', amount: 50_000, account: '421000' };
const OPPOSITION = { code: 'X310_OPPO', label: 'Saisie-arrêt', amount: 30_000, account: '427000' };

// ═══════════════════════════════════════════════════════════
// Écriture individuelle — équilibre
// ═══════════════════════════════════════════════════════════

describe('AccountingMapper — équilibre de l\'écriture', () => {
  it('écriture équilibrée sans retenue', () => {
    const e = entryFor({ baseSalary: 500_000 });
    expect(e.balanced).toBe(true);
    expect(e.totalDebitUnits).toBe(e.totalCreditUnits);
  });

  it('écriture équilibrée AVEC retenues (avance 421 + opposition 427)', () => {
    const e = entryFor({ baseSalary: 500_000, otherDeductions: [AVANCE, OPPOSITION] });
    expect(e.balanced).toBe(true);
    expect(Number(e.totalDebitUnits)).toBe(Number(e.totalCreditUnits));
    // Les retenues sont bien portées, chacune sur SON compte.
    expect(creditOf(e, '421000')).toBe(50_000);
    expect(creditOf(e, '427000')).toBe(30_000);
  });

  it('la retenue déplace du net vers les comptes de contrepartie, à débit constant', () => {
    const sans = entryFor({ baseSalary: 500_000 });
    const avec = entryFor({ baseSalary: 500_000, otherDeductions: [AVANCE, OPPOSITION] });

    // Le débit (charge employeur) est identique : une retenue ne coûte rien de plus.
    expect(Number(avec.totalDebitUnits)).toBe(Number(sans.totalDebitUnits));
    // Le net baisse exactement du montant des retenues.
    expect(creditOf(sans, PLAN.net) - creditOf(avec, PLAN.net)).toBe(80_000);
    expect(avec.balanced).toBe(true);
  });

  it('retenue sans compte explicite : repli sur le compte par défaut du plan (421)', () => {
    const e = entryFor({
      baseSalary: 400_000,
      // `account` volontairement vide — cas d'une rubrique mal paramétrée.
      otherDeductions: [{ code: 'X999', label: 'Retenue non mappée', amount: 12_000, account: '' }],
    });
    expect(e.balanced).toBe(true);
    expect(creditOf(e, PLAN.deductionDefault)).toBe(12_000);
  });

  it('équilibre tenu sur une grille de salaires et de retenues (CI et SN)', () => {
    for (const regime of [REGIME_CI, REGIME_SN]) {
      for (const baseSalary of [90_000, 250_000, 750_000, 2_400_000]) {
        for (const retenue of [0, 15_000, 120_000]) {
          const e = entryFor({
            baseSalary,
            taxableAllowances: 25_000,
            nonTaxableAllowances: 30_000,
            otherDeductions: retenue ? [{ ...AVANCE, amount: retenue }] : [],
          }, regime);
          expect(e.balanced, `${regime.countryCode} ${baseSalary}/${retenue}`).toBe(true);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════
// Imputations — montants réels, jamais une clé de répartition
// ═══════════════════════════════════════════════════════════

describe('AccountingMapper — imputations', () => {
  const input: PayrollInput = {
    baseSalary: 600_000,
    taxableAllowances: 40_000,
    otherDeductions: [AVANCE],
  };

  it('431 = cotisations sociales salariales + patronales (montants du moteur)', () => {
    const { result, accounting } = computePayslip(input, REGIME_CI);
    const attendu =
      Number(result.totalEmployeeContributionUnits) + Number(result.totalEmployerContributionUnits);
    expect(creditOf(accounting, PLAN.social)).toBe(attendu);
  });

  it('447 = impôt sur salaires, exactement', () => {
    const { result, accounting } = computePayslip(input, REGIME_CI);
    expect(creditOf(accounting, PLAN.incomeTax)).toBe(Number(result.incomeTaxUnits));
  });

  it('le partage 431/447 n\'est pas un ratio : il varie avec le salaire', () => {
    // Une clé fixe (ex. 45/55) ne peut pas être juste sur deux salaires
    // différents — l'impôt est progressif, les cotisations proportionnelles.
    const part = (base: number) => {
      const { accounting } = computePayslip({ baseSalary: base }, REGIME_CI);
      const social = creditOf(accounting, PLAN.social);
      const tax = creditOf(accounting, PLAN.incomeTax);
      return tax / (social + tax);
    };
    expect(part(200_000)).not.toBeCloseTo(part(3_000_000), 2);
  });

  it('le net est imputé en 422 (dette envers le salarié), pas en 421', () => {
    const { result, accounting } = computePayslip(input, REGIME_CI);
    expect(PLAN.net).toBe('422000');
    expect(creditOf(accounting, '422000')).toBe(Number(result.netToPayUnits));
    // 421 ne porte QUE l'avance — pas le net.
    expect(creditOf(accounting, '421000')).toBe(AVANCE.amount);
  });

  it('661 = brut total, 664 = patronal, 637 = taxes patronales', () => {
    const { result, accounting } = computePayslip(input, REGIME_CI);
    expect(debitOf(accounting, PLAN.gross)).toBe(Number(result.grossTotalUnits));
    expect(debitOf(accounting, PLAN.employerSocial)).toBe(Number(result.totalEmployerContributionUnits));
    expect(debitOf(accounting, PLAN.employerTaxExpense)).toBe(Number(result.totalEmployerTaxUnits));
  });

  it('avec retenue, brut ≠ cotisations salariales + net (le piège de l\'OD naïve)', () => {
    const { result } = computePayslip(input, REGIME_CI);
    const brut = Number(result.grossTotalUnits);
    const cotisEmp = Number(result.totalEmployeeContributionUnits) + Number(result.incomeTaxUnits);
    const net = Number(result.netToPayUnits);
    // Une OD limitée à brut / cotisations / net serait fausse de la retenue.
    expect(brut - (cotisEmp + net)).toBe(AVANCE.amount);
  });
});

// ═══════════════════════════════════════════════════════════
// OD de campagne — consolidation
// ═══════════════════════════════════════════════════════════

describe('AccountingMapper.aggregate — OD de campagne', () => {
  const cycle: PayrollInput[] = [
    { baseSalary: 350_000 },
    { baseSalary: 900_000, taxableAllowances: 75_000, otherDeductions: [AVANCE] },
    { baseSalary: 180_000, nonTaxableAllowances: 25_000, otherDeductions: [OPPOSITION] },
  ];

  it('OD consolidée équilibrée', () => {
    const od = AccountingMapper.aggregate(cycle.map((i) => entryFor(i)), 'XOF');
    expect(od.balanced).toBe(true);
    expect(Number(od.totalDebitUnits)).toBe(Number(od.totalCreditUnits));
  });

  it('un compte n\'apparaît qu\'une fois et porte la somme de la campagne', () => {
    const entries = cycle.map((i) => entryFor(i));
    const od = AccountingMapper.aggregate(entries, 'XOF');

    const comptes = od.lines.map((l) => l.account);
    expect(new Set(comptes).size).toBe(comptes.length);

    expect(creditOf(od, PLAN.net)).toBe(
      entries.reduce((s, e) => s + creditOf(e, PLAN.net), 0),
    );
    expect(debitOf(od, PLAN.gross)).toBe(
      entries.reduce((s, e) => s + debitOf(e, PLAN.gross), 0),
    );
  });

  it('les retenues des différents salariés se cumulent sur leurs comptes', () => {
    const od = AccountingMapper.aggregate(cycle.map((i) => entryFor(i)), 'XOF');
    expect(creditOf(od, '421000')).toBe(AVANCE.amount);
    expect(creditOf(od, '427000')).toBe(OPPOSITION.amount);
  });

  it('la ligne consolidée ne nomme pas un salarié au hasard', () => {
    const entries = [
      computePayslip({ baseSalary: 350_000 }, REGIME_CI, 'Awa Koné').accounting,
      computePayslip({ baseSalary: 420_000 }, REGIME_CI, 'Kouadio N\'Guessan').accounting,
    ];
    // Écriture individuelle : le nom reste, il identifie le bulletin.
    expect(entries[0].lines.find((l) => l.account === PLAN.gross)!.label).toContain('Awa Koné');
    // OD consolidée : plus aucun nom.
    const od = AccountingMapper.aggregate(entries, 'XOF');
    const brut = od.lines.find((l) => l.account === PLAN.gross)!;
    // Libellé identique à celui produit par la RPC SQL (migration 0057).
    expect(brut.label).toBe('Rémunérations du personnel (brut)');
    expect(od.lines.some((l) => /Koné|Guessan/.test(l.label))).toBe(false);
  });

  it('un libellé identique sur toutes les sources est conservé tel quel', () => {
    const od = AccountingMapper.aggregate(cycle.map((i) => entryFor(i)), 'XOF');
    expect(od.lines.find((l) => l.account === PLAN.net)!.label)
      .toBe('Personnel — rémunérations dues (net)');
  });

  it('OD vide = écriture équilibrée à zéro (pas une erreur)', () => {
    const od = AccountingMapper.aggregate([], 'XOF');
    expect(od.lines).toHaveLength(0);
    expect(od.balanced).toBe(true);
    expect(od.totalDebitUnits).toBe('0');
  });

  it('refuse le mélange de devises (XOF + XAF)', () => {
    // Les écritures CI sont en XOF ; les consolider dans une OD XAF doit lever
    // plutôt que d'additionner des francs de deux zones monétaires distinctes.
    const entries = cycle.map((i) => entryFor(i));
    expect(entries.every((e) => e.currency === 'XOF')).toBe(true);
    expect(() => AccountingMapper.aggregate(entries, 'XAF')).toThrow(/devises/);
  });
});
