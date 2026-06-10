/**
 * Moteur Bonus (M3, variable) — types du noyau de calcul.
 *
 * Conforme à la *Note de cadrage core* §6. Tout montant est en **Money.ts
 * bigint** (franc FCFA entier, zéro float, R5). Le bonus consomme le SCORE
 * final validé de la campagne (perf_scores scope=employe periode=annee couche
 * valide, §9) et ne le recalcule jamais. PROPH3T ne calcule aucun bonus (R5).
 */

import { Currency, Money } from '../../lib/money';

/** §6.2 — mode d'articulation à l'enveloppe (réglage tenant `mode_bonus`). */
export type ModeBonus = 'A_prorata' | 'B_plafonnee' | 'C_libre';

/** §6.1 — base salariale de référence de la formule. */
export type BaseSalaire = 'SAL_MENS' | 'SAL_ANN';

/**
 * §6.1 — formule paramétrable d'un employé : `part = SCORE × COEF × base`.
 * On reste sur une forme structurée (déterministe, auditable) plutôt qu'une
 * expression libre. `SCORE` est une fraction normalisée (score validé / 100).
 */
export interface FormuleBonus {
  base: BaseSalaire;
  /** Coefficient (grade/poste/catégorie ou individuel), ≥ 0. */
  coef: number;
}

/** Fiche de rémunération minimale nécessaire au calcul (§8 `remu_fiche`). */
export interface RemuFiche {
  employeId: string;
  salaireMensuel: Money;
  formule: FormuleBonus;
  /** Plancher/plafond du bonus en part du salaire annuel (bps), optionnels (§6.3). */
  plancherBps?: number;
  plafondBps?: number;
}

/** Entrée de calcul d'un employé. */
export interface BonusInput {
  fiche: RemuFiche;
  /** Score validé de la campagne, en pourcentage (0–120…). */
  scorePct: number;
}

/** §6.2 — enveloppe budgétaire. */
export interface Enveloppe {
  montant: Money;
  mode: ModeBonus;
}

/** Résultat de calcul d'un bonus employé. */
export interface BonusResult {
  employeId: string;
  /** Part brute issue de la formule (avant articulation enveloppe). */
  brut: Money;
  /** Montant final après mode + bornes + arrondi. */
  final: Money;
  /** Plafond/plancher appliqué ? */
  borne?: 'plafond' | 'plancher';
}

/** Synthèse d'une répartition (toutes lignes). */
export interface RepartitionResult {
  mode: ModeBonus;
  lignes: BonusResult[];
  total: Money;
  enveloppe: Money;
  /** Mode B : dépassement de l'enveloppe-plafond (alerte, pas d'ajustement auto). */
  depassement: boolean;
  /** Mode A : reliquat redistribué (devrait être 0 après lissage). */
  reliquat: Money;
}

export type { Currency, Money };
