/**
 * Noyau Compétences — jeu de données démo (mode mock) qui PILOTE le moteur.
 *
 * Fournit, par employé, le poste cible (attentes : niveau attendu + criticité)
 * et les compétences triangulées (self / manager / avis RH + preuve + validité).
 * Le verdict de readiness, les écarts et la péremption sont calculés par
 * `src/engine/competences`. Déterministe, date du jour explicite.
 */
import {
  AttentePoste,
  EchelleNiveaux,
  TriangulationInput,
  analyseAccesPoste,
  evalueCompetence,
  type CompetenceEvaluee,
  type ReadinessResult,
} from '../../engine/competences';

export const COMP_TODAY = '2026-06-10';

/** Échelle 0–5 alignée sur m9_skill_matrix. */
export const COMP_ECHELLE: EchelleNiveaux = {
  max: 5,
  labels: { 0: 'Aucun', 1: 'Notions', 2: 'Débutant', 3: 'Intermédiaire', 4: 'Avancé', 5: 'Expert' },
};

export interface MockCompetence {
  competenceId: string;
  libelle: string;
  niveauAttendu: number;
  criticite: number;
  bloquante?: boolean;
  triangulation: TriangulationInput;
}
export interface MockReadinessEmploye {
  employeId: string;
  posteActuel: string;
  posteCible: string;
  competences: MockCompetence[];
}

export const COMP_READINESS: MockReadinessEmploye[] = [
  {
    employeId: 'e5', posteActuel: 'Designer Produit', posteCible: 'Senior Designer',
    competences: [
      { competenceId: 'design-systems', libelle: 'Design systems', niveauAttendu: 4, criticite: 3, bloquante: true,
        triangulation: { niveauSelf: 4, niveauManager: 4, preuveFournie: true } },
      { competenceId: 'research', libelle: 'User research', niveauAttendu: 3, criticite: 2,
        triangulation: { niveauSelf: 3, niveauManager: 3, preuveFournie: true } },
      { competenceId: 'proto', libelle: 'Prototypage avancé', niveauAttendu: 4, criticite: 1,
        triangulation: { niveauSelf: 4, niveauManager: 4, preuveFournie: true } },
    ],
  },
  {
    employeId: 'e8', posteActuel: 'DevOps Engineer', posteCible: 'SRE Lead',
    competences: [
      { competenceId: 'incident', libelle: 'Gestion d’incidents', niveauAttendu: 4, criticite: 3, bloquante: true,
        triangulation: { niveauSelf: 4, niveauManager: 4, preuveFournie: true } },     // critique couvert
      { competenceId: 'iac', libelle: 'Infra as code', niveauAttendu: 4, criticite: 2,
        triangulation: { niveauSelf: 4, niveauManager: 4, preuveFournie: true } },
      { competenceId: 'leadership', libelle: 'Leadership technique', niveauAttendu: 3, criticite: 2,
        triangulation: { niveauSelf: 3, niveauManager: 2, niveauRhOverride: 2, preuveFournie: true } }, // écart 1 non bloquant
    ],
  },
  {
    employeId: 'e10', posteActuel: 'Data Analyst', posteCible: 'Lead Data',
    competences: [
      { competenceId: 'modeling', libelle: 'Modélisation données', niveauAttendu: 4, criticite: 3, bloquante: true,
        triangulation: { niveauSelf: 5, niveauManager: 2, preuveFournie: true } },     // gros écart critique → pas prêt
      { competenceId: 'ml', libelle: 'Machine learning', niveauAttendu: 3, criticite: 2,
        triangulation: { niveauSelf: 3, niveauManager: 3, preuveFournie: true } },
      { competenceId: 'mgmt', libelle: 'Management d’équipe', niveauAttendu: 3, criticite: 2,
        triangulation: { niveauSelf: 2, niveauManager: 2, preuveFournie: false } },     // sans preuve
    ],
  },
  {
    employeId: 'e6', posteActuel: 'Comptable', posteCible: 'Chef comptable',
    competences: [
      { competenceId: 'cloture', libelle: 'Clôture comptable', niveauAttendu: 4, criticite: 3, bloquante: true,
        triangulation: { niveauSelf: 4, niveauManager: 4, preuveFournie: true } },
      { competenceId: 'hsse', libelle: 'Certif. réglementaire OHADA', niveauAttendu: 3, criticite: 2, bloquante: true,
        triangulation: { niveauSelf: 4, niveauManager: 4, preuveFournie: true, dateValidite: '2026-01-31' } }, // périmée → 0 → bloquant
      { competenceId: 'audit', libelle: 'Audit interne', niveauAttendu: 3, criticite: 1,
        triangulation: { niveauSelf: 3, niveauManager: 3, preuveFournie: true } },
    ],
  },
];

export interface ReadinessCalc {
  employeId: string;
  posteActuel: string;
  posteCible: string;
  evaluees: { mock: MockCompetence; evaluee: CompetenceEvaluee }[];
  readiness: ReadinessResult;
  ecartsByCompetence: Map<string, number>;
}

/** Calcule la readiness d'un employé via le moteur (triangulation + écart). */
export function computeReadiness(emp: MockReadinessEmploye, echelle = COMP_ECHELLE, today = COMP_TODAY): ReadinessCalc {
  const evaluees = emp.competences.map((m) => ({
    mock: m,
    evaluee: evalueCompetence(m.competenceId, m.triangulation, echelle, today),
  }));
  const attentes: AttentePoste[] = emp.competences.map((m) => ({
    competenceId: m.competenceId,
    libelle: m.libelle,
    niveauAttendu: m.niveauAttendu,
    criticite: m.criticite,
    bloquante: m.bloquante,
  }));
  const { ecarts, readiness } = analyseAccesPoste(attentes, evaluees.map((e) => e.evaluee));
  return {
    employeId: emp.employeId,
    posteActuel: emp.posteActuel,
    posteCible: emp.posteCible,
    evaluees,
    readiness,
    ecartsByCompetence: new Map(ecarts.map((e) => [e.competenceId, e.ecart])),
  };
}

export function computeAllReadiness(): ReadinessCalc[] {
  return COMP_READINESS.map((e) => computeReadiness(e));
}
