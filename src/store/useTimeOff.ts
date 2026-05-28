import { create } from 'zustand';
import type { SurfaceKey } from '../app/spaces';

/** Demande de congé/absence (M2 thème γ). Modèle ESS-orienté (riche), distinct du
 *  mock minimal LEAVE_REQUESTS. Une demande posée en E2.3 apparaît en E2.1/E2.2. */
export interface TimeOffRequest {
  id: string;
  employeeId: string;
  code: string;          // code catalogue α (CP, CS-MAR, MAL…)
  label: string;
  start: string;         // YYYY-MM-DD
  end: string;
  countedDays: number;   // décompte déterministe (hors WE + fériés)
  status: 'pending' | 'approved' | 'refused' | 'info_requested';
  reason?: string;
  approver?: string;
  surface: SurfaceKey;   // source_surface (ess/mss/backoffice)
  createdAt: string;
  offline?: boolean;     // posée hors-ligne, en attente de synchro
}

const SEED: TimeOffRequest[] = [
  // Employé connecté (ESS)
  { id: 'to1', employeeId: 'e2', code: 'CP', label: 'Congé payé annuel', start: '2026-04-07', end: '2026-04-17', countedDays: 9, status: 'approved', approver: 'Valentina Okou', surface: 'ess', createdAt: '2026-03-20' },
  { id: 'to2', employeeId: 'e2', code: 'CP', label: 'Congé payé annuel', start: '2026-06-15', end: '2026-06-19', countedDays: 5, status: 'pending', approver: 'Valentina Okou', surface: 'ess', createdAt: '2026-05-26' },
  { id: 'to3', employeeId: 'e2', code: 'CS-NAIS', label: 'Naissance / Paternité', start: '2026-02-10', end: '2026-02-12', countedDays: 3, status: 'approved', approver: 'Valentina Okou', surface: 'ess', createdAt: '2026-02-09' },
  // Équipe (à valider côté MSS)
  { id: 'to4', employeeId: 'e4', code: 'CP', label: 'Congé payé annuel', start: '2026-06-01', end: '2026-06-05', countedDays: 5, status: 'pending', approver: 'Valentina Okou', surface: 'ess', createdAt: '2026-05-25' },
  { id: 'to5', employeeId: 'e8', code: 'CS-MAR', label: 'Mariage du salarié', start: '2026-05-30', end: '2026-06-02', countedDays: 2, status: 'pending', approver: 'Valentina Okou', surface: 'ess', createdAt: '2026-05-24' },
  { id: 'to6', employeeId: 'e3', code: 'CP', label: 'Congé payé annuel', start: '2026-06-08', end: '2026-06-12', countedDays: 5, status: 'pending', approver: 'Valentina Okou', surface: 'ess', createdAt: '2026-05-27' },
  { id: 'to7', employeeId: 'e10', code: 'MAL', label: 'Congé maladie', start: '2026-05-26', end: '2026-05-29', countedDays: 4, status: 'approved', surface: 'ess', createdAt: '2026-05-26' },
];

interface TimeOffState {
  requests: TimeOffRequest[];
  requestLeave: (r: TimeOffRequest) => void;
  decide: (id: string, status: TimeOffRequest['status']) => void;
  byEmployee: (employeeId: string) => TimeOffRequest[];
}

export const useTimeOff = create<TimeOffState>((set, get) => ({
  requests: SEED,
  requestLeave: (r) => set((s) => ({ requests: [r, ...s.requests] })),
  decide: (id, status) => set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) })),
  byEmployee: (employeeId) => get().requests.filter((r) => r.employeeId === employeeId),
}));
