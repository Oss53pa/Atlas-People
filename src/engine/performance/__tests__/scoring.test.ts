/**
 * Tests du moteur Performance — formules d'atteinte & de score (CDC §6).
 * Règle : déterminisme total, aucune horloge, aucun float monétaire.
 * On vérifie chaque formule de la note de cadrage §4 et ses garde-fous (R1–R5).
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NOTATION_CONFIG,
  NotationConfig,
  aggregeContinue,
  aggregeOneShot,
  arbitrageRequis,
  atteinteObjectifAnnuel,
  atteinteObjectifMois,
  atteinteObjectifSemestre,
  ecartCouches,
  pctNotation,
  pctRealisation,
  remonteeDepartement,
  remonteeGlobale,
  scoreEmploye,
  weightedMean,
} from '../index';

const cfg = (over: Partial<NotationConfig> = {}): NotationConfig => ({
  ...DEFAULT_NOTATION_CONFIG,
  ...over,
});

describe('weightedMean', () => {
  it('calcule une moyenne pondérée', () => {
    expect(weightedMean([{ poids: 60, valeur: 100 }, { poids: 40, valeur: 50 }])).toBe(80);
  });
  it('retourne 0 si la somme des poids est nulle (neutre, jamais NaN)', () => {
    expect(weightedMean([])).toBe(0);
    expect(weightedMean([{ poids: 0, valeur: 100 }])).toBe(0);
  });
});

describe('§6.1 pctNotation', () => {
  it('convertit une note /5 en pourcentage', () => {
    expect(pctNotation(4, 5)).toBe(80);
  });
  it('convertit une note /20', () => {
    expect(pctNotation(15, 20)).toBe(75);
  });
  it('borne à 100 si la note dépasse l’échelle', () => {
    expect(pctNotation(6, 5)).toBe(100);
  });
  it('borne à 0 pour une note négative', () => {
    expect(pctNotation(-1, 5)).toBe(0);
  });
  it('refuse une échelle nulle ou négative', () => {
    expect(() => pctNotation(3, 0)).toThrow();
  });
});

describe('§6.2 pctRealisation — quantitatif', () => {
  it('résultat = cible → 100 %', () => {
    expect(pctRealisation({ typeMesure: 'quantitatif', resultat: 50, cible: 50 }, cfg())).toBe(100);
  });
  it('sous-atteinte proportionnelle', () => {
    expect(pctRealisation({ typeMesure: 'quantitatif', resultat: 30, cible: 50 }, cfg())).toBe(60);
  });
  it('plafonne au cap de dépassement par défaut (100)', () => {
    expect(pctRealisation({ typeMesure: 'quantitatif', resultat: 80, cible: 50 }, cfg())).toBe(100);
  });
  it('valorise le sur-résultat si cap = 120', () => {
    const c = cfg({ capDepassement: 120 });
    expect(pctRealisation({ typeMesure: 'quantitatif', resultat: 65, cible: 50 }, c)).toBe(120);
    expect(pctRealisation({ typeMesure: 'quantitatif', resultat: 55, cible: 50 }, c)).toBeCloseTo(110, 10);
  });
  it('borne à 0 pour un résultat négatif', () => {
    expect(pctRealisation({ typeMesure: 'quantitatif', resultat: -10, cible: 50 }, cfg())).toBe(0);
  });
  it('refuse une cible nulle (division impossible)', () => {
    expect(() => pctRealisation({ typeMesure: 'quantitatif', resultat: 10, cible: 0 }, cfg())).toThrow();
  });
});

describe('§6.2 pctRealisation — qualitatif', () => {
  it('note /100 directe', () => {
    expect(pctRealisation({ typeMesure: 'qualitatif', note: 85 }, cfg())).toBe(85);
  });
  it('note sur échelle /10', () => {
    expect(pctRealisation({ typeMesure: 'qualitatif', note: 7 }, cfg({ echelleMax: 10 }))).toBe(70);
  });
});

describe('§6.3 agrégation temporelle', () => {
  it('one_shot : valeur figée acquise', () => {
    expect(aggregeOneShot(92)).toBe(92);
  });
  it('continue moyenne : moyenne des mois actifs', () => {
    const mois = [
      { mois: '2026-01-01', pctReal: 60, actif: true },
      { mois: '2026-02-01', pctReal: 80, actif: true },
      { mois: '2026-03-01', pctReal: 100, actif: false }, // ignoré
    ];
    expect(aggregeContinue(mois, 'moyenne')).toBe(70);
  });
  it('continue moyenne_ponderee : pondération mensuelle (saisonnalité)', () => {
    const mois = [
      { mois: '2026-06-01', pctReal: 50, poidsMois: 1, actif: true },
      { mois: '2026-12-01', pctReal: 100, poidsMois: 3, actif: true },
    ];
    expect(aggregeContinue(mois, 'moyenne_ponderee')).toBe(87.5);
  });
  it('aucun mois actif → 0', () => {
    expect(aggregeContinue([{ mois: '2026-01-01', pctReal: 90, actif: false }], 'moyenne')).toBe(0);
  });
});

describe('§6.4 atteinte des objectifs', () => {
  it('mensuel : renormalisé sur les actions actives', () => {
    // action B inactive ce mois : seule A compte → 100 % de A
    const actions = [
      { poidsAction: 70, pctReal: 90, actifMois: true },
      { poidsAction: 30, pctReal: 0, actifMois: false },
    ];
    expect(atteinteObjectifMois(actions)).toBe(90);
  });
  it('mensuel : moyenne pondérée des actions actives', () => {
    const actions = [
      { poidsAction: 50, pctReal: 80, actifMois: true },
      { poidsAction: 50, pctReal: 60, actifMois: true },
    ];
    expect(atteinteObjectifMois(actions)).toBe(70);
  });
  it('semestriel : Σ(poids·pct) avec Σ poids = 100', () => {
    const actions = [
      { poidsAction: 60, pctReal: 90 },
      { poidsAction: 40, pctReal: 70 },
    ];
    expect(atteinteObjectifSemestre(actions)).toBeCloseTo(82, 10);
  });
  it('annuel : pondération des semestres (défaut 50/50)', () => {
    expect(atteinteObjectifAnnuel(80, 60, { s1: 50, s2: 50 })).toBe(70);
  });
  it('annuel : pondération asymétrique 40/60', () => {
    expect(atteinteObjectifAnnuel(80, 60, { s1: 40, s2: 60 })).toBeCloseTo(68, 10);
  });
});

describe('§6.5 score employé', () => {
  it('α = 1 → 100 % individuel, le collectif n’influe pas', () => {
    const objs = [
      { poidsObj: 100, pctAnnuel: 90, estCollectif: false },
      { poidsObj: 100, pctAnnuel: 10, estCollectif: true },
    ];
    const r = scoreEmploye(objs, cfg({ alphaCollectif: 1 }));
    expect(r.scoreIndividuel).toBe(90);
    expect(r.scoreCollectif).toBe(10);
    expect(r.scoreEmploye).toBe(90);
  });
  it('α = 0.7 → mélange individuel/collectif', () => {
    const objs = [
      { poidsObj: 100, pctAnnuel: 80, estCollectif: false },
      { poidsObj: 100, pctAnnuel: 50, estCollectif: true },
    ];
    const r = scoreEmploye(objs, cfg({ alphaCollectif: 0.7 }));
    // 0.7×80 + 0.3×50 = 71
    expect(r.scoreEmploye).toBeCloseTo(71, 10);
  });
  it('sans objectif collectif, score = part individuelle quel que soit α', () => {
    const objs = [{ poidsObj: 100, pctAnnuel: 88, estCollectif: false }];
    expect(scoreEmploye(objs, cfg({ alphaCollectif: 0.5 })).scoreEmploye).toBe(88);
  });
  it('moyenne pondérée des objectifs individuels par leur poids', () => {
    const objs = [
      { poidsObj: 70, pctAnnuel: 100, estCollectif: false },
      { poidsObj: 30, pctAnnuel: 50, estCollectif: false },
    ];
    expect(scoreEmploye(objs, cfg()).scoreIndividuel).toBe(85);
  });
});

describe('§6.6 remontée consolidée', () => {
  it('département : moyenne pondérée par le poids de contribution', () => {
    const contribs = [
      { poidsContribution: 2, pctEmployeValide: 90 },
      { poidsContribution: 1, pctEmployeValide: 60 },
    ];
    // (2×90 + 1×60) / 3 = 80
    expect(remonteeDepartement(contribs)).toBe(80);
  });
  it('global : Σ(poids_dept · pct_dept) avec Σ poids = 100', () => {
    const depts = [
      { poidsDepartement: 60, pctDepartement: 80 },
      { poidsDepartement: 40, pctDepartement: 90 },
    ];
    expect(remonteeGlobale(depts)).toBeCloseTo(84, 10);
  });
});

describe('§4.6 / §7.3 arbitrage des écarts', () => {
  it('écart = |auto − valide|', () => {
    expect(ecartCouches(85, 60)).toBe(25);
    expect(ecartCouches(60, 85)).toBe(25);
  });
  it('ouvre un arbitrage si écart > seuil', () => {
    expect(arbitrageRequis(85, 60, cfg({ seuilArbitrage: 20 }))).toBe(true);
  });
  it('pas d’arbitrage si écart = seuil (strictement supérieur)', () => {
    expect(arbitrageRequis(80, 60, cfg({ seuilArbitrage: 20 }))).toBe(false);
  });
  it('pas d’arbitrage sous le seuil', () => {
    expect(arbitrageRequis(75, 65, cfg({ seuilArbitrage: 20 }))).toBe(false);
  });
});

describe('chaîne de bout en bout : action → objectif → score → remontée', () => {
  it('couche validée remonte (R4) et reste l’officielle', () => {
    const config = cfg({ capDepassement: 120, alphaCollectif: 0.8 });

    // Objectif individuel : 2 actions quantitatives, S1 et S2.
    const a1S1 = pctRealisation({ typeMesure: 'quantitatif', resultat: 55, cible: 50 }, config); // 110
    const a2S1 = pctRealisation({ typeMesure: 'qualitatif', note: 80 }, config); // 80
    const objIndS1 = atteinteObjectifSemestre([
      { poidsAction: 50, pctReal: a1S1 },
      { poidsAction: 50, pctReal: a2S1 },
    ]); // 95
    const objIndS2 = 85;
    const objIndAnnuel = atteinteObjectifAnnuel(objIndS1, objIndS2, config.ponderationSemestres); // 90

    const objColAnnuel = 70;

    const score = scoreEmploye(
      [
        { poidsObj: 100, pctAnnuel: objIndAnnuel, estCollectif: false },
        { poidsObj: 100, pctAnnuel: objColAnnuel, estCollectif: true },
      ],
      config,
    );
    // 0.8×90 + 0.2×70 = 86
    expect(score.scoreEmploye).toBeCloseTo(86, 10);

    // Remontée département : cet employé (poids 2) + un pair validé à 76 (poids 1).
    const dept = remonteeDepartement([
      { poidsContribution: 2, pctEmployeValide: score.scoreEmploye },
      { poidsContribution: 1, pctEmployeValide: 76 },
    ]);
    // (2×86 + 1×76) / 3 = 82.666…
    expect(dept).toBeCloseTo(82.6667, 3);
  });
});
