import { create } from 'zustand';

/**
 * S7 — Mes notes de frais (ESS). Une note de frais regroupe plusieurs lignes.
 * Workflow : brouillon → soumise → validée manager → validée finance → remboursée.
 * Le contrôle de politique (plafonds) est déterministe (lib/expenses/policy).
 */
export type ExpenseReportStatus =
  | 'draft'
  | 'submitted'
  | 'manager_approved'
  | 'finance_approved'
  | 'reimbursed'
  | 'refused';

export interface ExpenseLine {
  id: string;
  category: string;
  label: string;
  amount: number;
  date: string;
  hasReceipt: boolean;
}

export interface ExpenseReport {
  id: string;
  reference: string;
  employeeId: string;
  title: string;
  mission?: string;
  status: ExpenseReportStatus;
  createdAt: string;
  submittedAt?: string;
  reimbursedAt?: string;
  approver: string;
  lines: ExpenseLine[];
  note?: string;
}

const sum = (lines: ExpenseLine[]) => lines.reduce((s, l) => s + l.amount, 0);

const SEED: ExpenseReport[] = [
  {
    id: 'nf1', reference: 'NDF-2026-0091', employeeId: 'e2', title: 'Mission Bouaké — audit agence',
    mission: 'Déplacement Abidjan → Bouaké (3 j)', status: 'finance_approved', createdAt: '2026-05-12', submittedAt: '2026-05-15',
    approver: 'Valentina Okou',
    lines: [
      { id: 'l1', category: 'transport', label: 'Billet car VIP A/R', amount: 28_000, date: '2026-05-12', hasReceipt: true },
      { id: 'l2', category: 'hebergement', label: 'Hôtel Ran — 2 nuits', amount: 70_000, date: '2026-05-13', hasReceipt: true },
      { id: 'l3', category: 'restauration', label: 'Repas mission', amount: 22_000, date: '2026-05-13', hasReceipt: true },
      { id: 'l4', category: 'perdiem', label: 'Per diem (3 j)', amount: 30_000, date: '2026-05-14', hasReceipt: false },
    ],
  },
  {
    id: 'nf2', reference: 'NDF-2026-0103', employeeId: 'e2', title: 'Frais carburant — tournée clients',
    mission: 'Tournée commerciale zone sud', status: 'submitted', createdAt: '2026-05-22', submittedAt: '2026-05-24',
    approver: 'Valentina Okou',
    lines: [
      { id: 'l5', category: 'carburant', label: 'Total Énergies', amount: 18_500, date: '2026-05-22', hasReceipt: true },
      { id: 'l6', category: 'transport', label: 'Péage autoroute', amount: 6_000, date: '2026-05-22', hasReceipt: true },
    ],
  },
  {
    id: 'nf3', reference: 'NDF-2026-0058', employeeId: 'e2', title: 'Séminaire RH — Yamoussoukro',
    mission: 'Formation interne 2 j', status: 'reimbursed', createdAt: '2026-04-08', submittedAt: '2026-04-10', reimbursedAt: '2026-04-25',
    approver: 'Valentina Okou',
    lines: [
      { id: 'l7', category: 'transport', label: 'Navette séminaire', amount: 15_000, date: '2026-04-08', hasReceipt: true },
      { id: 'l8', category: 'restauration', label: 'Dîner d\'équipe', amount: 19_000, date: '2026-04-09', hasReceipt: true },
    ],
  },
  {
    id: 'nf4', reference: 'NDF-2026-0110', employeeId: 'e2', title: 'Note en préparation',
    status: 'draft', createdAt: '2026-05-27', approver: 'Valentina Okou',
    lines: [
      { id: 'l9', category: 'divers', label: 'Fournitures bureau', amount: 8_500, date: '2026-05-27', hasReceipt: false },
    ],
  },
];

interface State {
  reports: ExpenseReport[];
  byEmployee: (employeeId: string) => ExpenseReport[];
  create: (r: ExpenseReport) => void;
  addLine: (reportId: string, line: ExpenseLine) => void;
  removeLine: (reportId: string, lineId: string) => void;
  submit: (reportId: string) => void;
  /** Décision managériale (MSS VQ.2) : validation ou refus avant l'étape finance. */
  managerDecide: (reportId: string, decision: 'manager_approved' | 'refused') => void;
  remove: (reportId: string) => void;
}

export const useExpenses = create<State>((set, get) => ({
  reports: SEED,
  byEmployee: (employeeId) => get().reports.filter((r) => r.employeeId === employeeId),
  create: (r) => set((s) => ({ reports: [r, ...s.reports] })),
  addLine: (reportId, line) =>
    set((s) => ({ reports: s.reports.map((r) => (r.id === reportId ? { ...r, lines: [...r.lines, line] } : r)) })),
  removeLine: (reportId, lineId) =>
    set((s) => ({ reports: s.reports.map((r) => (r.id === reportId ? { ...r, lines: r.lines.filter((l) => l.id !== lineId) } : r)) })),
  submit: (reportId) =>
    set((s) => ({ reports: s.reports.map((r) => (r.id === reportId ? { ...r, status: 'submitted', submittedAt: '2026-05-28' } : r)) })),
  managerDecide: (reportId, decision) =>
    set((s) => ({ reports: s.reports.map((r) => (r.id === reportId ? { ...r, status: decision } : r)) })),
  remove: (reportId) => set((s) => ({ reports: s.reports.filter((r) => r.id !== reportId) })),
}));

export const reportTotal = (r: ExpenseReport) => sum(r.lines);
