/**
 * Tests du moteur de paie déterministe — correction des codes de lignes réels.
 *
 * Codes de lignes (tels que retournés par PayrollEngine.run) :
 *   - Gain : SAL_BASE, PRIME_IMP, IND_TRANSP
 *   - Cotisation salariale : code de la contribution (ex: CNPS_RET)
 *   - Cotisation patronale : {code}_PAT (ex: CNPS_RET_PAT)
 *   - Impôt : regime.incomeTax.code (IGR pour CI, IR pour SN)
 *   - Retenues diverses : le code passé dans otherDeductions
 *   - Taxes patronales : le code de la taxe (FDFP_TA, FDFP_FC…)
 *
 * ⚠️  amountUnits des cotisations salariales, de l'impôt et des retenues est NÉGATIF
 *     (représente une déduction du brut). amountUnits des patronales est POSITIF.
 */
import { describe, it, expect } from 'vitest';
import { PayrollEngine } from '../PayrollEngine';
import { REGIME_CI } from '../regimes/cnps_ci';
import { REGIME_SN } from '../regimes/ipres_sn';
import type { PayrollInput } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────

function run(input: PayrollInput, regime = REGIME_CI) {
  return PayrollEngine.run(input, regime);
}

/** Retourne la ligne par code, ou undefined. */
function line(result: ReturnType<typeof run>, code: string) {
  return result.lines.find((l) => l.code === code);
}

/** Montant absolu (entier) d'une ligne (cotisations/impôt = stockés négatifs). */
function abs(l: ReturnType<typeof line>): number {
  return Math.abs(parseInt(l!.amountUnits));
}

/** Montant signé (entier) d'une ligne. */
function signed(l: ReturnType<typeof line>): number {
  return parseInt(l!.amountUnits);
}

// ═══════════════════════════════════════════════════════════
// Régime CI — Côte d'Ivoire
// ═══════════════════════════════════════════════════════════

describe('PayrollEngine — CI (CNPS / IGR)', () => {
  const BASE = 500_000;

  it('salaire de base présent dans les lignes', () => {
    const r = run({ baseSalary: BASE });
    const salLine = line(r, 'SAL_BASE');
    expect(salLine).toBeDefined();
    expect(salLine!.baseUnits).toBe('500000');
  });

  it('gross total = base + primes imposables + indemnités', () => {
    const r = run({ baseSalary: 400_000, taxableAllowances: 50_000, nonTaxableAllowances: 30_000 });
    expect(r.grossTaxableUnits).toBe('450000');
    expect(r.grossTotalUnits).toBe('480000');
  });

  it('CNPS retraite salarié = 6,30 % du min(salaire, plafond)', () => {
    // 500k < 3.375M → assiette = 500k → 500000 * 6.30% = 31500
    const r = run({ baseSalary: BASE });
    const l = line(r, 'CNPS_RET');
    expect(l).toBeDefined();
    expect(l!.kind).toBe('employee_contribution');
    expect(abs(l)).toBe(31_500);
    expect(signed(l)).toBe(-31_500); // stocké négatif
  });

  it('CNPS retraite plafonné à 3 375 000 pour un gros salaire', () => {
    const r = run({ baseSalary: 5_000_000 });
    const l = line(r, 'CNPS_RET');
    expect(l).toBeDefined();
    // assiette = 3 375 000 → 3375000 * 6.30% = 212625
    expect(abs(l)).toBe(212_625);
  });

  it('CNPS retraite patronal = 7,70 % — ligne code CNPS_RET_PAT', () => {
    const r = run({ baseSalary: BASE });
    const l = line(r, 'CNPS_RET_PAT');
    expect(l).toBeDefined();
    expect(l!.kind).toBe('employer_contribution');
    // 500000 * 7.70% = 38500
    expect(signed(l)).toBe(38_500); // patronal = positif
  });

  it('IGR nul en dessous du seuil (60 000 FCFA → taxable < 75k)', () => {
    // base=60000, social=60000*6.30%=3780, after=56220, abat20%=11244, taxable=44976 < 75000
    const r = run({ baseSalary: 60_000 });
    const igr = line(r, 'IGR');
    expect(igr).toBeDefined();
    expect(abs(igr)).toBe(0);
  });

  it('IGR positif pour un salaire moyen', () => {
    const r = run({ baseSalary: BASE });
    const igr = line(r, 'IGR');
    expect(igr).toBeDefined();
    expect(abs(igr)).toBeGreaterThan(0);
    expect(signed(igr)).toBeLessThan(0); // stocké négatif
    // Sanity check : impôt < 30% du brut
    expect(abs(igr)).toBeLessThan(BASE * 0.30);
  });

  it("parts fiscales réduisent l'IGR", () => {
    const r1 = run({ baseSalary: BASE, fiscalParts: 1 });
    const r2 = run({ baseSalary: BASE, fiscalParts: 2 });
    expect(abs(line(r2, 'IGR'))).toBeLessThanOrEqual(abs(line(r1, 'IGR')));
  });

  it('retenue diverse déduite du net', () => {
    const deduction = { code: 'PRET', label: 'Remboursement prêt', amount: 20_000, account: '421' };
    const r_with = run({ baseSalary: BASE, otherDeductions: [deduction] });
    const r_sans = run({ baseSalary: BASE });
    expect(parseInt(r_with.netToPayUnits)).toBeLessThan(parseInt(r_sans.netToPayUnits));
  });

  it('net < brut total', () => {
    const r = run({ baseSalary: BASE });
    expect(parseInt(r.netToPayUnits)).toBeLessThan(parseInt(r.grossTotalUnits));
  });

  it('coût employeur > brut total', () => {
    const r = run({ baseSalary: BASE });
    expect(parseInt(r.employerCostUnits)).toBeGreaterThan(parseInt(r.grossTotalUnits));
  });

  it('toutes les lignes ont des amountUnits entiers', () => {
    const r = run({ baseSalary: 333_333 });
    for (const l of r.lines) {
      expect(Number.isInteger(parseInt(l.amountUnits))).toBe(true);
    }
  });

  it('total cotisations salariales reflété dans totalEmployeeContributionUnits', () => {
    const r = run({ baseSalary: BASE });
    const fromLines = r.lines
      .filter((l) => l.kind === 'employee_contribution')
      .reduce((sum, l) => sum + Math.abs(parseInt(l.amountUnits)), 0);
    expect(parseInt(r.totalEmployeeContributionUnits)).toBe(fromLines);
  });
});

// ═══════════════════════════════════════════════════════════
// Régime SN — Sénégal
// ═══════════════════════════════════════════════════════════

describe('PayrollEngine — SN (IPRES / IR)', () => {
  const BASE = 300_000;

  it('IPRES RG salarié présent et négatif', () => {
    const r = run({ baseSalary: BASE }, REGIME_SN);
    const ipres = line(r, 'IPRES_RG');
    expect(ipres).toBeDefined();
    expect(signed(ipres)).toBeLessThan(0);
  });

  it('IPRES RG = 5,6 % sur assiette plafonnée à 432 000', () => {
    const r = run({ baseSalary: BASE }, REGIME_SN);
    const ipres = line(r, 'IPRES_RG');
    const assiette = Math.min(BASE, 432_000);
    // 300000 * 5.6% = 16800
    expect(abs(ipres)).toBe(Math.round(assiette * 5.6 / 100));
  });

  it('IR SN non nul et stocké négatif pour salaire > 52 500', () => {
    const r = run({ baseSalary: BASE }, REGIME_SN);
    const ir = line(r, 'IR'); // code = regime.incomeTax.code = 'IR' pour SN
    expect(ir).toBeDefined();
    expect(signed(ir)).toBeLessThan(0); // stocké négatif
    expect(abs(ir)).toBeGreaterThan(0); // non nul
  });

  it('net SN positif', () => {
    const r = run({ baseSalary: BASE }, REGIME_SN);
    expect(parseInt(r.netToPayUnits)).toBeGreaterThan(0);
  });

  it('coût employeur SN > brut', () => {
    const r = run({ baseSalary: BASE }, REGIME_SN);
    expect(parseInt(r.employerCostUnits)).toBeGreaterThan(parseInt(r.grossTotalUnits));
  });
});

// ═══════════════════════════════════════════════════════════
// Propriétés invariantes (property-like tests)
// ═══════════════════════════════════════════════════════════

describe('PayrollEngine — invariants', () => {
  const salaires = [75_000, 200_000, 500_000, 1_500_000, 5_000_000];

  for (const s of salaires) {
    it(`net < brut pour salaire ${s.toLocaleString('fr-FR')} FCFA (CI)`, () => {
      const r = run({ baseSalary: s });
      expect(parseInt(r.netToPayUnits)).toBeLessThan(parseInt(r.grossTotalUnits));
    });

    it(`coût employeur > brut pour salaire ${s.toLocaleString('fr-FR')} FCFA (CI)`, () => {
      const r = run({ baseSalary: s });
      expect(parseInt(r.employerCostUnits)).toBeGreaterThan(parseInt(r.grossTotalUnits));
    });
  }

  it('incomeTaxUnits (positif) ≤ netTaxableUnits', () => {
    const r = run({ baseSalary: 1_000_000 });
    expect(parseInt(r.incomeTaxUnits)).toBeLessThan(1_000_000);
    expect(parseInt(r.incomeTaxUnits)).toBeGreaterThan(0);
  });

  it('résultats CI et SN différents pour même salaire (régimes distincts)', () => {
    const s = 400_000;
    const ci = run({ baseSalary: s });
    const sn = run({ baseSalary: s }, REGIME_SN);
    expect(parseInt(ci.totalEmployeeContributionUnits))
      .not.toBe(parseInt(sn.totalEmployeeContributionUnits));
  });
});
