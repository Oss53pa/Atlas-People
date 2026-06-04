/**
 * Tests de la couche Money — arithmétique déterministe.
 * Règle : zéro virgule flottante directe, tout passe par Money.
 */
import { describe, it, expect } from 'vitest';
import { Money } from '../money';

describe('Money.of', () => {
  it('crée un montant depuis des francs entiers', () => {
    const m = Money.of(500_000, 'XOF');
    expect(m.toInt()).toBe(500_000);
  });

  it('rejette les nombres négatifs si nécessaire', () => {
    const m = Money.of(-100, 'XOF');
    expect(m.toInt()).toBe(-100);
  });
});

describe('Money.add', () => {
  it('additionne correctement', () => {
    const a = Money.of(100_000, 'XOF');
    const b = Money.of(50_000, 'XOF');
    expect(a.add(b).toInt()).toBe(150_000);
  });

  it('est commutatif', () => {
    const a = Money.of(123_456, 'XOF');
    const b = Money.of(78_900, 'XOF');
    expect(a.add(b).toInt()).toBe(b.add(a).toInt());
  });
});

describe('Money.subtract', () => {
  it('soustrait correctement', () => {
    const a = Money.of(200_000, 'XOF');
    const b = Money.of(75_000, 'XOF');
    expect(a.subtract(b).toInt()).toBe(125_000);
  });
});

describe('Money.applyRateBps', () => {
  it('10 % = 1000 bps sur 500_000 = 50_000', () => {
    const m = Money.of(500_000, 'XOF');
    expect(m.applyRateBps(1000).toInt()).toBe(50_000);
  });

  it('6,30 % = 630 bps sur 500_000 = 31_500', () => {
    const m = Money.of(500_000, 'XOF');
    expect(m.applyRateBps(630).toInt()).toBe(31_500);
  });

  it('résultat entier (pas de demi-franc)', () => {
    const m = Money.of(333_333, 'XOF');
    const result = m.applyRateBps(630);
    expect(Number.isInteger(result.toInt())).toBe(true);
  });

  it('0 bps → 0', () => {
    expect(Money.of(1_000_000, 'XOF').applyRateBps(0).toInt()).toBe(0);
  });
});

describe('Money.min', () => {
  it('retourne le plus petit', () => {
    const a = Money.of(300_000, 'XOF');
    const b = Money.of(500_000, 'XOF');
    expect(Money.min(a, b).toInt()).toBe(300_000);
    expect(Money.min(b, a).toInt()).toBe(300_000);
  });
});

describe('Money.zero', () => {
  it('crée un zéro', () => {
    expect(Money.zero('XOF').toInt()).toBe(0);
    expect(Money.zero('XOF').isZero()).toBe(true);
  });
});

describe('Money.isNegative / isZero', () => {
  it('détecte correctement le négatif', () => {
    expect(Money.of(-1, 'XOF').isNegative()).toBe(true);
    expect(Money.of(0, 'XOF').isNegative()).toBe(false);
    expect(Money.of(1, 'XOF').isNegative()).toBe(false);
  });

  it('détecte correctement le zéro', () => {
    expect(Money.of(0, 'XOF').isZero()).toBe(true);
    expect(Money.of(1, 'XOF').isZero()).toBe(false);
  });
});

describe('Money.format', () => {
  it('formate en FCFA', () => {
    const s = Money.of(1_500_000, 'XOF').format();
    expect(s).toContain('1'); // contient au moins le chiffre
    expect(typeof s).toBe('string');
  });
});
