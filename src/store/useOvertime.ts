import { create } from 'zustand';

/** Heures supplémentaires (M2 thème ζ). Détectées (pointages vs planning) ou
 *  déclarées ; jamais payées sans validation manager. Calcul = déterministe. */
export interface OvertimeRecord {
  id: string;
  employeeId: string;
  date: string;            // YYYY-MM-DD
  plannedHours: number;
  workedHours: number;
  overtimeHours: number;
  ratePct: number;
  category: 'overtime' | 'night' | 'sunday' | 'holiday';
  status: 'detected' | 'validated' | 'pending' | 'refused';
  source: 'auto' | 'declared';
  preference?: 'pay' | 'recovery';
}

const SEED: OvertimeRecord[] = [
  // Employé connecté
  { id: 'ot1', employeeId: 'e2', date: '2026-05-12', plannedHours: 8, workedHours: 9.5, overtimeHours: 1.5, ratePct: 15, category: 'overtime', status: 'validated', source: 'auto', preference: 'pay' },
  { id: 'ot2', employeeId: 'e2', date: '2026-05-15', plannedHours: 8, workedHours: 9, overtimeHours: 1, ratePct: 50, category: 'overtime', status: 'validated', source: 'auto', preference: 'pay' },
  { id: 'ot3', employeeId: 'e2', date: '2026-05-20', plannedHours: 8, workedHours: 10.5, overtimeHours: 2.5, ratePct: 50, category: 'night', status: 'pending', source: 'auto' },
  { id: 'ot4', employeeId: 'e2', date: '2026-05-22', plannedHours: 8, workedHours: 9, overtimeHours: 1, ratePct: 15, category: 'overtime', status: 'pending', source: 'declared' },
  // Équipe (à valider côté MSS)
  { id: 'ot5', employeeId: 'e4', date: '2026-05-19', plannedHours: 8, workedHours: 10, overtimeHours: 2, ratePct: 15, category: 'overtime', status: 'pending', source: 'auto' },
  { id: 'ot6', employeeId: 'e10', date: '2026-05-21', plannedHours: 8, workedHours: 9.5, overtimeHours: 1.5, ratePct: 50, category: 'night', status: 'pending', source: 'auto' },
  { id: 'ot7', employeeId: 'e3', date: '2026-05-18', plannedHours: 8, workedHours: 9, overtimeHours: 1, ratePct: 15, category: 'overtime', status: 'pending', source: 'declared' },
];

interface OvertimeState {
  records: OvertimeRecord[];
  declare: (r: OvertimeRecord) => void;
  setPreference: (id: string, pref: 'pay' | 'recovery') => void;
  decide: (id: string, status: 'validated' | 'refused', overtimeHours?: number) => void;
  byEmployee: (employeeId: string) => OvertimeRecord[];
}

export const useOvertime = create<OvertimeState>((set, get) => ({
  records: SEED,
  declare: (r) => set((s) => ({ records: [r, ...s.records] })),
  setPreference: (id, pref) => set((s) => ({ records: s.records.map((r) => (r.id === id ? { ...r, preference: pref } : r)) })),
  decide: (id, status, overtimeHours) => set((s) => ({ records: s.records.map((r) => (r.id === id ? { ...r, status, ...(overtimeHours != null ? { overtimeHours } : {}) } : r)) })),
  byEmployee: (employeeId) => get().records.filter((r) => r.employeeId === employeeId),
}));
