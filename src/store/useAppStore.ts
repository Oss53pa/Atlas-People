import { create } from 'zustand';

export interface Tenant {
  id: string;
  name: string;
  /** Zone monétaire dominante du tenant. */
  zone: 'UEMOA' | 'CEMAC';
  /** Pays d'opération (codes ISO-2). */
  countries: string[];
}

interface AppState {
  tenant: Tenant;
  /** Pays d'affectation sélectionné dans le contexte courant. */
  activeCountry: string;
  sidebarOpen: boolean;
  setActiveCountry: (code: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

// Tenant de démonstration : entreprise multi-pays UEMOA (CI + SN).
const DEMO_TENANT: Tenant = {
  id: 'atlas-demo',
  name: 'Atlas Demo SA',
  zone: 'UEMOA',
  countries: ['CI', 'SN'],
};

export const useAppStore = create<AppState>((set) => ({
  tenant: DEMO_TENANT,
  activeCountry: 'CI',
  sidebarOpen: false,
  setActiveCountry: (code) => set({ activeCountry: code }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
