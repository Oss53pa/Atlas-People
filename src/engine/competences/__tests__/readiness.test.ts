/**
 * Tests du noyau Compétences (M9) — triangulation, écart, readiness, péremption.
 * Déterminisme total : la date du jour est toujours passée explicitement.
 */
import { describe, it, expect } from 'vitest';
import {
  AttentePoste,
  DEFAULT_ECHELLE,
  analyseAccesPoste,
  ecartCompetence,
  evalueCompetence,
  evalueReadiness,
  niveauRetenu,
  pctMaitrise,
  statutPeremption,
} from '../index';

const TODAY = '2026-06-10';

describe('§3 pctMaitrise', () => {
  it('niveau / echelle × 100', () => {
    expect(pctMaitrise(3, DEFAULT_ECHELLE)).toBe(75); // 3/4
    expect(pctMaitrise(4, DEFAULT_ECHELLE)).toBe(100);
    expect(pctMaitrise(0, DEFAULT_ECHELLE)).toBe(0);
  });
  it('refuse une échelle nulle', () => {
    expect(() => pctMaitrise(2, { max: 0 })).toThrow();
  });
});

describe('§5.3 niveauRetenu (R4)', () => {
  it('retient le niveau manager par défaut', () => {
    expect(niveauRetenu({ niveauSelf: 4, niveauManager: 3 })).toBe(3);
  });
  it('retombe sur le self sans contre-évaluation manager', () => {
    expect(niveauRetenu({ niveauSelf: 2 })).toBe(2);
  });
  it('l’override RH prime', () => {
    expect(niveauRetenu({ niveauSelf: 4, niveauManager: 3, niveauRhOverride: 2 })).toBe(2);
  });
  it('0 si aucune voix', () => {
    expect(niveauRetenu({})).toBe(0);
  });
});

describe('§5.5 statutPeremption (R9)', () => {
  it('acquis si niveau > 0, preuve fournie, validité ok', () => {
    expect(statutPeremption(3, TODAY, '2027-01-01', true)).toBe('acquis');
  });
  it('périmé si dateValidite dépassée', () => {
    expect(statutPeremption(4, TODAY, '2026-01-01', true)).toBe('perime');
  });
  it('en_cours sans preuve (une compétence se prouve, R9)', () => {
    expect(statutPeremption(3, TODAY, undefined, false)).toBe('en_cours');
  });
  it('en_cours si niveau nul', () => {
    expect(statutPeremption(0, TODAY)).toBe('en_cours');
  });
});

describe('evalueCompetence', () => {
  it('consolide retenu + statut + %', () => {
    const r = evalueCompetence('c1', { niveauSelf: 4, niveauManager: 3, preuveFournie: true }, DEFAULT_ECHELLE, TODAY);
    expect(r.niveauRetenu).toBe(3);
    expect(r.statut).toBe('acquis');
    expect(r.pctMaitrise).toBe(75);
  });
  it('compétence périmée → maîtrise nulle même si retenu élevé', () => {
    const r = evalueCompetence('c1', { niveauManager: 4, dateValidite: '2025-12-31' }, DEFAULT_ECHELLE, TODAY);
    expect(r.statut).toBe('perime');
    expect(r.pctMaitrise).toBe(0);
  });
});

describe('§5.4 écart & readiness', () => {
  const attentes: AttentePoste[] = [
    { competenceId: 'lead', niveauAttendu: 3, criticite: 3, bloquante: true, libelle: 'Leadership' },
    { competenceId: 'archi', niveauAttendu: 4, criticite: 2, libelle: 'Architecture' },
    { competenceId: 'budget', niveauAttendu: 2, criticite: 1, libelle: 'Gestion budget' },
  ];

  it('écart = attendu − retenu, bloquant si critique sous le niveau', () => {
    const e = ecartCompetence(attentes[0], { competenceId: 'lead', niveauRetenu: 2, statut: 'acquis', pctMaitrise: 50 });
    expect(e.ecart).toBe(1);
    expect(e.bloquant).toBe(true);
  });

  it('prêt : tous les écarts couverts', () => {
    const r = analyseAccesPoste(attentes, [
      { competenceId: 'lead', niveauRetenu: 3, statut: 'acquis', pctMaitrise: 75 },
      { competenceId: 'archi', niveauRetenu: 4, statut: 'acquis', pctMaitrise: 100 },
      { competenceId: 'budget', niveauRetenu: 2, statut: 'acquis', pctMaitrise: 50 },
    ]);
    expect(r.readiness.verdict).toBe('pret');
    expect(r.readiness.scoreCouverture).toBe(100);
    expect(r.readiness.conditions).toHaveLength(0);
  });

  it('prêt sous conditions : écart non bloquant restant', () => {
    const r = analyseAccesPoste(attentes, [
      { competenceId: 'lead', niveauRetenu: 3, statut: 'acquis', pctMaitrise: 75 },
      { competenceId: 'archi', niveauRetenu: 3, statut: 'acquis', pctMaitrise: 75 }, // manque 1 (non bloquant)
      { competenceId: 'budget', niveauRetenu: 2, statut: 'acquis', pctMaitrise: 50 },
    ]);
    expect(r.readiness.verdict).toBe('pret_sous_conditions');
    expect(r.readiness.conditions.map((c) => c.competenceId)).toEqual(['archi']);
  });

  it('pas prêt : écart bloquant (compétence critique)', () => {
    const r = analyseAccesPoste(attentes, [
      { competenceId: 'lead', niveauRetenu: 1, statut: 'acquis', pctMaitrise: 25 }, // critique, manque 2
      { competenceId: 'archi', niveauRetenu: 4, statut: 'acquis', pctMaitrise: 100 },
      { competenceId: 'budget', niveauRetenu: 2, statut: 'acquis', pctMaitrise: 50 },
    ]);
    expect(r.readiness.verdict).toBe('pas_pret');
    expect(r.readiness.conditions.some((c) => c.competenceId === 'lead')).toBe(true);
  });

  it('compétence attendue mais non évaluée → retenu 0', () => {
    const r = analyseAccesPoste(attentes, []);
    expect(r.ecarts.find((e) => e.competenceId === 'lead')?.ecart).toBe(3);
    expect(r.readiness.verdict).toBe('pas_pret'); // lead bloquante non couverte
  });

  it('couverture pondérée par criticité', () => {
    // lead 2/3, archi 4/4, budget 2/2 → (3·2/3 + 2·1 + 1·1)/(3+2+1) = (2+2+1)/6 = 0.833…
    const r = analyseAccesPoste(attentes, [
      { competenceId: 'lead', niveauRetenu: 2, statut: 'acquis', pctMaitrise: 50 },
      { competenceId: 'archi', niveauRetenu: 4, statut: 'acquis', pctMaitrise: 100 },
      { competenceId: 'budget', niveauRetenu: 2, statut: 'acquis', pctMaitrise: 50 },
    ]);
    expect(r.readiness.scoreCouverture).toBeCloseTo(83.333, 2);
  });

  it('readiness sans attentes → prêt (couverture 100)', () => {
    expect(evalueReadiness([]).verdict).toBe('pret');
    expect(evalueReadiness([]).scoreCouverture).toBe(100);
  });
});
