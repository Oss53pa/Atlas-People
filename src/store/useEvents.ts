import { create } from 'zustand';

export type CareerEventType = 'hire' | 'promotion' | 'mobility' | 'salary_change' | 'suspension' | 'return' | 'exit' | 'amendment';

export interface CareerEvent {
  id: string;
  employeeId: string;
  type: CareerEventType;
  date: string; // YYYY-MM-DD
  label: string;
}

interface EventsState {
  events: CareerEvent[];
  append: (e: Omit<CareerEvent, 'id'>) => void;
  forEmployee: (id: string) => CareerEvent[];
}

/** Événements de carrière ajoutés à l'exécution (avenant, mobilité, sortie). */
export const useEvents = create<EventsState>((set, get) => ({
  events: [],
  append: (e) => set((s) => ({ events: [{ ...e, id: `ev-${Date.now()}` }, ...s.events] })),
  forEmployee: (id) => get().events.filter((e) => e.employeeId === id),
}));
