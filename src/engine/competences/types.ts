/**
 * Noyau Compétences (M9) — types du modèle d'évaluation triangulée & readiness.
 *
 * Conforme à la *Note de cadrage core* §5 (Compétences) : référentiel échelonné,
 * attentes par poste, triangulation employé/manager/RH sur preuves, analyse
 * d'écart et verdict d'accès au poste suivant, péremption. Le moteur est PUR et
 * DÉTERMINISTE ; il ne produit que des niveaux, écarts et verdicts — jamais de
 * montant (R5) ni de décision PROPH3T (conseil uniquement).
 *
 * Règles dures honorées :
 *   R3 Niveau échelonné paramétrable → %, jamais acquis/non-acquis binaire.
 *   R4 `niveau_retenu` = niveau validé manager (consolidé avec l'avis RH).
 *   R9 Une compétence se PROUVE (preuve réutilisable depuis la Performance).
 */

/** §5.5 — statut d'une compétence évaluée. */
export type StatutCompetence = 'acquis' | 'en_cours' | 'perime';

/** §5.4 — verdict d'accès au poste suivant. */
export type Readiness = 'pret' | 'pret_sous_conditions' | 'pas_pret';

/** Échelle de maîtrise paramétrable (ex. 0–4 Débutant→Expert, ou 1–5). */
export interface EchelleNiveaux {
  /** Borne haute de l'échelle (niveau Expert). */
  max: number;
  /** Libellés optionnels indexés par niveau. */
  labels?: Record<number, string>;
}

export const DEFAULT_ECHELLE: EchelleNiveaux = {
  max: 4,
  labels: { 0: 'Aucun', 1: 'Débutant', 2: 'Intermédiaire', 3: 'Avancé', 4: 'Expert' },
};

/** §5.3 — les trois voix de l'évaluation triangulée d'une compétence. */
export interface TriangulationInput {
  /** Niveau démontré par l'employé (avec preuve). */
  niveauSelf?: number;
  /** Niveau contre-évalué par le manager (avec sa propre preuve/justif). */
  niveauManager?: number;
  /** Ajustement RH fondé sur l'historique (avis ; null si pas d'override). */
  niveauRhOverride?: number;
  /** L'employé a-t-il fourni une preuve ? (R9 — sans preuve, pas d'acquis). */
  preuveFournie?: boolean;
  /** Date de validité (compétences réglementaires/HSSE). ISO `YYYY-MM-DD`. */
  dateValidite?: string;
}

/** §5.2 — attente d'une compétence pour un poste (poste suivant = cible mobilité). */
export interface AttentePoste {
  competenceId: string;
  libelle?: string;
  /** Niveau attendu pour le poste. */
  niveauAttendu: number;
  /** Criticité = poids de la compétence dans le poste (≥ 0). */
  criticite: number;
  /** Compétence bloquante pour l'accès (souvent les critiques). */
  bloquante?: boolean;
}

/** Résultat consolidé d'une compétence évaluée (couche officielle retenue). */
export interface CompetenceEvaluee {
  competenceId: string;
  niveauRetenu: number;
  statut: StatutCompetence;
  /** Pourcentage de maîtrise (§3 : niveau / echelle_max × 100). */
  pctMaitrise: number;
}

/** Écart d'une compétence vs l'attente du poste suivant (§5.4). */
export interface EcartCompetence {
  competenceId: string;
  libelle?: string;
  niveauAttendu: number;
  niveauRetenu: number;
  /** écart = attendu − retenu (positif = manque). */
  ecart: number;
  criticite: number;
  bloquante: boolean;
  /** Écart bloquant l'accès (bloquante & écart > 0). */
  bloquant: boolean;
}

/** Verdict de readiness consolidé pour un poste cible. */
export interface ReadinessResult {
  verdict: Readiness;
  /** Couverture pondérée par criticité, 0–100 (§5.4). */
  scoreCouverture: number;
  /** Écarts restants (conditions d'accès si « prêt sous conditions »). */
  conditions: EcartCompetence[];
}

/** §7 — entrée de plan de développement dérivée d'un écart (→ M11 Formation). */
export interface PdcSuggestion {
  competenceId: string;
  libelle?: string;
  niveauActuel: number;
  niveauCible: number;
  ecart: number;
  /** Compétence bloquante : à prioriser dans le plan. */
  bloquant: boolean;
  actionSuggeree: string;
}
