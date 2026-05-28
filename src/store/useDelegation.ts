import { create } from 'zustand';

/** Heures de délégation (M2 thème ι, branché M1 thème M). DROIT, pas une faveur :
 *  déclaration (bon de délégation), jamais de validation préalable. Rémunérées
 *  comme temps de travail, ne consomment pas les congés. */
export interface DelegationCredit {
  id: string;
  employeeId: string;
  mandateType: string;
  monthlyQuota: number;
  usedHours: number;
  month: string;          // YYYY-MM
  protectedUntil?: string;
}

export interface DelegationUsage {
  id: string;
  employeeId: string;
  mandateType: string;
  date: string;
  hours: number;
  location: 'internal' | 'external';
  note?: string;
}

// Démo : l'employé connecté (e2) est seedé avec un mandat actif pour illustrer E2.7.
// En production, alimenté depuis M1 employee_mandates / mandate_protection.
const SEED_CREDITS: DelegationCredit[] = [
  { id: 'dc1', employeeId: 'e2', mandateType: 'Délégué du personnel', monthlyQuota: 15, usedHours: 8, month: '2026-05', protectedUntil: '2027-12-01' },
];
const SEED_USAGE: DelegationUsage[] = [
  { id: 'du1', employeeId: 'e2', mandateType: 'Délégué du personnel', date: '2026-05-06', hours: 3, location: 'internal' },
  { id: 'du2', employeeId: 'e2', mandateType: 'Délégué du personnel', date: '2026-05-14', hours: 2, location: 'internal' },
  { id: 'du3', employeeId: 'e2', mandateType: 'Délégué du personnel', date: '2026-05-21', hours: 3, location: 'external' },
];

interface DelegationState {
  credits: DelegationCredit[];
  usage: DelegationUsage[];
  declare: (u: DelegationUsage) => void;
  hasMandate: (employeeId: string) => boolean;
  creditsOf: (employeeId: string) => DelegationCredit[];
  usageOf: (employeeId: string) => DelegationUsage[];
}

export const useDelegation = create<DelegationState>((set, get) => ({
  credits: SEED_CREDITS,
  usage: SEED_USAGE,
  declare: (u) => set((s) => ({
    usage: [u, ...s.usage],
    credits: s.credits.map((c) => (c.employeeId === u.employeeId && c.mandateType === u.mandateType && c.month === u.date.slice(0, 7) ? { ...c, usedHours: Math.round((c.usedHours + u.hours) * 10) / 10 } : c)),
  })),
  hasMandate: (employeeId) => get().credits.some((c) => c.employeeId === employeeId),
  creditsOf: (employeeId) => get().credits.filter((c) => c.employeeId === employeeId),
  usageOf: (employeeId) => get().usage.filter((u) => u.employeeId === employeeId),
}));
