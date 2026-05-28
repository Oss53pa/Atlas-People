import { create } from 'zustand';

/** Pointage (M2 thème δ). Offline-first : horodatage local d'origine conservé.
 *  Mode démo en mémoire — un vrai déploiement utilise IndexedDB + sync batch. */
export type ClockingType = 'in' | 'out' | 'break_start' | 'break_end';

export interface Clocking {
  id: string;
  employeeId: string;
  type: ClockingType;
  at: string;            // ISO — horodatage local d'origine
  geo?: { lat: number; lng: number };
  offline: boolean;      // enregistré hors-ligne, en attente de synchro
  verification: 'ok' | 'to_verify';
}

function at(daysAgo: number, h: number, m: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const SEED: Clocking[] = [
  { id: 'ck0', employeeId: 'e2', type: 'out', at: at(1, 18, 4), offline: false, verification: 'ok' },
  { id: 'ck1', employeeId: 'e2', type: 'in', at: at(1, 8, 1), offline: false, verification: 'ok' },
  { id: 'ck2', employeeId: 'e2', type: 'in', at: at(0, 8, 2), offline: false, verification: 'ok' },
];

interface ClockingState {
  clockings: Clocking[];
  clock: (c: Clocking) => void;
  byEmployee: (employeeId: string) => Clocking[];
}

export const useClocking = create<ClockingState>((set, get) => ({
  clockings: SEED,
  clock: (c) => set((s) => ({ clockings: [c, ...s.clockings] })),
  byEmployee: (employeeId) => get().clockings.filter((c) => c.employeeId === employeeId),
}));
