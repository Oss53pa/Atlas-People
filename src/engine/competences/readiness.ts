/**
 * Noyau Compétences (M9) — triangulation, écart, readiness, péremption.
 * Réplique testable du moteur ; aucune I/O, aucune horloge implicite (la date
 * du jour est toujours passée en argument pour rester déterministe).
 *
 * Voir Note de cadrage core §5. Couche officielle = niveau validé manager (R4) ;
 * une compétence périmée ne compte jamais comme acquise (R9 / §5.5).
 */

import {
  AttentePoste,
  CompetenceEvaluee,
  EchelleNiveaux,
  EcartCompetence,
  PdcSuggestion,
  Readiness,
  ReadinessResult,
  StatutCompetence,
  TriangulationInput,
} from './types';

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/** §3 — niveau → pourcentage de maîtrise, borné [0, 100]. */
export function pctMaitrise(niveau: number, echelle: EchelleNiveaux): number {
  if (echelle.max <= 0) throw new Error('pctMaitrise: echelle.max doit être > 0');
  return clamp((niveau / echelle.max) * 100, 0, 100);
}

/**
 * §5.5 — statut de péremption. Une compétence dont la `dateValidite` est
 * dépassée est `perime` ; elle ne sera jamais comptée comme acquise.
 * `today` au format ISO `YYYY-MM-DD`.
 */
export function statutPeremption(
  niveauRetenu: number,
  today: string,
  dateValidite?: string,
  preuveFournie = true,
): StatutCompetence {
  if (dateValidite && dateValidite < today) return 'perime';
  // R9 : sans preuve, l'acquis n'est pas démontré → en_cours
  if (niveauRetenu <= 0 || !preuveFournie) return 'en_cours';
  return 'acquis';
}

/**
 * §5.3 — niveau retenu = niveau validé manager (R4), consolidé avec l'avis RH.
 *  - en l'absence de contre-évaluation manager, on retombe sur le self ;
 *  - un override RH (avis fondé sur l'historique) prime quand il est fourni.
 */
export function niveauRetenu(input: TriangulationInput): number {
  if (input.niveauRhOverride != null) return input.niveauRhOverride;
  if (input.niveauManager != null) return input.niveauManager;
  return input.niveauSelf ?? 0;
}

/** Consolide une compétence triangulée en résultat officiel (retenu + statut + %). */
export function evalueCompetence(
  competenceId: string,
  input: TriangulationInput,
  echelle: EchelleNiveaux,
  today: string,
): CompetenceEvaluee {
  const retenu = niveauRetenu(input);
  const statut = statutPeremption(retenu, today, input.dateValidite, input.preuveFournie ?? true);
  // Une compétence périmée ne compte jamais comme acquise (§5.5) → maîtrise nulle.
  const effectif = statut === 'perime' ? 0 : retenu;
  return {
    competenceId,
    niveauRetenu: retenu,
    statut,
    pctMaitrise: pctMaitrise(effectif, echelle),
  };
}

/**
 * §5.4 — écart d'une compétence vs l'attente du poste : `attendu − retenu`.
 * Une compétence périmée est traitée comme niveau 0 (acquis perdu).
 */
export function ecartCompetence(
  attente: AttentePoste,
  evaluee: CompetenceEvaluee,
): EcartCompetence {
  const niveauEffectif = evaluee.statut === 'perime' ? 0 : evaluee.niveauRetenu;
  const ecart = attente.niveauAttendu - niveauEffectif;
  const bloquante = attente.bloquante ?? false;
  return {
    competenceId: attente.competenceId,
    libelle: attente.libelle,
    niveauAttendu: attente.niveauAttendu,
    niveauRetenu: niveauEffectif,
    ecart,
    criticite: attente.criticite,
    bloquante,
    bloquant: bloquante && ecart > 0,
  };
}

/**
 * §5.4 — verdict d'accès au poste suivant + couverture pondérée par criticité.
 *
 *  - `pas_pret`               : au moins un écart BLOQUANT (compétence bloquante
 *                               sous le niveau attendu).
 *  - `pret_sous_conditions`   : aucun bloquant, mais des écarts subsistent ;
 *                               les conditions = ces écarts restants.
 *  - `pret`                   : tous les écarts ≤ 0.
 *
 * `scoreCouverture` = Σ(criticité · min(retenu/attendu, 1)) / Σ criticité × 100.
 */
export function evalueReadiness(ecarts: ReadonlyArray<EcartCompetence>): ReadinessResult {
  let num = 0;
  let den = 0;
  let bloquant = false;
  const conditions: EcartCompetence[] = [];

  for (const e of ecarts) {
    const couverture = e.niveauAttendu <= 0 ? 1 : clamp(e.niveauRetenu / e.niveauAttendu, 0, 1);
    num += e.criticite * couverture;
    den += e.criticite;
    if (e.bloquant) bloquant = true;
    if (e.ecart > 0) conditions.push(e);
  }

  const scoreCouverture = den === 0 ? 100 : (num / den) * 100;
  let verdict: Readiness;
  if (bloquant) verdict = 'pas_pret';
  else if (conditions.length > 0) verdict = 'pret_sous_conditions';
  else verdict = 'pret';

  return { verdict, scoreCouverture, conditions };
}

/**
 * Pipeline complet : à partir des attentes du poste suivant et des compétences
 * triangulées de l'employé, produit les écarts + le verdict de readiness.
 * Les attentes sans compétence évaluée sont considérées au niveau retenu 0.
 */
export function analyseAccesPoste(
  attentes: ReadonlyArray<AttentePoste>,
  evaluees: ReadonlyArray<CompetenceEvaluee>,
): { ecarts: EcartCompetence[]; readiness: ReadinessResult } {
  const parId = new Map(evaluees.map((e) => [e.competenceId, e]));
  const ecarts = attentes.map((a) =>
    ecartCompetence(
      a,
      parId.get(a.competenceId) ?? {
        competenceId: a.competenceId,
        niveauRetenu: 0,
        statut: 'en_cours' as StatutCompetence,
        pctMaitrise: 0,
      },
    ),
  );
  return { ecarts, readiness: evalueReadiness(ecarts) };
}

/**
 * §7 — dérive un plan de développement (PDC) des écarts > 0, priorisé : les
 * compétences bloquantes d'abord, puis par écart décroissant. Alimente M11
 * Formation. Pur — aucune décision PROPH3T (R7 M9 : IA jamais décideur).
 */
export function generePlanDeveloppement(ecarts: ReadonlyArray<EcartCompetence>): PdcSuggestion[] {
  return ecarts
    .filter((e) => e.ecart > 0)
    .map((e) => ({
      competenceId: e.competenceId,
      libelle: e.libelle,
      niveauActuel: e.niveauRetenu,
      niveauCible: e.niveauAttendu,
      ecart: e.ecart,
      bloquant: e.bloquant,
      actionSuggeree: `Monter de ${e.niveauRetenu} à ${e.niveauAttendu} (formation / mentorat — lien M11)`,
    }))
    .sort((a, b) => Number(b.bloquant) - Number(a.bloquant) || b.ecart - a.ecart);
}
