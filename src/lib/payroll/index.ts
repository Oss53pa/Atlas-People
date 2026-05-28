import { PayrollEngine } from './PayrollEngine';
import { PayrollVerifier, type VerificationResult } from './PayrollVerifier';
import { AccountingMapper, type JournalEntry } from './AccountingMapper';
import { DEFAULT_ACCOUNTING_PLAN, type AccountingPlan } from './AccountingPlan';
import type { PayrollInput, PayslipResult, Regime } from './types';

export * from './types';
export { PayrollEngine } from './PayrollEngine';
export { PayrollVerifier } from './PayrollVerifier';
export { AccountingMapper } from './AccountingMapper';
export { DEFAULT_ACCOUNTING_PLAN, type AccountingPlan } from './AccountingPlan';
export { getRegime, REGIMES, REGIME_CI, REGIME_SN } from './regimes';

export interface PayslipComputation {
  result: PayslipResult;
  verification: VerificationResult;
  accounting: JournalEntry;
  /** Émission autorisée uniquement si la double vérification passe. */
  emissionBlocked: boolean;
}

/**
 * Calcule un bulletin avec double vérification obligatoire.
 * Si le vérificateur indépendant détecte un écart, l'émission est BLOQUÉE.
 */
export function computePayslip(
  input: PayrollInput,
  regime: Regime,
  employeeLabel = 'Collaborateur',
  plan: AccountingPlan = DEFAULT_ACCOUNTING_PLAN,
): PayslipComputation {
  const result = PayrollEngine.run(input, regime);
  const verification = PayrollVerifier.verify(input, regime, result);
  const accounting = AccountingMapper.fromPayslip(result, employeeLabel, plan);

  return {
    result,
    verification,
    accounting,
    emissionBlocked: !verification.ok || !accounting.balanced,
  };
}
