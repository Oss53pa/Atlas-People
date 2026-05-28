import { create } from 'zustand';
import { EMPLOYEES } from '../data/mock';
import { computeM3Bulletin } from '../lib/m3/engine';
import type { PayrollVariables, SaisieStatus, CyclePhase } from '../lib/m3/types';

/** M3 — état du cycle de paie courant (démo : Mai 2026, société Atlas Studio CI). */
export interface CycleMeta {
  id: string;
  period: string;        // '2026-05'
  label: string;         // 'Mai 2026'
  companyCode: string;
  companyLabel: string;
  countryCode: string;
  phase: CyclePhase;
  payDate: string;
  deadlineSaisie: string;
  deadlineValidation: string;
}

const fullMonth = (jours = 22): PayrollVariables => ({
  joursOuvrables: jours, joursTravailles: jours, applyProrata: true,
  hs15: 0, hs50: 0, primes: [], retenues: [], ndf: [], avance: 0, notes: '',
});

// Variables seedées par collaborateur (mélange : pré-rempli, saisi, à saisir, anomalie).
function seedVariables(): Record<string, PayrollVariables> {
  const v: Record<string, PayrollVariables> = {};
  for (const e of EMPLOYEES) v[e.id] = fullMonth();
  // e2 — Kouadio : 3 absences, HS, prime T1, NDF mission, avance.
  v['e2'] = {
    ...fullMonth(), joursTravailles: 19, hs15: 4,
    primes: [{ code: 'R070_PRIME_EXCEPT', label: 'Prime exceptionnelle T1', amount: 150_000, taxable: true, source: 'mss' }],
    ndf: [{ ref: 'NDF-2026-0091', label: 'Mission Bouaké', amount: 145_000, taxable: false }],
    avance: 100_000, notes: 'Prime T1 validée direction. NDF mission Bouaké conforme plafonds.',
  };
  // e4 — Ibrahim : prime perf (avance déjà en élément fixe via mock.otherDeductions).
  v['e4'] = { ...fullMonth(), primes: [{ code: 'R071_PERF', label: 'Prime de performance', amount: 80_000, taxable: true, source: 'mss' }] };
  // e9 — Khady (en congé) : prorata partiel.
  v['e9'] = { ...fullMonth(), joursTravailles: 11, notes: 'Congé longue durée — vérifier indemnisation.' };
  // e8 — Serge : HS 50 %.
  v['e8'] = { ...fullMonth(), hs50: 6 };
  return v;
}

function seedStatuses(): Record<string, SaisieStatus> {
  const s: Record<string, SaisieStatus> = {};
  for (const e of EMPLOYEES) s[e.id] = 'to_seize';
  s['e1'] = 'seized'; s['e3'] = 'seized'; s['e6'] = 'seized';
  s['e2'] = 'prefilled'; s['e4'] = 'prefilled'; s['e8'] = 'prefilled';
  s['e9'] = 'anomaly';
  return s;
}

// Net du mois précédent (baseline = mois plein « propre ») pour comparaison M-1.
function seedPrevNet(): Record<string, number> {
  const p: Record<string, number> = {};
  for (const e of EMPLOYEES) p[e.id] = computeM3Bulletin(e, fullMonth()).netAPayer;
  return p;
}

interface State {
  cycle: CycleMeta;
  variables: Record<string, PayrollVariables>;
  statuses: Record<string, SaisieStatus>;
  prevNet: Record<string, number>;
  setVariables: (employeeId: string, patch: Partial<PayrollVariables>) => void;
  setStatus: (employeeId: string, status: SaisieStatus) => void;
  markReady: (employeeId: string) => void;
  lock: (employeeId: string) => void;
  setPhase: (phase: CyclePhase) => void;
}

export const usePayrollCycle = create<State>((set) => ({
  cycle: {
    id: 'cycle-2026-05', period: '2026-05', label: 'Mai 2026',
    companyCode: 'AP-CI', companyLabel: 'Atlas Studio CI SARL', countryCode: 'CI',
    phase: 'preparation', payDate: '2026-05-25', deadlineSaisie: '2026-05-20', deadlineValidation: '2026-05-23',
  },
  variables: seedVariables(),
  statuses: seedStatuses(),
  prevNet: seedPrevNet(),
  setVariables: (employeeId, patch) =>
    set((s) => ({ variables: { ...s.variables, [employeeId]: { ...s.variables[employeeId], ...patch } } })),
  setStatus: (employeeId, status) => set((s) => ({ statuses: { ...s.statuses, [employeeId]: status } })),
  markReady: (employeeId) => set((s) => ({ statuses: { ...s.statuses, [employeeId]: 'seized' } })),
  lock: (employeeId) => set((s) => ({ statuses: { ...s.statuses, [employeeId]: 'locked' } })),
  setPhase: (phase) => set((s) => ({ cycle: { ...s.cycle, phase } })),
}));
