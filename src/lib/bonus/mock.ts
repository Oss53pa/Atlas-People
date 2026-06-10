/**
 * Bonus M3 — jeu de données démo (mode mock) qui PILOTE le moteur Money.ts.
 *
 * Le SCORE vient de la couche validée Performance (computeAllEmployes →
 * scoreValide), conformément à l'accroche §9. Les fiches de rémunération
 * portent salaire + formule (DSL ou structurée). Tout le calcul (formule, modes,
 * caps, reliquat) est délégué à `src/engine/bonus`. Aucune décimale (R5).
 */
import { Money } from '../money';
import {
  BonusInput,
  Enveloppe,
  ModeBonus,
  RemuFiche,
  RepartitionResult,
  repartitionBonus,
} from '../../engine/bonus';
import { employeeById } from '../../data/mock';
import { computeAllEmployes } from '../perf/mock';

const XOF = 'XOF' as const;

/** Paramètres de fiche bonus par employé (coef + formule + bornes). */
interface FicheParam {
  coef: number;
  formuleDsl?: string;
  plafondBps?: number; // plafond en % du salaire annuel ×100
  plancherBps?: number;
}
const FICHE_PARAMS: Record<string, FicheParam> = {
  e5: { coef: 1, formuleDsl: 'SCORE × COEF × SAL_MENS' },
  e8: { coef: 1.2, formuleDsl: 'SCORE × COEF × SAL_MENS', plafondBps: 800 }, // capé à 8 % SAL_ANN
  e10: { coef: 1, formuleDsl: 'SCORE × COEF × SAL_MENS' },
  e6: { coef: 0.8, formuleDsl: 'SCORE × COEF × SAL_MENS', plancherBps: 200 }, // plancher 2 %
};

export interface BonusEmployeMock {
  employeId: string;
  scorePct: number;
  fiche: RemuFiche;
}

/** Construit les entrées bonus depuis les scores VALIDÉS de la Performance (§9). */
export function bonusInputs(coefGlobal = 1): { inputs: BonusInput[]; rows: BonusEmployeMock[] } {
  const perf = computeAllEmployes();
  const rows: BonusEmployeMock[] = [];
  const inputs: BonusInput[] = [];
  for (const e of perf) {
    const emp = employeeById(e.employeId);
    const p = FICHE_PARAMS[e.employeId];
    if (!emp || !p) continue;
    const fiche: RemuFiche = {
      employeId: e.employeId,
      salaireMensuel: Money.of(emp.baseSalary, XOF),
      formule: { base: 'SAL_MENS', coef: p.coef * coefGlobal },
      formuleDsl: p.formuleDsl,
      plafondBps: p.plafondBps,
      plancherBps: p.plancherBps,
    };
    rows.push({ employeId: e.employeId, scorePct: e.scoreValide, fiche });
    inputs.push({ fiche, scorePct: e.scoreValide });
  }
  return { inputs, rows };
}

/** Enveloppe démo par défaut (XOF). */
export const ENVELOPPE_DEFAUT = 6_000_000;

export interface BonusSimulation {
  result: RepartitionResult;
  rows: BonusEmployeMock[];
}

/**
 * Simulation what-if (§8) : calcule la répartition pour une enveloppe, un mode
 * et un coefficient global donnés — pure, sans persistance. C'est ce que la
 * direction manipule avant de figer.
 */
export function simulate(
  montant: number,
  mode: ModeBonus,
  coefGlobal = 1,
): BonusSimulation {
  const { inputs, rows } = bonusInputs(coefGlobal);
  const enveloppe: Enveloppe = { montant: Money.of(montant, XOF), mode };
  return { result: repartitionBonus(inputs, enveloppe, XOF), rows };
}

export { XOF as BONUS_CURRENCY };
