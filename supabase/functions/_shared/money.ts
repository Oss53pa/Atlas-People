// Port Deno fidèle de src/lib/money.ts — arithmétique entière (bigint), zéro float.
// Doit rester strictement identique au front pour que les calculs serveur et
// l'affichage produisent les mêmes montants (et donc le même hash d'audit).
export type Currency = 'XOF' | 'XAF';

function divRoundHalfUp(num: bigint, den: bigint): bigint {
  if (den === 0n) throw new Error('Money: division par zéro');
  const negative = (num < 0n) !== (den < 0n);
  const a = num < 0n ? -num : num;
  const d = den < 0n ? -den : den;
  const q = (a * 2n + d) / (d * 2n);
  return negative ? -q : q;
}

export class Money {
  private constructor(readonly units: bigint, readonly currency: Currency) {}

  static zero(currency: Currency): Money { return new Money(0n, currency); }

  static of(francs: number | bigint, currency: Currency): Money {
    if (typeof francs === 'number') {
      if (!Number.isInteger(francs)) throw new Error(`Money.of: ${francs} n'est pas un entier`);
      return new Money(BigInt(francs), currency);
    }
    return new Money(francs, currency);
  }

  private same(o: Money): void {
    if (this.currency !== o.currency) throw new Error(`Money: mélange de devises (${this.currency} vs ${o.currency})`);
  }

  add(o: Money): Money { this.same(o); return new Money(this.units + o.units, this.currency); }
  subtract(o: Money): Money { this.same(o); return new Money(this.units - o.units, this.currency); }
  applyRateBps(bps: number): Money {
    if (!Number.isInteger(bps)) throw new Error('applyRateBps: bps entier requis');
    return new Money(divRoundHalfUp(this.units * BigInt(bps), 10_000n), this.currency);
  }
  multiplyInt(n: number): Money {
    if (!Number.isInteger(n)) throw new Error('multiplyInt: entier requis');
    return new Money(this.units * BigInt(n), this.currency);
  }
  divideInt(n: number): Money {
    if (!Number.isInteger(n) || n === 0) throw new Error('divideInt: diviseur entier non nul');
    return new Money(divRoundHalfUp(this.units, BigInt(n)), this.currency);
  }
  negate(): Money { return new Money(-this.units, this.currency); }
  clampPositive(): Money { return this.units < 0n ? Money.zero(this.currency) : this; }

  isZero(): boolean { return this.units === 0n; }
  isNegative(): boolean { return this.units < 0n; }
  lte(o: Money): boolean { this.same(o); return this.units <= o.units; }

  static min(a: Money, b: Money): Money { a.same(b); return a.units <= b.units ? a : b; }

  toInt(): number { return Number(this.units); }
  toJSON(): { units: string; currency: Currency } { return { units: this.units.toString(), currency: this.currency }; }
}
