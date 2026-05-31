/**
 * M3 PAIE — accès au catalogue de rubriques pour la saisie d'un bulletin.
 * On expose les rubriques SÉLECTIONNABLES manuellement (gains & retenues).
 * Les cotisations sociales & impôts (type cotisation_*) et lignes d'info sont
 * dérivés par le moteur déterministe — verrouillés, jamais ajoutés à la main
 * (principe « is_legal lock » : le calcul légal n'est jamais saisi).
 */
import { RUBRIQUES_CI, type Rubrique } from './referentiels';
import type { RubriqueCalc } from './types';

const matchesCountry = (r: Rubrique, countryCode: string) =>
  r.pays === 'ALL' || r.pays.split(',').includes(countryCode);

/** Rubriques que le gestionnaire peut ajouter au bulletin (gains + retenues). */
export function pickableRubriques(countryCode: string): Rubrique[] {
  return RUBRIQUES_CI.filter(
    (r) => (r.type === 'gain' || r.type === 'retenue') && r.status === 'published' && matchesCountry(r, countryCode),
  );
}

/** Rubriques verrouillées (calculées automatiquement par le moteur) — pour info UI. */
export function lockedRubriques(countryCode: string): Rubrique[] {
  return RUBRIQUES_CI.filter(
    (r) => (r.type === 'cotisation_emp' || r.type === 'cotisation_pat') && matchesCountry(r, countryCode),
  );
}

const round = (n: number) => Math.round(n);

/** Montant résolu d'une rubrique selon son mode de calcul. */
export function resolveRubriqueAmount(calc: RubriqueCalc, fixedAmount: number): number {
  switch (calc.mode) {
    case 'base_rate':
      return round(((calc.base ?? 0) * (calc.rate ?? 0)) / 100);
    case 'qty_rate':
      return round((calc.qty ?? 0) * (calc.unit ?? 0));
    case 'fixed':
    default:
      return round(fixedAmount);
  }
}

/** Libellé court du mode de calcul (sous-titre d'affichage). */
export function describeCalc(calc: RubriqueCalc | undefined, fmt: (n: number) => string): string {
  if (!calc || calc.mode === 'fixed') return 'montant saisi';
  if (calc.mode === 'base_rate') return `${calc.rate ?? 0} % × ${fmt(calc.base ?? 0)}`;
  return `${calc.qty ?? 0} × ${fmt(calc.unit ?? 0)}`;
}
