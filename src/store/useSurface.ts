import { create } from 'zustand';
import type { SurfaceKey } from '../app/spaces';

/** Espace (surface) actif. Détermine le contexte complet : intention, routes,
 *  ergonomie. L'audit trace l'espace d'origine de chaque action (source_surface). */
interface SurfaceState {
  surface: SurfaceKey;
  setSurface: (s: SurfaceKey) => void;
}

export const useSurface = create<SurfaceState>((set) => ({
  surface: 'backoffice', // la démo s'ouvre sur le cockpit RH
  setSurface: (surface) => set({ surface }),
}));
