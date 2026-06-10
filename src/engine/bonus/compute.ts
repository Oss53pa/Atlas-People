/**
 * Moteur Bonus (M3, variable) — calcul déterministe en Money.ts bigint (R5).
 *
 * Note de cadrage core §6 : formule paramétrable, trois modes d'articulation à
 * l'enveloppe (A prorata exact / B plafonnée / C libre), plancher/plafond,
 * arrondi au franc, reliquat lissé. Aucune décimale ne survit (FCFA entier).
 */

import { Currency, Money } from '../../lib/money';
import {
  BonusInput,
  BonusResult,
  Enveloppe,
  RemuFiche,
  RepartitionResult,
} from './types';

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
  const base =
    fiche.formule.base === 'SAL_ANN' ? fiche.salaireMensuel.multiplyInt(12) : fiche.salaireMensuel;
  const rate = scoreFraction(scorePct) * fiche.formule.coef;
  const bps = Math.round(rate * 10_000); // 1 % = 100 bps
  return base.applyRateBps(bps);
}

/** Plafond/plancher exprimés en bps du salaire annuel (§6.3). */
export function bornes(
  montant: Money,
  fiche: RemuFiche,
): { value: Money; borne?: 'plafond' | 'plancher' } {
  const salAnn = fiche.salaireMensuel.multiplyInt(12);
  let value = montant;
  let borne: 'plafond' | 'plancher' | undefined;
  if (fiche.plafondBps != null) {
    const cap = salAnn.applyRateBps(fiche.plafondBps);
    if (value.gt(cap)) {
      value = cap;
      borne = 'plafond';
    }
  }
  if (fiche.plancherBps != null) {
    const floor = salAnn.applyRateBps(fiche.plancherBps);
    if (floor.gt(value)) {
      value = floor;
      borne = 'plancher';
    }
  }
  return { value, borne };
}

/**
 * §6.2 mode A — prorata d'enveloppe : `bonus_i = enveloppe × part_i / Σ part_j`.
 * Répartition ENTIÈRE exacte (Σ bonus = enveloppe) par plus-fort-reste, le
 * reliquat d'arrondi allant aux parts les plus élevées (§6.3 lissage).
 */
function repartProrata(enveloppe: Money, parts: { id: string; part: Money }[], currency: Currency): {
  lignes: { id: string; montant: Money }[];
  reliquat: Money;
} {
  const sommeParts = Money.sum(parts.map((p) => p.part), currency);
  if (sommeParts.isZero()) {
    // aucune part → tout en reliquat (rien à répartir)
    return { lignes: parts.map((p) => ({ id: p.id, montant: Money.zero(currency) })), reliquat: enveloppe };
  }
  const env = enveloppe.units;
  const total = sommeParts.units;

  // part entière (floor) + reste fractionnaire pour le plus-fort-reste
  const calc = parts.map((p) => {
    const numer = env * p.part.units;
    const floor = numer / total; // bigint division = floor
    const reste = numer - floor * total;
    return { id: p.id, floor, reste, part: p.part.units };
  });

  const distribue = calc.reduce((acc, c) => acc + c.floor, 0n);
  let reliquat = env - distribue;

  // attribue le reliquat franc par franc, plus gros reste d'abord puis plus
  // grosse part (départage stable) — §6.3 report sur les scores les plus élevés
  const ordre = [...calc].sort((a, b) => {
    if (b.reste !== a.reste) return b.reste > a.reste ? 1 : -1;
    if (b.part !== a.part) return b.part > a.part ? 1 : -1;
    return 0;
  });
  const bonusById = new Map(calc.map((c) => [c.id, c.floor]));
  let i = 0;
  while (reliquat > 0n && ordre.length > 0) {
    const target = ordre[i % ordre.length];
    bonusById.set(target.id, (bonusById.get(target.id) ?? 0n) + 1n);
    reliquat -= 1n;
    i += 1;
  }

  return {
    lignes: parts.map((p) => ({ id: p.id, montant: Money.of(bonusById.get(p.id) ?? 0n, currency) })),
    reliquat: Money.zero(currency),
  };
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
    const { lignes } = repartProrata(
      enveloppe.montant,
      bruts.map((b) => ({ id: b.id, part: b.brut })),
      currency,
    );
    const byId = new Map(lignes.map((l) => [l.id, l.montant]));
    const result: BonusResult[] = bruts.map((b) => {
      const brutEnv = byId.get(b.id) ?? Money.zero(currency);
      const { value, borne } = bornes(brutEnv, b.input.fiche);
      return { employeId: b.id, brut: b.brut, final: value, borne };
    });
    const total = Money.sum(result.map((r) => r.final), currency);
    // reliquat = ce qui n'a pas été distribué après bornes (peut réapparaître si
    // un plafond a écrêté) — exposé pour arbitrage RH.
    return {
      mode: enveloppe.mode,
      lignes: result,
      total,
      enveloppe: enveloppe.montant,
      depassement: false,
      reliquat: enveloppe.montant.subtract(total),
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
