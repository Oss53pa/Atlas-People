/**
 * Moteur Performance — noyau de calcul déterministe (CDC §6 / note de cadrage §4).
 *
 * Tout est PUR : mêmes entrées → mêmes sorties, sans horloge ni I/O. Les RPC
 * Supabase (`rpc_calcul_*`) répliquent ces formules côté base ; ce module est la
 * référence testable et la source du calcul côté client (vues temps réel R4).
 *
 * Vocabulaire : un `pct` est un pourcentage d'atteinte (0 → cap_depassement),
 * jamais un montant. La monnaie n'entre JAMAIS ici (Money.ts / M3 uniquement).
 *
 * Toutes les agrégations pondérées de ce module sont des MOYENNES PONDÉRÉES
 * `Σ(poids·valeur) / Σ poids`. Lorsque la note de cadrage écrit
 * `Σ(poids × pct)` sans dénominateur (semestriel, score, global), c'est parce
 * que Σ poids = 100 est garanti par le trigger `trg_check_poids_100` (R2) :
 * diviser par Σ poids (= 100) redonne exactement la formule. Passer par la
 * moyenne pondérée rend le calcul robuste aux sous-ensembles (mois partiels,
 * objectifs filtrés par couche) sans jamais contredire la spec.
 */

import {
  ActionAtteinte,
  ContributionDepartement,
  ContributionEmploye,
  MesureAction,
  ModeAgregationContinue,
  NotationConfig,
  ObjectifScore,
  RealisationMois,
} from './types';

/** Borne une valeur dans [lo, hi]. */
function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/**
 * Moyenne pondérée `Σ(poids·valeur) / Σ poids`.
 * Retourne 0 si la somme des poids est nulle (aucune contribution active) —
 * choix neutre et défendable plutôt que NaN.
 */
export function weightedMean(items: ReadonlyArray<{ poids: number; valeur: number }>): number {
  let num = 0;
  let den = 0;
  for (const { poids, valeur } of items) {
    num += poids * valeur;
    den += poids;
  }
  return den === 0 ? 0 : num / den;
}

/* ───────────────────────────── §6.1 Notation → % ───────────────────────────── */

/**
 * Convertit une note sur une échelle paramétrable en pourcentage (R3).
 * `pct = note / echelle_max × 100`, borné à [0, 100].
 */
export function pctNotation(note: number, echelleMax: number): number {
  if (echelleMax <= 0) throw new Error('pctNotation: echelle_max doit être > 0');
  return clamp((note / echelleMax) * 100, 0, 100);
}

/* ─────────────────────── §6.2 Réalisation d'une action ─────────────────────── */

/**
 * % de réalisation d'une action sur une période, pour une mesure brute donnée.
 *  - quantitatif : `min((résultat / cible) × 100, cap_depassement)`, borné ≥ 0.
 *  - qualitatif  : `note / echelle_max × 100`.
 * La couche (auto/valide) est portée par la mesure choisie en amont (self vs
 * manager) — le calcul lui-même est identique pour les deux passes (§6.7).
 */
export function pctRealisation(mesure: MesureAction, config: NotationConfig): number {
  if (mesure.typeMesure === 'quantitatif') {
    const cible = mesure.cible ?? 0;
    if (cible <= 0) throw new Error('pctRealisation: cible doit être > 0 pour une mesure quantitative');
    const taux = ((mesure.resultat ?? 0) / cible) * 100;
    return clamp(taux, 0, config.capDepassement);
  }
  // qualitatif
  return pctNotation(mesure.note ?? 0, config.echelleMax);
}

/* ─────────────────────── §6.3 Agrégation temporelle ────────────────────────── */

/**
 * Agrège la réalisation semestrielle d'une action CONTINUE à partir de ses mois.
 * Seuls les mois actifs comptent. Mode :
 *  - `moyenne`          : moyenne arithmétique des mois actifs (défaut).
 *  - `moyenne_ponderee` : `Σ(poids_mois · pct) / Σ poids_mois` (saisonnalité).
 * « Dernière valeur » est volontairement écartée (manipulable — note §3).
 */
export function aggregeContinue(
  mois: ReadonlyArray<RealisationMois>,
  mode: ModeAgregationContinue,
): number {
  const actifs = mois.filter((m) => m.actif !== false);
  if (actifs.length === 0) return 0;
  if (mode === 'moyenne_ponderee') {
    return weightedMean(actifs.map((m) => ({ poids: m.poidsMois ?? 1, valeur: m.pctReal })));
  }
  // moyenne simple des mois actifs
  return actifs.reduce((s, m) => s + m.pctReal, 0) / actifs.length;
}

/**
 * Réalisation semestrielle d'une action ONE_SHOT : valeur figée à la date de
 * réalisation, puis acquise (§6.3). Pas d'agrégation — passage explicite pour
 * symétrie d'API et lisibilité des appels.
 */
export function aggregeOneShot(pctRealAtRealisation: number): number {
  return pctRealAtRealisation;
}

/* ──────────────────────── §6.4 Atteinte des objectifs ──────────────────────── */

/**
 * Atteinte MENSUELLE d'un objectif, renormalisée sur les actions actives le mois :
 * `Σ(poids_action · pct_mois) / Σ poids_actions_actives`.
 */
export function atteinteObjectifMois(actions: ReadonlyArray<ActionAtteinte>): number {
  const actives = actions.filter((a) => a.actifMois !== false);
  return weightedMean(actives.map((a) => ({ poids: a.poidsAction, valeur: a.pctReal })));
}

/**
 * Atteinte SEMESTRIELLE (officielle) d'un objectif :
 * `Σ(poids_action · pct_semestre)`, Σ poids = 100 (R2) → moyenne pondérée.
 */
export function atteinteObjectifSemestre(actions: ReadonlyArray<ActionAtteinte>): number {
  return weightedMean(actions.map((a) => ({ poids: a.poidsAction, valeur: a.pctReal })));
}

/**
 * Atteinte ANNUELLE (campagne) d'un objectif :
 * `(poids_S1 · pct_S1 + poids_S2 · pct_S2) / (poids_S1 + poids_S2)`.
 * Avec le défaut 50/50 et des poids sommant à 100, on retrouve la moyenne simple.
 */
export function atteinteObjectifAnnuel(
  pctS1: number,
  pctS2: number,
  ponderation: { s1: number; s2: number },
): number {
  return weightedMean([
    { poids: ponderation.s1, valeur: pctS1 },
    { poids: ponderation.s2, valeur: pctS2 },
  ]);
}

/* ───────────────────────────── §6.5 Score employé ──────────────────────────── */

/** Score d'un sous-ensemble d'objectifs : `Σ(poids·pct) / Σ poids`. */
function scoreObjectifs(objectifs: ReadonlyArray<ObjectifScore>): number {
  return weightedMean(objectifs.map((o) => ({ poids: o.poidsObj, valeur: o.pctAnnuel })));
}

export interface ScoreEmploye {
  /** Score sur les objectifs individuels. */
  scoreIndividuel: number;
  /** Score sur les objectifs collectifs (partagés). */
  scoreCollectif: number;
  /** Score employé combiné : `α·indiv + (1−α)·collectif`. */
  scoreEmploye: number;
}

/**
 * Score employé (§6.5) : combine part individuelle et collective selon
 * `alpha_collectif` (α = 1 ⇒ 100 % individuel, défaut). Les objectifs sont
 * répartis par leur flag `estCollectif`. S'il n'existe aucun objectif collectif,
 * la part (1−α) ne s'applique à rien et `scoreEmploye = scoreIndividuel` quel
 * que soit α — comportement neutre attendu.
 */
export function scoreEmploye(
  objectifs: ReadonlyArray<ObjectifScore>,
  config: NotationConfig,
): ScoreEmploye {
  const individuels = objectifs.filter((o) => !o.estCollectif);
  const collectifs = objectifs.filter((o) => o.estCollectif);
  const scoreInd = scoreObjectifs(individuels);
  const scoreCol = scoreObjectifs(collectifs);
  const alpha = clamp(config.alphaCollectif, 0, 1);

  // Sans objectif collectif, on retombe sur la part individuelle pleine.
  const scoreEmp =
    collectifs.length === 0 ? scoreInd : alpha * scoreInd + (1 - alpha) * scoreCol;

  return { scoreIndividuel: scoreInd, scoreCollectif: scoreCol, scoreEmploye: scoreEmp };
}

/* ─────────────────────── §6.6 Remontée consolidée ──────────────────────────── */

/**
 * Atteinte d'un objectif DÉPARTEMENT par remontée pondérée des employés :
 * `Σ(poids_contribution · pct_employé_validé) / Σ poids_contribution`.
 * N'utilise que la couche validée (R4) — c'est l'appelant qui fournit les pct
 * validés.
 */
export function remonteeDepartement(contributions: ReadonlyArray<ContributionEmploye>): number {
  return weightedMean(
    contributions.map((c) => ({ poids: c.poidsContribution, valeur: c.pctEmployeValide })),
  );
}

/**
 * Atteinte GLOBALE par remontée pondérée des départements :
 * `Σ(poids_département · pct_département)`, Σ poids = 100 (R2).
 */
export function remonteeGlobale(departements: ReadonlyArray<ContributionDepartement>): number {
  return weightedMean(
    departements.map((d) => ({ poids: d.poidsDepartement, valeur: d.pctDepartement })),
  );
}

/* ─────────────────── §6.7 / §7.3 Couche officielle & arbitrage ─────────────── */

/**
 * Écart entre couche auto et couche validée sur un objectif (§4.6 / §7.3).
 * Toujours positif (valeur absolue).
 */
export function ecartCouches(pctAuto: number, pctValide: number): number {
  return Math.abs(pctAuto - pctValide);
}

/**
 * Un arbitrage doit-il être ouvert ? `|pct_auto − pct_valide| > seuil_arbitrage`
 * (R5 du CDC / §4.6). Strictement supérieur : pile au seuil, pas d'arbitrage.
 */
export function arbitrageRequis(pctAuto: number, pctValide: number, config: NotationConfig): boolean {
  return ecartCouches(pctAuto, pctValide) > config.seuilArbitrage;
}
