/**
 * Interface Atlas FNA — déversement des écritures de paie via API directe.
 * Le batch est toujours équilibré (Σ débit = Σ crédit) et porte une clé
 * d'idempotence (annex §B.3 option 1, §B.4).
 */
import type { Currency } from '../money';

export interface FnaJournalLine {
  account: string;
  label: string;
  debit: string; // francs entiers
  credit: string;
}

export interface FnaBatch {
  tenantId: string;
  runId: string;
  period: string;
  currency: Currency;
  /** Clé d'idempotence : un même run ne peut être posté deux fois. */
  idempotencyKey: string;
  lines: FnaJournalLine[];
  totalDebit: string;
  totalCredit: string;
  balanced: boolean;
}

export interface FnaPostResult {
  status: 'posted' | 'duplicate' | 'queued' | 'error';
  reference?: string;
  message?: string;
}
