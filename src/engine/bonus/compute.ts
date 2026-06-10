/**
 * Moteur Bonus (M3, variable) — calcul déterministe en Money.ts bigint (R5).
 *
 * Note de cadrage core §6 : formule paramétrable, trois modes d'articulation à
 * l'enveloppe (A prorata exact / B plafonnée / C libre), plancher/plafond,
 * arrondi au franc, reliquat lissé. Aucune décimale ne survit (FCFA entier).
 */

import { Currency, Money } from '../../lib/money';
import { evalFormule } from './dsl';
import {
  BonusInput,
  BonusResult,
  Enveloppe,
  RemuFiche,
  RepartitionResult,
} from './types';

/** Plafond absolu effectif (Money) : absolu prioritaire, sinon bps de SAL_ANN. */
function plafondMoney(fiche: RemuFiche): Money | undefined {
  if (fiche.plafond) return fiche.plafond;
  if (fiche.plafondBps != null) return fiche.salaireMensuel.multiplyInt(12).applyRateBps(fiche.plafondBps);
  return undefined;
}
function plancherMoney(fiche: RemuFiche): Money | undefined {
  if (fiche.plancher) return fiche.plancher;
  if (fiche.plancherBps != null) return fiche.salaireMensuel.multiplyInt(12).applyRateBps(fiche.plancherBps);
  return undefined;
}

/** SCORE normalisé : pourcentage validé → fraction (0–1.2…). */
export function scoreFraction(scorePct: number): number {
  return Math.max(0, scorePct) / 100;
}

/**
 * §6.1 — part brute d'un employé : `SCORE × COEF × base`.
 * Le produit `SCORE × COEF` est converti en points de base (entier) pour rester
 * dans la discipline Money (zéro float dans l'arithmétique monétaire).
 */
export function partBrute(input: BonusInput): Money {
  const { fiche, scorePct } = input;
  const currency = fiche.salaireMensuel.currency;
  // DSL contrôlé prioritaire (R2) ; sinon formule structurée SCORE×COEF×base.
  if (fiche.formuleDsl) {
    return evalFormule(fiche.formuleDsl, {
      SCORE: scoreFraction(scorePct),
      COEF: fiche.formule.coef,
      SAL_MENS: fiche.salaireMensuel,
      SAL_ANN: fiche.salaireMensuel.multiplyInt(12),
    }, currency);
  }
  const base =
    fiche.formule.base === 'SAL_ANN' ? fiche.salaireMensuel.multiplyInt(12) : fiche.salaireMensuel;
  const rate = scoreFraction(scorePct) * fiche.formule.coef;
  const bps = Math.round(rate * 10_000); // 1 % = 100 bps
  return base.applyRateBps(bps);
}

/** Applique plafond/plancher (absolu prioritaire, sinon bps de SAL_ANN) — §6.3. */
export function bornes(
  montant: Money,
  fiche: RemuFiche,
): { value: Money; borne?: 'plafond' | 'plancher' } {
  let value = montant;
  let borne: 'plafond' | 'plancher' | undefined;
  const cap = plafondMoney(fiche);
  const floor = plancherMoney(fiche);
  if (cap && value.gt(cap)) {
    value = cap;
    borne = 'plafond';
  }
  if (floor && floor.gt(value)) {
    value = floor;
    borne = 'plancher';
  }
  return { value, borne };
}

interface ProrataItem {
  id: string;
  part: Money;
  plafond?: Money;
  plancher?: Money;
}

/**
 * §6.2/§6.3 mode A — prorata d'enveloppe AVEC réconciliation itérative des
 * plafonds/planchers : répartit `enveloppe × part_i / Σ part`, fige les capés,
 * puis **redistribue le budget restant au prorata sur le pool non capé,
 * itérativement jusqu'à stabilité**. Le solde d'arrondi est lissé au franc sur
 * les plus fortes parts non capées. Σ = enveloppe (exact) si les caps le
 * permettent ; sinon `reliquat` expose l'écart pour arbitrage RH.
 */
function repartProrataCaps(enveloppe: Money, items: ProrataItem[], currency: Currency): {
  lignes: { id: string; montant: Money; borne?: 'plafond' | 'plancher' }[];
  reliquat: Money;
} {
  const env = enveloppe.units;
  const fixed = new Map<string, { val: bigint; borne: 'plafond' | 'plancher' }>();
  let remaining = [...items];

  // 1) itère jusqu'à stabilité des caps
  for (let guard = 0; guard <= items.length; guard += 1) {
    const poolParts = remaining.reduce((s, it) => s + it.part.units, 0n);
    const budget = env - [...fixed.values()].reduce((s, f) => s + f.val, 0n);
    if (remaining.length === 0 || poolParts <= 0n) break;

    const newlyFixed: { id: string; val: bigint; borne: 'plafond' | 'plancher' }[] = [];
    for (const it of remaining) {
      const raw = (budget * it.part.units) / poolParts; // floor provisoire
      if (it.plafond && raw > it.plafond.units) newlyFixed.push({ id: it.id, val: it.plafond.units, borne: 'plafond' });
      else if (it.plancher && raw < it.plancher.units) newlyFixed.push({ id: it.id, val: it.plancher.units, borne: 'plancher' });
    }
    if (newlyFixed.length === 0) break;
    for (const f of newlyFixed) fixed.set(f.id, { val: f.val, borne: f.borne });
    remaining = remaining.filter((it) => !fixed.has(it.id));
  }

  // 2) distribue le budget restant au plus-fort-reste sur le pool non capé,
  //    sans franchir un plafond (lissage du reliquat)
  const distributed = new Map<string, bigint>();
  const poolParts = remaining.reduce((s, it) => s + it.part.units, 0n);
  const budget = env - [...fixed.values()].reduce((s, f) => s + f.val, 0n);

  if (remaining.length > 0 && poolParts > 0n) {
    const calc = remaining.map((it) => {
      const numer = budget * it.part.units;
      const floor = numer / poolParts;
      return { id: it.id, floor, reste: numer - floor * poolParts, part: it.part.units, plafond: it.plafond?.units };
    });
    for (const c of calc) distributed.set(c.id, c.floor);
    let leftover = budget - calc.reduce((s, c) => s + c.floor, 0n);
    const ordre = [...calc].sort((a, b) => (b.reste !== a.reste ? (b.reste > a.reste ? 1 : -1) : b.part > a.part ? 1 : b.part < a.part ? -1 : 0));
    let idx = 0;
    while (leftover > 0n && ordre.length > 0) {
      const c = ordre[idx % ordre.length];
      const cur = distributed.get(c.id) ?? 0n;
      if (c.plafond == null || cur + 1n <= c.plafond) {
        distributed.set(c.id, cur + 1n);
        leftover -= 1n;
      }
      idx += 1;
      if (idx > ordre.length * 4 && leftover > 0n) break; // tous capés → reliquat
    }
  }

  const lignes = items.map((it) => {
    const f = fixed.get(it.id);
    if (f) return { id: it.id, montant: Money.of(f.val, currency), borne: f.borne };
    return { id: it.id, montant: Money.of(distributed.get(it.id) ?? 0n, currency) };
  });
  const totalAlloue = lignes.reduce((s, l) => s + l.montant.units, 0n);
  return { lignes, reliquat: Money.of(env - totalAlloue, currency) };
}

/**
 * Calcule une répartition complète selon le mode (§6.2/§6.3).
 * `currency` doit être homogène à toutes les fiches.
 */
export function repartitionBonus(
  inputs: BonusInput[],
  enveloppe: Enveloppe,
  currency: Currency,
): RepartitionResult {
  const bruts = inputs.map((inp) => ({ id: inp.fiche.employeId, brut: partBrute(inp), input: inp }));

  if (enveloppe.mode === 'A_prorata') {
    // prorata + réconciliation itérative des plafonds/planchers (§6.3)
    const { lignes, reliquat } = repartProrataCaps(
      enveloppe.montant,
      bruts.map((b) => ({
        id: b.id,
        part: b.brut,
        plafond: plafondMoney(b.input.fiche),
        plancher: plancherMoney(b.input.fiche),
      })),
      currency,
    );
    const byId = new Map(lignes.map((l) => [l.id, l]));
    const result: BonusResult[] = bruts.map((b) => {
      const l = byId.get(b.id);
      return { employeId: b.id, brut: b.brut, final: l?.montant ?? Money.zero(currency), borne: l?.borne };
    });
    return {
      mode: enveloppe.mode,
      lignes: result,
      total: Money.sum(result.map((r) => r.final), currency),
      enveloppe: enveloppe.montant,
      depassement: false,
      reliquat,
    };
  }

  if (enveloppe.mode === 'B_plafonnee') {
    // formule = montant ; enveloppe = plafond global, alerte si dépassement.
    const result: BonusResult[] = bruts.map((b) => {
      const { value, borne } = bornes(b.brut, b.input.fiche);
      return { employeId: b.id, brut: b.brut, final: value, borne };
    });
    const total = Money.sum(result.map((r) => r.final), currency);
    return {
      mode: enveloppe.mode,
      lignes: result,
      total,
      enveloppe: enveloppe.montant,
      depassement: total.gt(enveloppe.montant),
      reliquat: Money.zero(currency),
    };
  }

  // mode C — formule libre : enveloppe prévisionnelle, aucune contrainte.
  const result: BonusResult[] = bruts.map((b) => {
    const { value, borne } = bornes(b.brut, b.input.fiche);
    return { employeId: b.id, brut: b.brut, final: value, borne };
  });
  const total = Money.sum(result.map((r) => r.final), currency);
  return {
    mode: enveloppe.mode,
    lignes: result,
    total,
    enveloppe: enveloppe.montant,
    depassement: false,
    reliquat: enveloppe.montant.subtract(total),
  };
}

/**
 * §8 simulation what-if : la répartition est PURE (aucune persistance), donc
 * simuler = calculer. Alias explicite pour l'usage RH/direction avant figement.
 */
export function simulateBonus(
  inputs: BonusInput[],
  enveloppe: Enveloppe,
  currency: Currency,
): RepartitionResult {
  return repartitionBonus(inputs, enveloppe, currency);
}
