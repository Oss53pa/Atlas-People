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
  partBrute,
  repartitionBonus,
  scoreFraction,
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
