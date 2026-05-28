/**
 * Catalogue de rubriques de paie (M1 §4.1).
 * 100 % configurable pour les rubriques maison ; VERROUILLÉ pour les rubriques
 * légales (is_legal) — fournies par le régime-pays, ni supprimables ni
 * dé-câblables. C'est le garde-fou conformité.
 */
export type SystemType =
  | 'gain'
  | 'social_contribution'
  | 'tax'
  | 'deduction'
  | 'benefit_in_kind'
  | 'employer_contribution';

export type CalcMode = 'fixed' | 'percentage' | 'scale' | 'formula';

export interface PayComponent {
  id: string;
  code: string;
  label: string;
  systemType: SystemType;
  isLegal: boolean;
  calcMode: CalcMode;
  calcBase?: 'base_salary' | 'gross' | 'custom';
  taxable: boolean;
  subjectToSocial: boolean;
  countryCode?: string;
  active: boolean;
}

export const SYSTEM_TYPE_LABEL: Record<SystemType, string> = {
  gain: 'Gain',
  social_contribution: 'Cotisation sociale',
  tax: 'Impôt',
  deduction: 'Retenue',
  benefit_in_kind: 'Avantage en nature',
  employer_contribution: 'Cotisation patronale',
};

export const CALC_MODE_LABEL: Record<CalcMode, string> = {
  fixed: 'Montant fixe',
  percentage: 'Pourcentage',
  scale: 'Barème',
  formula: 'Formule',
};

// Catalogue de démonstration (Côte d'Ivoire) : légales + maison.
export const DEFAULT_PAY_COMPONENTS: PayComponent[] = [
  // --- Légales (verrouillées) ---
  { id: 'pc1', code: 'CNPS_RET', label: 'CNPS — Retraite', systemType: 'social_contribution', isLegal: true, calcMode: 'percentage', calcBase: 'gross', taxable: false, subjectToSocial: true, countryCode: 'CI', active: true },
  { id: 'pc2', code: 'CNPS_PF', label: 'CNPS — Prestations familiales', systemType: 'employer_contribution', isLegal: true, calcMode: 'percentage', calcBase: 'gross', taxable: false, subjectToSocial: true, countryCode: 'CI', active: true },
  { id: 'pc3', code: 'IGR', label: 'Impôt IGR / IRPP', systemType: 'tax', isLegal: true, calcMode: 'scale', calcBase: 'custom', taxable: false, subjectToSocial: false, countryCode: 'CI', active: true },
  { id: 'pc4', code: 'FDFP_TA', label: "FDFP — Taxe d'apprentissage", systemType: 'employer_contribution', isLegal: true, calcMode: 'percentage', calcBase: 'gross', taxable: false, subjectToSocial: false, countryCode: 'CI', active: true },
  // --- Maison (100 % configurables) ---
  { id: 'pc5', code: 'PRIME_TRANSPORT', label: 'Prime de transport', systemType: 'gain', isLegal: false, calcMode: 'fixed', calcBase: 'custom', taxable: false, subjectToSocial: false, active: true },
  { id: 'pc6', code: 'PRIME_PANIER', label: 'Prime de panier', systemType: 'gain', isLegal: false, calcMode: 'fixed', calcBase: 'custom', taxable: true, subjectToSocial: true, active: true },
  { id: 'pc7', code: 'PRIME_RENDEMENT', label: 'Prime de rendement', systemType: 'gain', isLegal: false, calcMode: 'percentage', calcBase: 'base_salary', taxable: true, subjectToSocial: true, active: true },
  { id: 'pc8', code: 'IND_LOGEMENT', label: 'Indemnité de logement', systemType: 'benefit_in_kind', isLegal: false, calcMode: 'fixed', calcBase: 'custom', taxable: true, subjectToSocial: true, active: true },
];

export const canDelete = (c: PayComponent) => !c.isLegal;
export const canDisable = (c: PayComponent) => !c.isLegal;
