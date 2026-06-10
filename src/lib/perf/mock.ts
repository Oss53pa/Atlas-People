/**
 * Noyau Performance — jeu de données démo (mode mock) qui PILOTE le moteur.
 *
 * Les tables perf_* étant neuves, ce mock fournit des mesures mensuelles brutes
 * (self employé + contre-évaluation manager) ; TOUT le reste (réalisation,
 * atteinte, score, remontée, écarts) est calculé par `src/engine/performance`.
 * Aucune valeur d'atteinte n'est saisie en dur (R1). Déterministe, sans horloge.
 *
 * Contexte : campagne 2026, semestre S1 (janv.→juin) en clôture au 2026-06-10.
 */
import {
  ActionAtteinte,
  Couche,
  DEFAULT_NOTATION_CONFIG,
  MesureAction,
  NotationConfig,
  Nature,
  TypeMesure,
  aggregeContinue,
  aggregeOneShot,
  arbitrageRequis,
  atteinteObjectifSemestre,
  ecartCouches,
  pctRealisation,
  remonteeDepartement,
  remonteeGlobale,
  scoreEmploye,
} from '../../engine/performance';

export const PERF_TODAY = '2026-06-10';
export const PERF_CAMPAGNE = { id: 'camp-2026', annee: 2026, statut: 'en_cours' as const, semestre: 'S1' as const };

/** Config tenant démo : cap 120 (valorise le sur-résultat), α 0.8, seuil 20. */
export const PERF_CONFIG: NotationConfig = {
  ...DEFAULT_NOTATION_CONFIG,
  capDepassement: 120,
  alphaCollectif: 0.8,
  seuilArbitrage: 20,
};

const S1_MOIS = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01'];

export interface MockActionMois {
  mois: string;
  self: MesureAction;
  manager: MesureAction;
  actif: boolean;
}
export interface MockAction {
  id: string;
  libelle: string;
  nature: Nature;
  typeMesure: TypeMesure;
  poids: number;
  cible?: number;
  unite?: string;
  dateEcheance?: string;
  statut: string;
  moisS1: MockActionMois[];
}
export interface MockObjectif {
  id: string;
  libelle: string;
  poids: number;
  estCollectif: boolean;
  actions: MockAction[];
}
export interface MockEmploye {
  employeId: string;
  departement: string;
  managerId?: string;
  poidsContribution: number;
  objectifs: MockObjectif[];
}

/* ── Générateurs déterministes de mesures mensuelles ─────────────────────────── */

/** Action quantitative continue : résultats mensuels self/manager vs cible. */
function quantContinue(
  id: string,
  libelle: string,
  poids: number,
  cible: number,
  unite: string,
  selfVals: number[],
  managerVals: number[],
  dateEcheance?: string,
  statut = 'en_cours',
): MockAction {
  return {
    id, libelle, nature: 'continue', typeMesure: 'quantitatif', poids, cible, unite, dateEcheance, statut,
    moisS1: S1_MOIS.map((mois, i) => ({
      mois,
      self: { typeMesure: 'quantitatif', resultat: selfVals[i], cible },
      manager: { typeMesure: 'quantitatif', resultat: managerVals[i], cible },
      actif: true,
    })),
  };
}

/** Action qualitative one_shot : note self/manager figée à la réalisation. */
function qualOneShot(
  id: string,
  libelle: string,
  poids: number,
  selfNote: number,
  managerNote: number,
  dateRealisationMois: string,
  dateEcheance: string,
  statut = 'realisee',
): MockAction {
  return {
    id, libelle, nature: 'one_shot', typeMesure: 'qualitatif', poids, dateEcheance, statut,
    moisS1: S1_MOIS.map((mois) => ({
      mois,
      self: { typeMesure: 'qualitatif', note: selfNote },
      manager: { typeMesure: 'qualitatif', note: managerNote },
      actif: mois === dateRealisationMois,
    })),
  };
}

/* ── Jeu de données ───────────────────────────────────────────────────────────
 * Technologie (manager e2 Kouadio) : e5, e8, e10 + e2 lui-même.
 * Finance (manager e1 Awa) : e6.
 * Poids départements dans le global : Technologie 60, Finance 40.
 * ──────────────────────────────────────────────────────────────────────────── */

export const DEPT_POIDS: Record<string, number> = { Technologie: 60, Finance: 40 };

export const PERF_EMPLOYES: MockEmploye[] = [
  {
    employeId: 'e5', departement: 'Technologie', managerId: 'e2', poidsContribution: 2,
    objectifs: [
      {
        id: 'o-e5-1', libelle: 'Refonte du design system', poids: 70, estCollectif: false,
        actions: [
          quantContinue('a-e5-1a', 'Composants migrés / mois', 60, 8, 'composants',
            [6, 7, 8, 9, 8, 9], [6, 6, 7, 8, 8, 8]),
          qualOneShot('a-e5-1b', 'Audit accessibilité livré', 40, 90, 78, '2026-04-01', '2026-04-15'),
        ],
      },
      {
        id: 'o-e5-2', libelle: 'Satisfaction interne produit (collectif)', poids: 30, estCollectif: true,
        actions: [
          quantContinue('a-e5-2a', 'NPS interne / mois', 100, 50, 'pts',
            [40, 44, 46, 48, 50, 52], [40, 42, 45, 47, 48, 50]),
        ],
      },
    ],
  },
  {
    employeId: 'e8', departement: 'Technologie', managerId: 'e2', poidsContribution: 2,
    objectifs: [
      {
        id: 'o-e8-1', libelle: 'Fiabilité plateforme (SRE)', poids: 65, estCollectif: false,
        actions: [
          quantContinue('a-e8-1a', 'Uptime mensuel %', 70, 99, '%',
            [98, 99, 99, 100, 99, 100], [97, 98, 99, 99, 99, 99]),
          // action en retard : échéance passée, non réalisée
          qualOneShot('a-e8-1b', 'Runbook incident publié', 30, 60, 55, '2026-05-01', '2026-03-31', 'en_cours'),
        ],
      },
      {
        id: 'o-e8-2', libelle: 'Satisfaction interne produit (collectif)', poids: 35, estCollectif: true,
        actions: [
          quantContinue('a-e8-2a', 'NPS interne / mois', 100, 50, 'pts',
            [40, 44, 46, 48, 50, 52], [40, 42, 45, 47, 48, 50]),
        ],
      },
    ],
  },
  {
    employeId: 'e10', departement: 'Technologie', managerId: 'e2', poidsContribution: 1,
    objectifs: [
      {
        id: 'o-e10-1', libelle: 'Industrialisation analytics', poids: 60, estCollectif: false,
        actions: [
          // gros écart self/manager → arbitrage attendu (> seuil 20)
          quantContinue('a-e10-1a', 'Dashboards livrés / mois', 50, 4, 'dashboards',
            [4, 5, 5, 4, 5, 5], [2, 2, 3, 3, 3, 3]),
          qualOneShot('a-e10-1b', 'Modèle de données documenté', 50, 95, 60, '2026-06-01', '2026-06-30'),
        ],
      },
      {
        id: 'o-e10-2', libelle: 'Satisfaction interne produit (collectif)', poids: 40, estCollectif: true,
        actions: [
          quantContinue('a-e10-2a', 'NPS interne / mois', 100, 50, 'pts',
            [40, 44, 46, 48, 50, 52], [40, 42, 45, 47, 48, 50]),
        ],
      },
    ],
  },
  {
    employeId: 'e6', departement: 'Finance', managerId: 'e1', poidsContribution: 1,
    objectifs: [
      {
        id: 'o-e6-1', libelle: 'Clôtures comptables dans les délais', poids: 100, estCollectif: false,
        actions: [
          quantContinue('a-e6-1a', 'Jours de clôture (cible ≤ 5)', 60, 5, 'jours',
            // moins = mieux : on mesure « ponctualité » = cible/résultat ≈ inversé, ici résultat proche cible
            [5, 5, 6, 5, 5, 4], [5, 6, 6, 5, 5, 5]),
          qualOneShot('a-e6-1b', 'Reporting trimestriel Direction', 40, 88, 85, '2026-03-01', '2026-03-31'),
        ],
      },
    ],
  },
];

/* ── Calcul via le moteur (aucune valeur d'atteinte en dur) ──────────────────── */

function pctMois(m: MockActionMois, couche: Couche, config: NotationConfig): number {
  const mesure = couche === 'valide' ? m.manager : m.self;
  return pctRealisation(mesure, config); // réalisation mensuelle via le moteur (§6.2)
}

/** Réalisation semestrielle S1 d'une action, couche donnée (§6.3). */
export function actionPctSemestre(a: MockAction, couche: Couche, config = PERF_CONFIG): number {
  if (a.nature === 'one_shot') {
    const moisRea = a.moisS1.find((m) => m.actif);
    return aggregeOneShot(moisRea ? pctMois(moisRea, couche, config) : 0);
  }
  return aggregeContinue(
    a.moisS1.map((m) => ({ mois: m.mois, pctReal: pctMois(m, couche, config), actif: m.actif })),
    config.modeAgregationContinue,
  );
}

/** Atteinte S1 d'un objectif, couche donnée (§6.4 semestriel). */
export function objectifPctS1(o: MockObjectif, couche: Couche, config = PERF_CONFIG): number {
  const actions: ActionAtteinte[] = o.actions.map((a) => ({
    poidsAction: a.poids,
    pctReal: actionPctSemestre(a, couche, config),
  }));
  return atteinteObjectifSemestre(actions);
}

export interface ObjectifCalc {
  objectif: MockObjectif;
  pctAuto: number;
  pctValide: number;
  ecart: number;
  arbitrage: boolean;
}

export interface EmployeCalc {
  employeId: string;
  departement: string;
  managerId?: string;
  poidsContribution: number;
  objectifs: ObjectifCalc[];
  scoreAuto: number;
  scoreValide: number;
  ecartMax: number;
  actionsEnRetard: { action: MockAction; objectif: MockObjectif }[];
}

/** Calcule la fiche Performance S1 d'un employé via le moteur (couche auto + valide). */
export function computeEmploye(emp: MockEmploye, config = PERF_CONFIG): EmployeCalc {
  const objectifs: ObjectifCalc[] = emp.objectifs.map((o) => {
    const pctAuto = objectifPctS1(o, 'auto', config);
    const pctValide = objectifPctS1(o, 'valide', config);
    return {
      objectif: o,
      pctAuto,
      pctValide,
      ecart: ecartCouches(pctAuto, pctValide),
      arbitrage: arbitrageRequis(pctAuto, pctValide, config),
    };
  });

  const toScore = (couche: Couche) =>
    scoreEmploye(
      emp.objectifs.map((o) => ({
        poidsObj: o.poids,
        pctAnnuel: objectifPctS1(o, couche, config),
        estCollectif: o.estCollectif,
      })),
      config,
    ).scoreEmploye;

  const actionsEnRetard = emp.objectifs.flatMap((o) =>
    o.actions
      .filter(
        (a) =>
          a.dateEcheance &&
          a.dateEcheance < PERF_TODAY &&
          !['realisee', 'figee'].includes(a.statut),
      )
      .map((a) => ({ action: a, objectif: o })),
  );

  return {
    employeId: emp.employeId,
    departement: emp.departement,
    managerId: emp.managerId,
    poidsContribution: emp.poidsContribution,
    objectifs,
    scoreAuto: toScore('auto'),
    scoreValide: toScore('valide'),
    ecartMax: objectifs.reduce((mx, o) => Math.max(mx, o.ecart), 0),
    actionsEnRetard,
  };
}

export function computeAllEmployes(config = PERF_CONFIG): EmployeCalc[] {
  return PERF_EMPLOYES.map((e) => computeEmploye(e, config));
}

export interface DepartementCalc {
  departement: string;
  poids: number;
  pctValide: number;
  pctAuto: number;
  effectif: number;
}

/** Remontée consolidée par département (couche validée = officielle, R4). */
export function computeDepartements(config = PERF_CONFIG): DepartementCalc[] {
  const all = computeAllEmployes(config);
  const byDept = new Map<string, EmployeCalc[]>();
  for (const e of all) {
    byDept.set(e.departement, [...(byDept.get(e.departement) ?? []), e]);
  }
  return [...byDept.entries()].map(([departement, membres]) => ({
    departement,
    poids: DEPT_POIDS[departement] ?? 0,
    pctValide: remonteeDepartement(
      membres.map((m) => ({ poidsContribution: m.poidsContribution, pctEmployeValide: m.scoreValide })),
    ),
    pctAuto: remonteeDepartement(
      membres.map((m) => ({ poidsContribution: m.poidsContribution, pctEmployeValide: m.scoreAuto })),
    ),
    effectif: membres.length,
  }));
}

/** Atteinte globale entreprise (§6.6), couche validée. */
export function computeGlobal(config = PERF_CONFIG): { pctValide: number; pctAuto: number } {
  const depts = computeDepartements(config);
  return {
    pctValide: remonteeGlobale(depts.map((d) => ({ poidsDepartement: d.poids, pctDepartement: d.pctValide }))),
    pctAuto: remonteeGlobale(depts.map((d) => ({ poidsDepartement: d.poids, pctDepartement: d.pctAuto }))),
  };
}

/** Liste des arbitrages ouverts (écart > seuil), tous employés (§7.3). */
export function computeArbitrages(config = PERF_CONFIG): { employeId: string; objectif: MockObjectif; ecart: number }[] {
  return computeAllEmployes(config).flatMap((e) =>
    e.objectifs.filter((o) => o.arbitrage).map((o) => ({ employeId: e.employeId, objectif: o.objectif, ecart: o.ecart })),
  );
}
