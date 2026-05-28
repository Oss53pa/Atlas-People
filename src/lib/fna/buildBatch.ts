/**
 * Construit un lot d'écritures FNA consolidé au niveau d'une campagne de paie,
 * à partir des bulletins calculés (agrégation déterministe par compte).
 * Utilisé pour la prévisualisation côté front ; le déversement réel est
 * effectué par l'Edge Function `post-to-fna` qui relit les écritures persistées.
 */
import { Money } from '../money';
import type { JournalEntry } from '../payroll/AccountingMapper';
import type { FnaBatch, FnaJournalLine } from './types';

export function buildFnaBatch(params: {
  tenantId: string;
  runId: string;
  period: string;
  currency: 'XOF' | 'XAF';
  entries: JournalEntry[]; // une écriture par bulletin
}): FnaBatch {
  const { tenantId, runId, period, currency, entries } = params;

  // Agrégation par compte sur l'ensemble de la campagne.
  const byAccount = new Map<string, { label: string; debit: Money; credit: Money }>();
  for (const entry of entries) {
    for (const line of entry.lines) {
      const acc = byAccount.get(line.account) ?? {
        label: line.label,
        debit: Money.zero(currency),
        credit: Money.zero(currency),
      };
      acc.debit = acc.debit.add(Money.fromJSON({ units: line.debitUnits, currency }));
      acc.credit = acc.credit.add(Money.fromJSON({ units: line.creditUnits, currency }));
      byAccount.set(line.account, acc);
    }
  }

  const lines: FnaJournalLine[] = [...byAccount.entries()].map(([account, v]) => ({
    account,
    label: v.label,
    debit: v.debit.toJSON().units,
    credit: v.credit.toJSON().units,
  }));

  const totalDebit = Money.sum(
    lines.map((l) => Money.fromJSON({ units: l.debit, currency })),
    currency,
  );
  const totalCredit = Money.sum(
    lines.map((l) => Money.fromJSON({ units: l.credit, currency })),
    currency,
  );

  return {
    tenantId,
    runId,
    period,
    currency,
    idempotencyKey: `${tenantId}:${runId}`,
    lines,
    totalDebit: totalDebit.toJSON().units,
    totalCredit: totalCredit.toJSON().units,
    balanced: totalDebit.equals(totalCredit),
  };
}
