/**
 * Money.ts — Arithmétique monétaire entière pour Atlas People.
 *
 * RÈGLE DURE (cahier des charges §2.3) : zéro float, jamais.
 * Tout montant est stocké en `bigint` représentant des FRANCS ENTIERS.
 * Le FCFA (XOF comme XAF) ne possède pas de sous-unité dans la pratique de paie :
 * le franc est l'unité atomique. Aucune opération ne produit de décimale.
 *
 * XOF (UEMOA) et XAF (CEMAC) sont DEUX devises distinctes et NON interchangeables.
 * Toute opération entre devises différentes lève une erreur.
 */

export type Currency = 'XOF' | 'XAF';

const CURRENCY_LABEL: Record<Currency, string> = {
  XOF: 'FCFA',
  XAF: 'FCFA',
};

/** Division entière avec arrondi au franc le plus proche (half-up). */
function divRoundHalfUp(num: bigint, den: bigint): bigint {
  if (den === 0n) throw new Error('Money: division par zéro');
  const negative = num < 0n !== den < 0n;
  const a = num < 0n ? -num : num;
  const d = den < 0n ? -den : den;
  const q = (a * 2n + d) / (d * 2n); // arrondi half-up sans float
  return negative ? -q : q;
}

export class Money {
  private constructor(
    public readonly units: bigint,
    public readonly currency: Currency,
  ) {}

  // ---- Constructeurs ----

  static zero(currency: Currency): Money {
    return new Money(0n, currency);
  }

  /** Crée un montant à partir d'un nombre ENTIER de francs. */
  static of(francs: number | bigint, currency: Currency): Money {
    if (typeof francs === 'number') {
      if (!Number.isInteger(francs)) {
        throw new Error(`Money.of: ${francs} n'est pas un entier (zéro float exigé)`);
      }
      return new Money(BigInt(francs), currency);
    }
    return new Money(francs, currency);
  }

  // ---- Garde-fous ----

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Money: mélange de devises interdit (${this.currency} vs ${other.currency})`,
      );
    }
  }

  // ---- Opérations ----

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.units + other.units, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.units - other.units, this.currency);
  }

  /** Multiplie par un taux exprimé en points de base (1 % = 100 bps). */
  applyRateBps(bps: number): Money {
    if (!Number.isInteger(bps)) throw new Error('applyRateBps: bps doit être entier');
    return new Money(divRoundHalfUp(this.units * BigInt(bps), 10_000n), this.currency);
  }

  multiplyInt(n: number): Money {
    if (!Number.isInteger(n)) throw new Error('multiplyInt: n doit être entier');
    return new Money(this.units * BigInt(n), this.currency);
  }

  /** Division par un entier (ex : quotient familial), arrondi au franc. */
  divideInt(n: number): Money {
    if (!Number.isInteger(n) || n === 0) throw new Error('divideInt: diviseur entier non nul requis');
    return new Money(divRoundHalfUp(this.units, BigInt(n)), this.currency);
  }

  negate(): Money {
    return new Money(-this.units, this.currency);
  }

  /** Renvoie le montant borné à zéro (jamais négatif). */
  clampPositive(): Money {
    return this.units < 0n ? Money.zero(this.currency) : this;
  }

  // ---- Comparaisons ----

  isZero(): boolean {
    return this.units === 0n;
  }
  isNegative(): boolean {
    return this.units < 0n;
  }
  gte(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.units >= other.units;
  }
  lte(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.units <= other.units;
  }
  gt(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.units > other.units;
  }
  equals(other: Money): boolean {
    return this.currency === other.currency && this.units === other.units;
  }

  static min(a: Money, b: Money): Money {
    a.assertSameCurrency(b);
    return a.units <= b.units ? a : b;
  }
  static max(a: Money, b: Money): Money {
    a.assertSameCurrency(b);
    return a.units >= b.units ? a : b;
  }
  static sum(items: Money[], currency: Currency): Money {
    return items.reduce((acc, m) => acc.add(m), Money.zero(currency));
  }

  // ---- Sérialisation / affichage ----

  toInt(): number {
    return Number(this.units);
  }

  /** Format français avec espace fine insécable comme séparateur de milliers. */
  format(): string {
    const negative = this.units < 0n;
    const digits = (negative ? -this.units : this.units).toString();
    const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${negative ? '-' : ''}${grouped}`;
  }

  /** Format complet avec libellé de devise (FCFA). */
  formatWithCurrency(): string {
    return `${this.format()} ${CURRENCY_LABEL[this.currency]}`;
  }

  toJSON(): { units: string; currency: Currency } {
    return { units: this.units.toString(), currency: this.currency };
  }

  static fromJSON(json: { units: string; currency: Currency }): Money {
    return new Money(BigInt(json.units), json.currency);
  }
}
