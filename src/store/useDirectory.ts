import { create } from 'zustand';
import { EMPLOYEES, type EmployeeRecord } from '../data/mock';

interface DirectoryState {
  employees: EmployeeRecord[];
  addEmployee: (e: EmployeeRecord) => void;
  updateEmployee: (id: string, patch: Partial<EmployeeRecord>) => void;
  getEmployee: (id: string) => EmployeeRecord | undefined;
}

// Annuaire en mémoire (mode démo), initialisé depuis les données mock.
// Le wizard de création (P1.2) y ajoute les nouveaux collaborateurs ;
// les avenants / mobilités / sorties (P1.9–P1.11) les mettent à jour.
export const useDirectory = create<DirectoryState>((set, get) => ({
  employees: EMPLOYEES,
  addEmployee: (e) => set((s) => ({ employees: [e, ...s.employees] })),
  updateEmployee: (id, patch) =>
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
  getEmployee: (id) => get().employees.find((e) => e.id === id),
}));
