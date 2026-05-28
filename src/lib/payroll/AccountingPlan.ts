/**
 * Plan comptable paramétrable PAR TENANT (annex §B.2, §D point 3).
 * Chaque entreprise a son plan ; ces comptes servent de valeurs par défaut
 * (modifiables à l'onboarding du tenant). Schéma SYSCOHADA révisé.
 */
export interface AccountingPlan {
  gross: string; // 661 — rémunérations directes
  employerSocial: string; // 664 — charges sociales patronales
  employerTaxExpense: string; // 63x — cotisations formation (FDFP/CFCE)
  net: string; // 422 — personnel, rémunérations dues (net à payer)
  social: string; // 431 — sécurité sociale (caisses)
  incomeTax: string; // 447 — État, impôts retenus à la source
  employerTaxLiability: string; // 437 — organismes sociaux (taxes formation)
}

export const DEFAULT_ACCOUNTING_PLAN: AccountingPlan = {
  gross: '661100',
  employerSocial: '664000',
  employerTaxExpense: '637000',
  net: '422000',
  social: '431000',
  incomeTax: '447000',
  employerTaxLiability: '437000',
};
