/**
 * Store des scénarios What-if (persistance localStorage).
 * Permet de sauvegarder, charger, supprimer et comparer des simulations stratégiques.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SimHire {
  id: string;
  role: string;
  countryCode: string;
  baseSalary: number;
  taxableAllowances: number;
  fiscalParts: number;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  notes?: string;
  /** ISO timestamp création */
  createdAt: string;
  /** Auteur (mock — depuis le contexte) */
  authorName?: string;
  // — Paramètres de simulation
  increasePct: number;
  extraFiscalParts: number;
  removedIds: string[];
  hires: SimHire[];
}

interface WhatIfState {
  scenarios: WhatIfScenario[];
  selectedAId: string | null;     // pour le comparateur
  selectedBId: string | null;

  saveScenario: (payload: Omit<WhatIfScenario, 'id' | 'createdAt'>) => string;
  deleteScenario: (id: string) => void;
  renameScenario: (id: string, name: string, notes?: string) => void;
  selectForCompare: (slot: 'A' | 'B', id: string | null) => void;
  getById: (id: string) => WhatIfScenario | undefined;
}

export const useWhatIfScenarios = create<WhatIfState>()(
  persist(
    (set, get) => ({
      scenarios: [],
      selectedAId: null,
      selectedBId: null,

      saveScenario: (payload) => {
        const id = `sc-${String(Date.now())}-${Math.floor(performance.now())}`;
        const sc: WhatIfScenario = {
          ...payload,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ scenarios: [sc, ...s.scenarios] }));
        return id;
      },

      deleteScenario: (id) => set((s) => ({
        scenarios: s.scenarios.filter((sc) => sc.id !== id),
        selectedAId: s.selectedAId === id ? null : s.selectedAId,
        selectedBId: s.selectedBId === id ? null : s.selectedBId,
      })),

      renameScenario: (id, name, notes) => set((s) => ({
        scenarios: s.scenarios.map((sc) => sc.id === id ? { ...sc, name, notes } : sc),
      })),

      selectForCompare: (slot, id) => set((s) => slot === 'A'
        ? { ...s, selectedAId: id }
        : { ...s, selectedBId: id }),

      getById: (id) => get().scenarios.find((sc) => sc.id === id),
    }),
    {
      name: 'atlas-people-whatif-scenarios',
      version: 1,
    },
  ),
);
