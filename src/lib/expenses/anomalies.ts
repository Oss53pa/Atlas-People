/**
 * Détection d'anomalies sur notes de frais (déterministe).
 * - duplicate    : même employé / catégorie / montant / date.
 * - fractionnement: plusieurs frais d'un même employé, même catégorie, sur une
 *                   courte fenêtre, chacun juste sous le plafond (contournement).
 * - aberrant     : montant nettement supérieur au plafond (≥ 2×).
 */
import { categoryByCode } from './policy';

export type AnomalyKind = 'duplicate' | 'fractionnement' | 'aberrant';

export interface ExpenseLike {
  id: string;
  employeeId: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

const FRACTION_WINDOW_DAYS = 3;
const FRACTION_NEAR_CAP = 0.8; // ≥ 80 % du plafond

function daysApart(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;
}

export function detectAnomalies(claims: ExpenseLike[]): Map<string, AnomalyKind[]> {
  const result = new Map<string, AnomalyKind[]>();
  const add = (id: string, kind: AnomalyKind) => {
    const list = result.get(id) ?? [];
    if (!list.includes(kind)) list.push(kind);
    result.set(id, list);
  };

  for (const c of claims) {
    const cap = categoryByCode(c.category).cap;

    // aberrant
    if (c.amount >= cap * 2) add(c.id, 'aberrant');

    for (const other of claims) {
      if (other.id === c.id) continue;
      if (other.employeeId !== c.employeeId || other.category !== c.category) continue;

      // duplicate
      if (other.amount === c.amount && other.date === c.date) add(c.id, 'duplicate');

      // fractionnement
      if (
        daysApart(c.date, other.date) <= FRACTION_WINDOW_DAYS &&
        c.amount >= cap * FRACTION_NEAR_CAP &&
        other.amount >= cap * FRACTION_NEAR_CAP
      ) {
        add(c.id, 'fractionnement');
      }
    }
  }
  return result;
}

export const ANOMALY_LABEL: Record<AnomalyKind, string> = {
  duplicate: 'Doublon',
  fractionnement: 'Fractionnement',
  aberrant: 'Montant aberrant',
};
