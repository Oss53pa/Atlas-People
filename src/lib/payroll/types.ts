/**
 * Types du moteur de paie multi-pays.
 *
 * Un RÉGIME = un module de configuration paie versionné (cahier §3.3).
 * Les taux/assiettes/plafonds/barèmes vivent ici, JAMAIS dans le moteur.
 * La veille réglementaire met à jour ces configs sans toucher au calcul.
 *
 * ⚠️ Les valeurs ci-dessous (cnps_ci.ts, ipres_sn.ts) sont des configurations
 *    de démonstration réalistes ; elles doivent être validées par la veille
 *    réglementaire avant tout usage en production.
 */

import type { Currency } from '../money';

export type Zone = 'UEMOA' | 'CEMAC';

/** Assiette d'une cotisation. */
export type ContributionBase = 'gross' | 'capped';

export interface Contribution {
  code: string;
  label: string;
  base: ContributionBase;
  /** Plafond mensuel en francs (si base = 'capped'). */
  ceiling?: number;
  /** Part salariale en points de base (1 % = 100 bps). */
  employeeBps: number;
  /** Part patronale en points de base. */
  employerBps: number;
  /** Comptes SYSCOHADA pour le mapping comptable. */
  accounts: { employee?: string; employer?: string };
}

/** Tranche d'un barème d'impôt progressif (mensuel, marginal). */
export interface TaxBracket {
  /** Plafond de la tranche en francs ; null = tranche supérieure. */
  upTo: number | null;
  /** Taux marginal en points de base. */
  bps: number;
}

export interface IncomeTax {
  code: string;
  label: string;
  /** Abattement forfaitaire sur le revenu imposable, en bps (ex : frais pro). */
  abatementBps?: number;
  brackets: TaxBracket[];
}

/** Taxe purement patronale assise sur la masse salariale (FDFP, etc.). */
export interface EmployerTax {
  code: string;
  label: string;
  bps: number;
  account: string;
}

export interface Regime {
  countryCode: string; // ISO-2
  countryName: string;
  zone: Zone;
  currency: Currency;
  socialFund: string;
  /** Version de la config (traçabilité veille réglementaire). */
  version: string;
  effectiveFrom: string; // ISO date
  contributions: Contribution[];
  incomeTax: IncomeTax;
  employerTaxes: EmployerTax[];
}

/** Retenue diverse : avance, prêt, saisie-arrêt, opposition (annex §A.2 étape 6). */
export interface OtherDeduction {
  code: string;
  label: string;
  amount: number; // francs entiers
  /** Compte SYSCOHADA de contrepartie (421 avances, 427 oppositions/saisies). */
  account: string;
}

/** Entrée de paie pour un collaborateur sur une période. */
export interface PayrollInput {
  baseSalary: number; // salaire de base mensuel (francs)
  /** Primes imposables (rendement, ancienneté, heures sup., avantages imposables…). */
  taxableAllowances?: number;
  /** Indemnités non imposables jusqu'à plafond (transport, etc.). */
  nonTaxableAllowances?: number;
  /** Nombre de parts fiscales (quotient familial), défaut 1. */
  fiscalParts?: number;
  /** Retenues diverses appliquées après impôt (avances, prêts, oppositions). */
  otherDeductions?: OtherDeduction[];
}

export interface PayslipLine {
  code: string;
  label: string;
  kind: 'earning' | 'employee_contribution' | 'tax' | 'deduction' | 'employer_contribution' | 'employer_tax';
  /** Base de calcul (francs). */
  baseUnits: string;
  /** Taux appliqué en bps (le cas échéant). */
  rateBps?: number;
  /** Montant (francs, signé du point de vue salarié). */
  amountUnits: string;
  /** Compte SYSCOHADA de contrepartie (retenues diverses). */
  account?: string;
}

export interface PayslipResult {
  currency: Currency;
  regimeVersion: string;
  countryCode: string;
  lines: PayslipLine[];
  /** Brut imposable. */
  grossTaxableUnits: string;
  /** Brut total (imposable + non imposable). */
  grossTotalUnits: string;
  totalEmployeeContributionUnits: string;
  incomeTaxUnits: string;
  /** Total des retenues diverses (avances, oppositions…). */
  totalOtherDeductionsUnits: string;
  /** Net à payer au salarié. */
  netToPayUnits: string;
  totalEmployerContributionUnits: string;
  totalEmployerTaxUnits: string;
  /** Coût total employeur (brut + charges patronales). */
  employerCostUnits: string;
}
