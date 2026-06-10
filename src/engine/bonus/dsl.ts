/**
 * Moteur Bonus — DSL de formule CONTRÔLÉ (M3 §4, règle dure R2).
 *
 * Évalue une formule de bonus en **liste blanche stricte** :
 *   variables : SCORE, COEF, SAL_MENS, SAL_ANN
 *   opérateurs : + − × * ÷ /  et parenthèses
 * Aucune fonction, aucun `eval`, aucun identifiant hors liste. Toute la chaîne
 * de calcul est exacte (rationnels BigInt) — zéro flottant — et n'est arrondie
 * au franc FCFA qu'à la toute fin (Money.ts bigint, R5).
 */

import { Currency, Money } from '../../lib/money';

/* ── Rationnels exacts sur BigInt ─────────────────────────────────────────── */

interface Rational {
  n: bigint;
  d: bigint;
}

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1n;
}

function rat(n: bigint, d: bigint = 1n): Rational {
  if (d === 0n) throw new Error('DSL: division par zéro');
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

const rAdd = (a: Rational, b: Rational): Rational => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const rSub = (a: Rational, b: Rational): Rational => rat(a.n * b.d - b.n * a.d, a.d * b.d);
const rMul = (a: Rational, b: Rational): Rational => rat(a.n * b.n, a.d * b.d);
const rDiv = (a: Rational, b: Rational): Rational => {
  if (b.n === 0n) throw new Error('DSL: division par zéro');
  return rat(a.n * b.d, a.d * b.n);
};

/** Décimale "0.85" / "12" → rationnel exact. */
function ratFromDecimal(s: string): Rational {
  const [intPart, fracPart = ''] = s.split('.');
  const scale = 10n ** BigInt(fracPart.length);
  return rat(BigInt(intPart + fracPart), scale);
}

/** Arrondi half-up d'un rationnel vers l'entier (franc). */
function roundRationalToBigInt(r: Rational): bigint {
  const neg = r.n < 0n;
  const n = neg ? -r.n : r.n;
  const q = (n * 2n + r.d) / (r.d * 2n); // half-up
  return neg ? -q : q;
}

/* ── Variables autorisées ─────────────────────────────────────────────────── */

export interface FormuleVars {
  /** Fraction normalisée du score validé (pct / 100). */
  SCORE: number;
  COEF: number;
  SAL_MENS: Money;
  SAL_ANN: Money;
}

const VARS = new Set(['SCORE', 'COEF', 'SAL_MENS', 'SAL_ANN']);

function numberToRational(x: number): Rational {
  if (!Number.isFinite(x)) throw new Error('DSL: valeur non finie');
  return ratFromDecimal(x.toString().includes('e') ? x.toFixed(12) : x.toString());
}

/* ── Tokenizer (liste blanche) ────────────────────────────────────────────── */

type Token =
  | { t: 'num'; v: Rational }
  | { t: 'var'; v: string }
  | { t: 'op'; v: '+' | '-' | '*' | '/' }
  | { t: 'lp' }
  | { t: 'rp' };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n') {
      i += 1;
      continue;
    }
    if (c === '(') { tokens.push({ t: 'lp' }); i += 1; continue; }
    if (c === ')') { tokens.push({ t: 'rp' }); i += 1; continue; }
    if (c === '+' || c === '-') { tokens.push({ t: 'op', v: c }); i += 1; continue; }
    if (c === '*' || c === '×') { tokens.push({ t: 'op', v: '*' }); i += 1; continue; }
    if (c === '/' || c === '÷') { tokens.push({ t: 'op', v: '/' }); i += 1; continue; }
    if (c >= '0' && c <= '9') {
      let j = i + 1;
      while (j < src.length && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) j += 1;
      tokens.push({ t: 'num', v: ratFromDecimal(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z_]/.test(src[j])) j += 1;
      const name = src.slice(i, j);
      if (!VARS.has(name)) throw new Error(`DSL: identifiant non autorisé « ${name} »`);
      tokens.push({ t: 'var', v: name });
      i = j;
      continue;
    }
    throw new Error(`DSL: caractère non autorisé « ${c} »`);
  }
  return tokens;
}

/* ── Shunting-yard → RPN → évaluation ─────────────────────────────────────── */

const PREC: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

function toRpn(tokens: Token[]): Token[] {
  const out: Token[] = [];
  const stack: Token[] = [];
  for (const tok of tokens) {
    if (tok.t === 'num' || tok.t === 'var') out.push(tok);
    else if (tok.t === 'op') {
      while (
        stack.length &&
        stack[stack.length - 1].t === 'op' &&
        PREC[(stack[stack.length - 1] as { v: string }).v] >= PREC[tok.v]
      ) {
        out.push(stack.pop()!);
      }
      stack.push(tok);
    } else if (tok.t === 'lp') stack.push(tok);
    else if (tok.t === 'rp') {
      while (stack.length && stack[stack.length - 1].t !== 'lp') out.push(stack.pop()!);
      if (!stack.length) throw new Error('DSL: parenthèses déséquilibrées');
      stack.pop();
    }
  }
  while (stack.length) {
    const top = stack.pop()!;
    if (top.t === 'lp') throw new Error('DSL: parenthèses déséquilibrées');
    out.push(top);
  }
  return out;
}

function bindVar(name: string, vars: FormuleVars): Rational {
  switch (name) {
    case 'SCORE': return numberToRational(vars.SCORE);
    case 'COEF': return numberToRational(vars.COEF);
    case 'SAL_MENS': return rat(vars.SAL_MENS.units);
    case 'SAL_ANN': return rat(vars.SAL_ANN.units);
    default: throw new Error(`DSL: variable inconnue ${name}`);
  }
}

/**
 * Évalue une formule DSL et renvoie un montant Money arrondi au franc.
 * `currency` fixe la devise du résultat (cohérente avec SAL_MENS/SAL_ANN).
 */
export function evalFormule(dsl: string, vars: FormuleVars, currency: Currency): Money {
  const rpn = toRpn(tokenize(dsl));
  const st: Rational[] = [];
  for (const tok of rpn) {
    if (tok.t === 'num') st.push(tok.v);
    else if (tok.t === 'var') st.push(bindVar(tok.v, vars));
    else if (tok.t === 'op') {
      const b = st.pop();
      const a = st.pop();
      if (!a || !b) throw new Error('DSL: expression invalide');
      st.push(tok.v === '+' ? rAdd(a, b) : tok.v === '-' ? rSub(a, b) : tok.v === '*' ? rMul(a, b) : rDiv(a, b));
    }
  }
  if (st.length !== 1) throw new Error('DSL: expression invalide');
  return Money.of(roundRationalToBigInt(st[0]), currency);
}
