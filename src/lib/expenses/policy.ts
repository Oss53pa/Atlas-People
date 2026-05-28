/**
 * Politique de frais — plafonds par catégorie (déterministe).
 * Un frais hors politique est signalé et requiert une validation supérieure.
 */
import { Money, type Currency } from '../money';

export interface ExpenseCategory {
  code: string;
  label: string;
  cap: number; // plafond par occurrence (francs)
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { code: 'transport', label: 'Déplacement', cap: 150_000 },
  { code: 'hebergement', label: 'Hébergement (/nuit)', cap: 75_000 },
  { code: 'restauration', label: 'Restauration', cap: 25_000 },
  { code: 'perdiem', label: 'Per diem (/jour)', cap: 30_000 },
  { code: 'carburant', label: 'Carburant', cap: 50_000 },
  { code: 'divers', label: 'Divers', cap: 20_000 },
];

/** Seuil au-delà duquel un justificatif est obligatoire. */
export const RECEIPT_THRESHOLD = 10_000;

export function categoryByCode(code: string): ExpenseCategory {
  return EXPENSE_CATEGORIES.find((c) => c.code === code) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

export interface PolicyCheck {
  withinPolicy: boolean;
  capUnits: string;
  overByUnits: string;
  requiresReceipt: boolean;
  message: string;
}

export function checkPolicy(categoryCode: string, amount: number, currency: Currency = 'XOF'): PolicyCheck {
  const cat = categoryByCode(categoryCode);
  const cap = Money.of(cat.cap, currency);
  const amt = Money.of(amount, currency);
  const within = amt.lte(cap);
  const over = within ? Money.zero(currency) : amt.subtract(cap);
  return {
    withinPolicy: within,
    capUnits: cap.toJSON().units,
    overByUnits: over.toJSON().units,
    requiresReceipt: amount > RECEIPT_THRESHOLD,
    message: within
      ? `Conforme à la politique (plafond ${cap.format()} FCFA).`
      : `Dépasse le plafond de ${over.format()} FCFA — validation de niveau supérieur requise.`,
  };
}
