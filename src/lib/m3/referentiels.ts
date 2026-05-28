/**
 * M3 PAIE — catalogue de référentiels (démo CI).
 * Rubriques, barèmes (IRPP 8 tranches, CNPS, FDFP), conventions, profils.
 * Versionné, lecture seule côté UI démo. Source : doc 02 référentiels.
 */

export type RubriqueType = 'gain' | 'retenue' | 'cotisation_emp' | 'cotisation_pat' | 'info';

export interface Rubrique {
  code: string;
  libelle: string;
  category: string;
  type: RubriqueType;
  pays: string;            // 'ALL' | 'CI' | 'CI,SN' ...
  version: number;
  baseCnps: boolean;
  baseIrpp: boolean;
  status: 'published' | 'draft';
}

export const RUBRIQUES_CI: Rubrique[] = [
  { code: 'R001_SAL_BASE', libelle: 'Salaire de base', category: 'GAIN-BASE', type: 'gain', pays: 'ALL', version: 3, baseCnps: true, baseIrpp: true, status: 'published' },
  { code: 'R010_PRIME_ANC', libelle: 'Prime d\'ancienneté', category: 'GAIN-ANCIENNETE', type: 'gain', pays: 'CI,SN', version: 2, baseCnps: true, baseIrpp: true, status: 'published' },
  { code: 'R030_HS_15', libelle: 'Heures sup. 15 %', category: 'GAIN-HEURES-SUP', type: 'gain', pays: 'CI', version: 4, baseCnps: true, baseIrpp: true, status: 'published' },
  { code: 'R031_HS_50', libelle: 'Heures sup. 50 %', category: 'GAIN-HEURES-SUP', type: 'gain', pays: 'CI', version: 4, baseCnps: true, baseIrpp: true, status: 'published' },
  { code: 'R050_IND_LOG', libelle: 'Indemnité de logement', category: 'GAIN-LOGEMENT', type: 'gain', pays: 'ALL', version: 2, baseCnps: false, baseIrpp: true, status: 'published' },
  { code: 'R051_IND_TRANSP', libelle: 'Indemnité de transport', category: 'GAIN-TRANSPORT', type: 'gain', pays: 'ALL', version: 2, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'R060_PRIME_FONCTION', libelle: 'Prime de fonction', category: 'GAIN-FONCTION', type: 'gain', pays: 'ALL', version: 1, baseCnps: true, baseIrpp: true, status: 'published' },
  { code: 'R070_PRIME_EXCEPT', libelle: 'Prime exceptionnelle', category: 'GAIN-EXCEPTIONNELS', type: 'gain', pays: 'ALL', version: 1, baseCnps: true, baseIrpp: true, status: 'published' },
  { code: 'R078_13E_MOIS', libelle: 'Prime de fin d\'année / 13e mois', category: 'GAIN-EXCEPTIONNELS', type: 'gain', pays: 'ALL', version: 1, baseCnps: true, baseIrpp: true, status: 'published' },
  { code: 'R200_REMB_FRAIS', libelle: 'Remboursement frais professionnels', category: 'GAIN-REMBOURSEMENT', type: 'gain', pays: 'ALL', version: 1, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'C100_CNPS_RG_EMP', libelle: 'CNPS Régime Général (part employé)', category: 'COTISATION-EMP', type: 'cotisation_emp', pays: 'CI', version: 5, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'C200_IRPP_CI', libelle: 'IRPP / IGR', category: 'COTISATION-EMP', type: 'cotisation_emp', pays: 'CI', version: 7, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'C100_CNPS_RG_PAT', libelle: 'CNPS Régime Général (part patronale)', category: 'COTISATION-PAT', type: 'cotisation_pat', pays: 'CI', version: 5, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'C110_CNPS_PF_PAT', libelle: 'CNPS Prestations familiales (patron.)', category: 'COTISATION-PAT', type: 'cotisation_pat', pays: 'CI', version: 3, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'C120_CNPS_AT_PAT', libelle: 'CNPS Accident du travail (patron.)', category: 'COTISATION-PAT', type: 'cotisation_pat', pays: 'CI', version: 3, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'C300_FDFP_TA', libelle: 'FDFP — Taxe d\'apprentissage', category: 'COTISATION-PAT', type: 'cotisation_pat', pays: 'CI', version: 3, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'C310_FDFP_FC', libelle: 'FDFP — Formation continue', category: 'COTISATION-PAT', type: 'cotisation_pat', pays: 'CI', version: 3, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'X100_MUTUELLE', libelle: 'Mutuelle santé', category: 'RETENUE-AUTRES', type: 'retenue', pays: 'ALL', version: 1, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'X200_PRET', libelle: 'Prêt employeur', category: 'RETENUE-AVANCE', type: 'retenue', pays: 'ALL', version: 1, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'X300_AVANCE', libelle: 'Avance sur salaire', category: 'RETENUE-AVANCE', type: 'retenue', pays: 'ALL', version: 1, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'I900_BRUT', libelle: 'Brut total (info)', category: 'INFO', type: 'info', pays: 'ALL', version: 1, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'I910_NET_IMPOSABLE', libelle: 'Net imposable (info)', category: 'INFO', type: 'info', pays: 'ALL', version: 1, baseCnps: false, baseIrpp: false, status: 'published' },
  { code: 'I920_NET_A_PAYER', libelle: 'Net à payer (info)', category: 'INFO', type: 'info', pays: 'ALL', version: 1, baseCnps: false, baseIrpp: false, status: 'published' },
];

export interface BaremeTranche { min: number; max: number | null; taux: number }
export interface Bareme {
  code: string; libelle: string; pays: string; type: 'progressif' | 'valeur' | 'tranches';
  version: string; unit: string;
  value?: number; tranches?: BaremeTranche[];
  reference?: string;
}

export const BAREMES_CI: Bareme[] = [
  {
    code: 'IRPP_CI', libelle: 'Barème IRPP Côte d\'Ivoire', pays: 'CI', type: 'progressif', version: '2026.01', unit: '%',
    reference: 'CGI CI — barème progressif annuel par parts',
    tranches: [
      { min: 0, max: 600_000, taux: 0 },
      { min: 600_001, max: 1_560_000, taux: 1.5 },
      { min: 1_560_001, max: 2_400_000, taux: 5 },
      { min: 2_400_001, max: 3_600_000, taux: 10 },
      { min: 3_600_001, max: 4_800_000, taux: 15 },
      { min: 4_800_001, max: 6_000_000, taux: 20 },
      { min: 6_000_001, max: 9_600_000, taux: 25 },
      { min: 9_600_001, max: null, taux: 35 },
    ],
  },
  { code: 'PLAFOND_CNPS_RG_CI', libelle: 'Plafond CNPS Régime Général', pays: 'CI', type: 'valeur', version: '2024.01', unit: 'FCFA/mois', value: 1_647_315, reference: 'CNPS CI' },
  { code: 'TAUX_CNPS_RG_EMP_CI', libelle: 'Taux CNPS RG part employé', pays: 'CI', type: 'valeur', version: '2024.01', unit: '%', value: 6.3 },
  { code: 'TAUX_CNPS_RG_PAT_CI', libelle: 'Taux CNPS RG part patronale', pays: 'CI', type: 'valeur', version: '2024.01', unit: '%', value: 7.7 },
  { code: 'TAUX_CNPS_PF_CI', libelle: 'Taux CNPS Prestations familiales', pays: 'CI', type: 'valeur', version: '2024.01', unit: '%', value: 5.75 },
  { code: 'TAUX_CNPS_AT_CI', libelle: 'Taux CNPS Accident travail (moyen)', pays: 'CI', type: 'valeur', version: '2024.01', unit: '%', value: 2 },
  { code: 'FDFP_TA_CI', libelle: 'FDFP Taxe apprentissage', pays: 'CI', type: 'valeur', version: '2024.01', unit: '%', value: 0.4 },
  { code: 'FDFP_FC_CI', libelle: 'FDFP Formation continue', pays: 'CI', type: 'valeur', version: '2024.01', unit: '%', value: 1.2 },
  {
    code: 'PRIME_ANCIENNETE_CCN1', libelle: 'Prime ancienneté CCN Commerce', pays: 'CI', type: 'tranches', version: '2023.01', unit: '%',
    reference: 'CCN Commerce CI',
    tranches: [
      { min: 0, max: 2, taux: 0 }, { min: 2, max: 5, taux: 2 }, { min: 5, max: 10, taux: 5 },
      { min: 10, max: 15, taux: 10 }, { min: 15, max: 20, taux: 15 }, { min: 20, max: 25, taux: 20 }, { min: 25, max: null, taux: 25 },
    ],
  },
];

export interface ConventionRef { code: string; libelle: string; pays: string; secteur: string; version: number }
export const CONVENTIONS_CI: ConventionRef[] = [
  { code: 'CCN_COMMERCE_CI', libelle: 'CCN Commerce Côte d\'Ivoire', pays: 'CI', secteur: 'Commerce', version: 2 },
  { code: 'CCN_INDUSTRIE_CI', libelle: 'CCN Industrie Côte d\'Ivoire', pays: 'CI', secteur: 'Industrie', version: 1 },
  { code: 'CCN_BANQUE_CI', libelle: 'CCN Banques & établissements financiers', pays: 'CI', secteur: 'Banque', version: 1 },
];

export interface ProfilRef { code: string; libelle: string; pays: string; convention: string; population: number }
export const PROFILS_CI: ProfilRef[] = [
  { code: 'PRO_CADRE_B_CI', libelle: 'Cadre B — CCN Commerce CI', pays: 'CI', convention: 'CCN_COMMERCE_CI', population: 4 },
  { code: 'PRO_EMPLOYE_CI', libelle: 'Employé administratif CI', pays: 'CI', convention: 'CCN_COMMERCE_CI', population: 6 },
  { code: 'PRO_OUVRIER_CI', libelle: 'Ouvrier CCN Commerce CI', pays: 'CI', convention: 'CCN_COMMERCE_CI', population: 2 },
  { code: 'PRO_EXPAT_CI', libelle: 'Expatrié CI', pays: 'CI', convention: 'CCN_COMMERCE_CI', population: 0 },
];

export interface SocieteRef { code: string; raison: string; pays: string; rccm: string; effectif: number; status: 'active' | 'pre_prod' }
export const SOCIETES: SocieteRef[] = [
  { code: 'AP-CI', raison: 'Atlas Studio CI SARL', pays: 'CI', rccm: 'CI-ABJ-2018-B-12345', effectif: 14, status: 'active' },
  { code: 'AP-SN', raison: 'Atlas Studio Sénégal SUARL', pays: 'SN', rccm: 'SN-DKR-2025-B-00789', effectif: 0, status: 'pre_prod' },
];
