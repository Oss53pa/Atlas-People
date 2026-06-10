/**
 * Tests du moteur Bonus (M3 variable) — Money.ts bigint, zéro float (R5).
 * Vérifie la formule §6.1, les trois modes §6.2, bornes & reliquat §6.3.
 */
import { describe, it, expect } from 'vitest';
import { Money } from '../../../lib/money';
import {
  BonusInput,
  RemuFiche,
  bornes,
  evalFormule,
  partBrute,
  repartitionBonus,
  scoreFraction,
  simulateBonus,
} from '../index';

const XOF = 'XOF' as const;
const fiche = (over: Partial<RemuFiche> & { employeId: string }): RemuFiche => ({
  salaireMensuel: Money.of(1_000_000, XOF),
  formule: { base: 'SAL_MENS', coef: 1 },
  ...over,
});

const input = (employeId: string, scorePct: number, over: Partial<RemuFiche> = {}): BonusInput => ({
  fiche: fiche({ employeId, ...over }),
  scorePct,
});

describe('§6.1 partBrute', () => {
  it('SCORE × COEF × SAL_MENS', () => {
    // 80 % × 1.0 × 1 000 000 = 800 000
    expect(partBrute(input('e1', 80)).toInt()).toBe(800_000);
  });
  it('coef multiplicateur', () => {
    expect(partBrute(input('e1', 50, { formule: { base: 'SAL_MENS', coef: 2 } })).toInt()).toBe(1_000_000);
  });
  it('base SAL_ANN = 12 mois', () => {
    expect(partBrute(input('e1', 10, { formule: { base: 'SAL_ANN', coef: 1 } })).toInt()).toBe(1_200_000);
  });
  it('reste entier (zéro float)', () => {
    const v = partBrute(input('e1', 33, { formule: { base: 'SAL_MENS', coef: 1 } }));
    expect(Number.isInteger(v.toInt())).toBe(true);
  });
  it('scoreFraction normalise le pourcentage', () => {
    expect(scoreFraction(80)).toBeCloseTo(0.8, 10);
  });
});

describe('§6.3 bornes plafond/plancher', () => {
  it('plafond écrête à X % du salaire annuel', () => {
    // plafond 5 % de 12 000 000 = 600 000
    const r = bornes(Money.of(800_000, XOF), fiche({ employeId: 'e1', plafondBps: 500 }));
    expect(r.value.toInt()).toBe(600_000);
    expect(r.borne).toBe('plafond');
  });
  it('plancher relève au minimum', () => {
    const r = bornes(Money.of(50_000, XOF), fiche({ employeId: 'e1', plancherBps: 100 }));
    // plancher 1 % de 12 000 000 = 120 000
    expect(r.value.toInt()).toBe(120_000);
    expect(r.borne).toBe('plancher');
  });
  it('aucune borne → inchangé', () => {
    const r = bornes(Money.of(300_000, XOF), fiche({ employeId: 'e1' }));
    expect(r.value.toInt()).toBe(300_000);
    expect(r.borne).toBeUndefined();
  });
});

describe('§6.2 mode A — prorata d’enveloppe', () => {
  it('Σ bonus = enveloppe (exact, au franc près)', () => {
    const inputs = [input('e1', 90), input('e2', 60), input('e3', 30)];
    const r = repartitionBonus(inputs, { montant: Money.of(1_000_000, XOF), mode: 'A_prorata' }, XOF);
    expect(r.total.toInt()).toBe(1_000_000);
    expect(r.reliquat.toInt()).toBe(0);
  });
  it('répartit au prorata des parts', () => {
    // parts égales → bonus égaux
    const inputs = [input('e1', 50), input('e2', 50)];
    const r = repartitionBonus(inputs, { montant: Money.of(900_000, XOF), mode: 'A_prorata' }, XOF);
    const byId = Object.fromEntries(r.lignes.map((l) => [l.employeId, l.final.toInt()]));
    expect(byId.e1).toBe(450_000);
    expect(byId.e2).toBe(450_000);
  });
  it('reliquat d’arrondi reversé (Σ reste exact)', () => {
    // enveloppe non divisible : 1 000 000 / 3 parts égales
    const inputs = [input('e1', 50), input('e2', 50), input('e3', 50)];
    const r = repartitionBonus(inputs, { montant: Money.of(1_000_000, XOF), mode: 'A_prorata' }, XOF);
    expect(r.total.toInt()).toBe(1_000_000);
    // deux reçoivent 333 333 et un 333 334 (reliquat au plus fort reste)
    const vals = r.lignes.map((l) => l.final.toInt()).sort((a, b) => a - b);
    expect(vals).toEqual([333_333, 333_333, 333_334]);
  });
  it('enveloppe nulle de parts → tout zéro', () => {
    const inputs = [input('e1', 0), input('e2', 0)];
    const r = repartitionBonus(inputs, { montant: Money.of(500_000, XOF), mode: 'A_prorata' }, XOF);
    expect(r.lignes.every((l) => l.final.isZero())).toBe(true);
  });
});

describe('§6.2 mode B — formule plafonnée', () => {
  it('bonus = formule, alerte si Σ > enveloppe', () => {
    const inputs = [input('e1', 100), input('e2', 100)]; // 1 000 000 chacun
    const r = repartitionBonus(inputs, { montant: Money.of(1_500_000, XOF), mode: 'B_plafonnee' }, XOF);
    expect(r.total.toInt()).toBe(2_000_000);
    expect(r.depassement).toBe(true);
  });
  it('pas d’ajustement automatique (montants gardés)', () => {
    const inputs = [input('e1', 80)];
    const r = repartitionBonus(inputs, { montant: Money.of(100_000, XOF), mode: 'B_plafonnee' }, XOF);
    expect(r.lignes[0].final.toInt()).toBe(800_000);
    expect(r.depassement).toBe(true);
  });
});

describe('§6.2 mode C — formule libre', () => {
  it('bonus = formule, enveloppe prévisionnelle (reliquat = écart)', () => {
    const inputs = [input('e1', 70), input('e2', 50)];
    const r = repartitionBonus(inputs, { montant: Money.of(2_000_000, XOF), mode: 'C_libre' }, XOF);
    expect(r.lignes[0].final.toInt()).toBe(700_000);
    expect(r.lignes[1].final.toInt()).toBe(500_000);
    expect(r.total.toInt()).toBe(1_200_000);
    expect(r.depassement).toBe(false);
  });
});

describe('intégration : plafond appliqué en mode A', () => {
  it('un plafond individuel réduit le final et crée un écart à l’enveloppe', () => {
    const inputs = [
      input('e1', 100, { plafondBps: 100 }), // plafond 1 % SAL_ANN = 120 000
      input('e2', 100),
    ];
    const r = repartitionBonus(inputs, { montant: Money.of(1_000_000, XOF), mode: 'A_prorata' }, XOF);
    const byId = Object.fromEntries(r.lignes.map((l) => [l.employeId, l]));
    expect(byId.e1.final.toInt()).toBe(120_000);
    expect(byId.e1.borne).toBe('plafond');
    // le reliquat (enveloppe − total après écrêtage) est exposé pour arbitrage
    expect(r.reliquat.toInt()).toBe(1_000_000 - r.total.toInt());
  });
});

describe('§4 DSL contrôlé (R2, jamais eval)', () => {
  const vars = { SCORE: 0.8, COEF: 1, SAL_MENS: Money.of(1_000_000, XOF), SAL_ANN: Money.of(12_000_000, XOF) };

  it('évalue SCORE × COEF × SAL_MENS', () => {
    expect(evalFormule('SCORE × COEF × SAL_MENS', vars, XOF).toInt()).toBe(800_000);
  });
  it('respecte parenthèses et + −', () => {
    expect(evalFormule('(SCORE + 0.2) × SAL_MENS', vars, XOF).toInt()).toBe(1_000_000);
  });
  it('division exacte SAL_ANN ÷ 12', () => {
    expect(evalFormule('SAL_ANN ÷ 12', vars, XOF).toInt()).toBe(1_000_000);
  });
  it('arithmétique rationnelle exacte (zéro float) : ÷3 ×3 = identité', () => {
    expect(evalFormule('SAL_MENS ÷ 3 × 3', vars, XOF).toInt()).toBe(1_000_000);
  });
  it('précédence × avant +', () => {
    // 0.8×1000000 + 1000000 = 1800000  (et non (0.8+1)×1000000)
    expect(evalFormule('SCORE × SAL_MENS + SAL_MENS', vars, XOF).toInt()).toBe(1_800_000);
  });
  it('rejette un identifiant hors liste blanche', () => {
    expect(() => evalFormule('FOO × 2', vars, XOF)).toThrow();
  });
  it('rejette un caractère interdit', () => {
    expect(() => evalFormule('SCORE ^ 2', vars, XOF)).toThrow();
  });
  it('partBrute utilise le DSL quand fourni', () => {
    const r = partBrute({ fiche: fiche({ employeId: 'e1', formuleDsl: 'SCORE × SAL_MENS' }), scorePct: 50 });
    expect(r.toInt()).toBe(500_000);
  });
});

describe('§6.3 mode A — réconciliation itérative des plafonds', () => {
  it('cap d’un employé → budget redistribué, Σ = enveloppe', () => {
    const inputs = [
      input('e1', 100, { plafond: Money.of(120_000, XOF) }), // capé
      input('e2', 100),
      input('e3', 100),
    ];
    const r = repartitionBonus(inputs, { montant: Money.of(900_000, XOF), mode: 'A_prorata' }, XOF);
    const byId = Object.fromEntries(r.lignes.map((l) => [l.employeId, l]));
    expect(byId.e1.final.toInt()).toBe(120_000);
    expect(byId.e1.borne).toBe('plafond');
    // 780 000 répartis également entre e2 et e3
    expect(byId.e2.final.toInt()).toBe(390_000);
    expect(byId.e3.final.toInt()).toBe(390_000);
    expect(r.total.toInt()).toBe(900_000);
    expect(r.reliquat.toInt()).toBe(0);
  });

  it('plancher d’un employé → relevé, budget réduit pour les autres', () => {
    const inputs = [
      input('e1', 10, { plancher: Money.of(300_000, XOF) }), // brut faible, relevé au plancher
      input('e2', 100),
    ];
    const r = repartitionBonus(inputs, { montant: Money.of(1_000_000, XOF), mode: 'A_prorata' }, XOF);
    const byId = Object.fromEntries(r.lignes.map((l) => [l.employeId, l]));
    expect(byId.e1.final.toInt()).toBe(300_000);
    expect(byId.e1.borne).toBe('plancher');
    expect(byId.e2.final.toInt()).toBe(700_000);
    expect(r.total.toInt()).toBe(1_000_000);
  });

  it('tous capés sous l’enveloppe → reliquat exposé', () => {
    const inputs = [
      input('e1', 100, { plafond: Money.of(100_000, XOF) }),
      input('e2', 100, { plafond: Money.of(100_000, XOF) }),
    ];
    const r = repartitionBonus(inputs, { montant: Money.of(1_000_000, XOF), mode: 'A_prorata' }, XOF);
    expect(r.total.toInt()).toBe(200_000);
    expect(r.reliquat.toInt()).toBe(800_000);
  });
});

describe('§8 simulateBonus', () => {
  it('équivaut à repartitionBonus (pur, sans persistance)', () => {
    const inputs = [input('e1', 80), input('e2', 60)];
    const env = { montant: Money.of(500_000, XOF), mode: 'A_prorata' as const };
    expect(simulateBonus(inputs, env, XOF).total.toInt()).toBe(repartitionBonus(inputs, env, XOF).total.toInt());
  });
});
