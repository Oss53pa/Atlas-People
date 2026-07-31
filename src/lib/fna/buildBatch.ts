/**
 * Construit un lot d'écritures FNA consolidé au niveau d'une campagne de paie,
 * à partir des bulletins calculés (agrégation déterministe par compte).
 * Utilisé pour la prévisualisation côté front ; le déversement réel est
 * effectué par l'Edge Function `post-to-fna` qui relit les écritures persistées
 * (`payroll_accounting_entries` + `_lines`, produites par la RPC
 * `atlas_people.generate_cycle_accounting_entry` — cf. migration 0057).
 *
 * L'agrégation par compte est déléguée à `AccountingMapper.aggregate` : le lot
 * envoyé à FNA et l'OD affichée à l'écran sortent ainsi du MÊME code. Ce fichier
 * ne fait plus que l'habillage transport (clé d'idempotence, période, devise).
 */
import { AccountingMapper } from '../payroll/AccountingMapper';
import type { JournalEntry } from '../payroll/AccountingMapper';
import type { FnaBatch, FnaJournalLine } from './types';

export function buildFnaBatch(params: {
  tenantId: string;
  /** Identifiant de la campagne de paie (cycle_id — cf. arbitrage migration 0057). */
  runId: string;
  period: string;
  currency: 'XOF' | 'XAF';
  entries: JournalEntry[]; // une écriture par bulletin
}): FnaBatch {
  const { tenantId, runId, period, currency, entries } = params;

  const od = AccountingMapper.aggregate(entries, currency);

  const lines: FnaJournalLine[] = od.lines.map((l) => ({
    account: l.account,
    label: l.label,
    debit: l.debitUnits,
    credit: l.creditUnits,
  }));

  return {
    tenantId,
    runId,
    period,
    currency,
    idempotencyKey: `${tenantId}:${runId}`,
    lines,
    totalDebit: od.totalDebitUnits,
    totalCredit: od.totalCreditUnits,
    balanced: od.balanced,
  };
}
