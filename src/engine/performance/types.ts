/**
 * Moteur Performance (M7 OKR + M8 Évaluations) — types du noyau de calcul.
 *
 * Conforme au CDC Module Performance §3 (cascade), §6 (moteur de calcul),
 * §6.7 (couche officielle auto/valide). Le moteur est PUR et DÉTERMINISTE :
 * aucune dépendance Supabase, aucune date « now() », aucun float monétaire.
 * Les `pct_*` sont des pourcentages d'atteinte (0 → cap_depassement), JAMAIS
 * des montants — la monnaie reste l'affaire exclusive de Money.ts / M3.
 *
 * Règles dures couvertes ici :
 *   R1  Atteinte d'objectif TOUJOURS dérivée des actions (jamais saisie directe).
 *   R3  Notation paramétrable → pourcentage (jamais binaire).
 *   R4  Couche `valide` (contre-évaluation manager) = seule officielle.
 */

/** Cascade §4.1 : trois niveaux chaînés par `parent_id`. */
export type Niveau = 'global' | 'departement' | 'employe';

/** §5.1 — deux dimensions orthogonales de l'action. */
export type Nature = 'continue' | 'one_shot';
export type TypeMesure = 'quantitatif' | 'qualitatif';

/** §6.3 — mode d'agrégation temporelle des actions continues. */
export type ModeAgregationContinue = 'moyenne' | 'moyenne_ponderee';

/**
 * §6.7 — deux passes de calcul.
 *  - `auto`   : entrées self de l'employé (`pct_self`).
 *  - `valide` : entrées contre-évaluées par le manager (`pct_manager`).
 * Seule `valide` remonte et fait foi (R4).
 */
export type Couche = 'auto' | 'valide';

/** §6.4 — granularité de période d'atteinte. */
export type PeriodeType = 'mois' | 'semestre' | 'annee';

/** §10 — paramétrage tenant (`notation_config`). */
export interface NotationConfig {
  /** Échelle de notation qualitative, ∈ {5,10,20,100,…}. */
  echelleMax: number;
  /** Plafond de dépassement quantitatif, ≥ 100. */
  capDepassement: number;
  /** Part individuelle α ∈ [0,1] ; 1 = 100 % individuel (défaut). */
  alphaCollectif: number;
  /** Pondération annuelle des semestres (s1 + s2 = 100). */
  ponderationSemestres: { s1: number; s2: number };
  /** Mode d'agrégation des actions continues sur un semestre. */
  modeAgregationContinue: ModeAgregationContinue;
  /** Seuil d'ouverture d'arbitrage sur |pct_auto − pct_valide| (§7.3). */
  seuilArbitrage: number;
}

/** Valeurs par défaut alignées sur le DDL §10 (`notation_config`). */
export const DEFAULT_NOTATION_CONFIG: NotationConfig = {
  echelleMax: 100,
  capDepassement: 100,
  alphaCollectif: 1,
  ponderationSemestres: { s1: 50, s2: 50 },
  modeAgregationContinue: 'moyenne',
  seuilArbitrage: 20,
};

/**
 * Mesure brute d'une action sur une période, pour une couche donnée.
 * `quantitatif` porte `resultat`/`cible`, `qualitatif` porte `note`.
 */
export interface MesureAction {
  typeMesure: TypeMesure;
  resultat?: number;
  cible?: number;
  note?: number;
}

/** Réalisation d'une action sur un mois donné (déjà ramenée en %). */
export interface RealisationMois {
  /** 1er du mois, format ISO `YYYY-MM-01`. */
  mois: string;
  /** % de réalisation du mois (§6.2). */
  pctReal: number;
  /** Poids du mois pour le mode `moyenne_ponderee` (défaut 1). */
  poidsMois?: number;
  /** Mois actif (l'action courait ce mois-là) — sinon ignoré (§6.3). */
  actif?: boolean;
}

/** Une action contribuant à un objectif (§6.4). */
export interface ActionAtteinte {
  /** Poids de l'action dans l'objectif (Σ = 100 garanti par trigger). */
  poidsAction: number;
  /** % de réalisation de l'action sur la période considérée. */
  pctReal: number;
  /** Action active sur le mois (utilisé pour le calcul mensuel renormalisé). */
  actifMois?: boolean;
}

/** Un objectif contribuant au score employé (§6.5). */
export interface ObjectifScore {
  poidsObj: number;
  /** % d'atteinte annuel de l'objectif. */
  pctAnnuel: number;
  estCollectif?: boolean;
}

/** Une contribution employé → objectif département (§6.6). */
export interface ContributionEmploye {
  poidsContribution: number;
  /** % d'atteinte VALIDÉ de l'employé (R4). */
  pctEmployeValide: number;
}

/** Un département contribuant à l'atteinte globale (§6.6). */
export interface ContributionDepartement {
  poidsDepartement: number;
  pctDepartement: number;
}
