/**
 * M3 PAIE — types du module back-office paie.
 * Les montants sont des francs entiers (Money). Le moteur réutilise le coeur
 * déterministe lib/payroll (computePayslip + getRegime) — aucun calcul LLM.
 */
import type { Currency } from '../money';

export type SaisieStatus = 'to_seize' | 'prefilled' | 'seized' | 'anomaly' | 'locked';

export type CyclePhase =
  | 'open' | 'preparation' | 'calculation' | 'validation' | 'diffusion' | 'payment' | 'closed';

/** Mode de calcul d'une rubrique saisie (sinon montant fixe manuel). */
export type RubriqueCalcMode = 'fixed' | 'base_rate' | 'qty_rate';
export interface RubriqueCalc {
  mode: RubriqueCalcMode;
  base?: number;   // base_rate : base de calcul (FCFA)
  rate?: number;   // base_rate : taux %
  qty?: number;    // qty_rate : quantité
  unit?: number;   // qty_rate : montant unitaire (FCFA)
}

export interface PrimePonctuelle {
  code: string;
  label: string;
  amount: number;      // francs (montant résolu)
  taxable: boolean;    // soumis IRPP + CNPS
  baseCnps?: boolean;  // soumis CNPS (issu du catalogue)
  source?: 'mss' | 'manual' | 'catalogue';
  rubriqueCode?: string; // code rubrique catalogue (référence)
  calc?: RubriqueCalc;   // mode de calcul (absent = montant fixe saisi)
  recurring?: boolean;   // appartient au modèle du salarié (chaque mois)
}

export interface RetenueExceptionnelle {
  code: string;
  label: string;
  amount: number;
  account?: string;
  rubriqueCode?: string;
  calc?: RubriqueCalc;
  recurring?: boolean;
}

/** Modèle de paie du salarié : rubriques récurrentes ré-appliquées chaque cycle. */
export interface RubriqueModel {
  primes: PrimePonctuelle[];
  retenues: RetenueExceptionnelle[];
}

export interface NdfLine {
  ref: string;
  label: string;
  amount: number;
  taxable: boolean;    // au-delà des plafonds = réintégré
}

/** Variables du mois saisies pour un collaborateur (cf. doc 04, 9 onglets). */
export interface PayrollVariables {
  joursOuvrables: number;
  joursTravailles: number;
  applyProrata: boolean;
  hs15: number;        // heures sup. 15 %
  hs50: number;        // heures sup. 50 %
  primes: PrimePonctuelle[];
  retenues: RetenueExceptionnelle[];
  ndf: NdfLine[];
  avance: number;      // avance à déduire ce mois
  notes: string;
}

export interface BulletinRow {
  code: string;
  label: string;
  base?: number;
  taux?: number;       // en %
  montant: number;     // signé (négatif = retenue) pour cotisations/retenues
}

/** Bulletin recalculé en temps réel (sidebar droite de la saisie). */
export interface BulletinViewer {
  currency: Currency;
  proRataPct: number;
  gains: BulletinRow[];
  cotisationsEmp: BulletinRow[];
  retenues: BulletinRow[];
  patronal: BulletinRow[];
  brutTotal: number;
  baseCnps: number;
  baseIrpp: number;
  totalCotisationsEmp: number;
  totalRetenues: number;
  netAPayer: number;
  totalPatronal: number;
  coutEmployeur: number;
  /** Anomalies temps réel (doc 04 §4.5). */
  anomalies: BulletinAnomaly[];
  emissionBlocked: boolean;
}

export interface BulletinAnomaly {
  severity: 'info' | 'warn' | 'danger';
  code: string;
  message: string;
  blocking: boolean;
}
