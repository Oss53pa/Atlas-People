import { create } from 'zustand';
import type { ManagerDepth } from '../lib/mss/scope';

/** Profondeur de vue managériale active (sélecteur sidebar MSS, cf. 01_FONDATION §0.3).
 *  En production : défaut issu de `manager_preferences.default_team_depth`. */
interface ManagerScopeState {
  depth: ManagerDepth;
  setDepth: (d: ManagerDepth) => void;
}

export const useManagerScope = create<ManagerScopeState>((set) => ({
  depth: 'direct',
  setDepth: (depth) => set({ depth }),
}));
