/**
 * M2 thème α — Catalogue des types de congés & absences (déterministe).
 * Aligné sur le seed SQL (migration 0012 leave_types). Le LLM ne calcule jamais
 * un droit : ce catalogue + leaveEngine.ts portent toute la logique.
 */
export type LeaveCategory =
  | 'paid_leave' | 'special_family' | 'parenthood' | 'health' | 'exceptional' | 'delegation' | 'other';

export type CountUnit = 'working_days' | 'open_days' | 'calendar_days' | 'hours';

export interface LeaveTypeDef {
  code: string;
  label: string;
  category: LeaveCategory;
  paid: boolean;
  consumesPaidBalance: boolean;
  countUnit: CountUnit;
  defaultDuration?: number;
  justificationRequired: boolean;
  noticeDays: number;
  approvalCircuit: 'manager' | 'manager_hr' | 'hr' | 'automatic';
  linkedM1Event?: 'marriage' | 'birth' | 'death';
}

export const CATEGORY_LABEL: Record<LeaveCategory, string> = {
  paid_leave: 'Congé payé',
  special_family: 'Spécial familial',
  parenthood: 'Parentalité',
  health: 'Santé',
  exceptional: 'Exceptionnel',
  delegation: 'Délégation',
  other: 'Autre',
};

export const COUNT_UNIT_LABEL: Record<CountUnit, string> = {
  working_days: 'Jours ouvrés',
  open_days: 'Jours ouvrables',
  calendar_days: 'Jours calendaires',
  hours: 'Heures',
};

/** Catalogue commun (miroir du seed SQL). */
export const LEAVE_CATALOG: LeaveTypeDef[] = [
  { code: 'CP', label: 'Congé payé annuel', category: 'paid_leave', paid: true, consumesPaidBalance: true, countUnit: 'working_days', justificationRequired: false, noticeDays: 15, approvalCircuit: 'manager' },
  { code: 'RTT', label: 'Récupération du temps de travail', category: 'paid_leave', paid: true, consumesPaidBalance: false, countUnit: 'working_days', justificationRequired: false, noticeDays: 7, approvalCircuit: 'manager' },
  { code: 'CS-MAR', label: 'Mariage du salarié', category: 'special_family', paid: true, consumesPaidBalance: false, countUnit: 'working_days', defaultDuration: 4, justificationRequired: true, noticeDays: 7, approvalCircuit: 'manager', linkedM1Event: 'marriage' },
  { code: 'CS-NAIS', label: 'Naissance / Paternité', category: 'special_family', paid: true, consumesPaidBalance: false, countUnit: 'working_days', defaultDuration: 3, justificationRequired: true, noticeDays: 2, approvalCircuit: 'manager', linkedM1Event: 'birth' },
  { code: 'CS-DEC-CJT', label: 'Décès du conjoint', category: 'special_family', paid: true, consumesPaidBalance: false, countUnit: 'working_days', defaultDuration: 5, justificationRequired: true, noticeDays: 0, approvalCircuit: 'manager', linkedM1Event: 'death' },
  { code: 'CS-DEC-ASC', label: 'Décès d’un ascendant', category: 'special_family', paid: true, consumesPaidBalance: false, countUnit: 'working_days', defaultDuration: 3, justificationRequired: true, noticeDays: 0, approvalCircuit: 'manager', linkedM1Event: 'death' },
  { code: 'MAT', label: 'Congé maternité', category: 'parenthood', paid: true, consumesPaidBalance: false, countUnit: 'calendar_days', defaultDuration: 98, justificationRequired: true, noticeDays: 30, approvalCircuit: 'hr' },
  { code: 'PAT', label: 'Congé paternité', category: 'parenthood', paid: true, consumesPaidBalance: false, countUnit: 'working_days', defaultDuration: 3, justificationRequired: true, noticeDays: 7, approvalCircuit: 'manager', linkedM1Event: 'birth' },
  { code: 'MAL', label: 'Congé maladie', category: 'health', paid: true, consumesPaidBalance: false, countUnit: 'calendar_days', justificationRequired: true, noticeDays: 0, approvalCircuit: 'hr' },
  { code: 'AT', label: 'Accident du travail', category: 'health', paid: true, consumesPaidBalance: false, countUnit: 'calendar_days', justificationRequired: true, noticeDays: 0, approvalCircuit: 'hr' },
  { code: 'HADJ', label: 'Congé pèlerinage (Hadj)', category: 'exceptional', paid: false, consumesPaidBalance: false, countUnit: 'calendar_days', defaultDuration: 21, justificationRequired: true, noticeDays: 60, approvalCircuit: 'hr' },
  { code: 'PERM', label: 'Permission exceptionnelle', category: 'exceptional', paid: true, consumesPaidBalance: false, countUnit: 'working_days', defaultDuration: 1, justificationRequired: false, noticeDays: 2, approvalCircuit: 'manager' },
  { code: 'CSS', label: 'Congé sans solde', category: 'exceptional', paid: false, consumesPaidBalance: false, countUnit: 'calendar_days', justificationRequired: false, noticeDays: 15, approvalCircuit: 'manager_hr' },
  { code: 'MANDAT', label: 'Heures de délégation', category: 'delegation', paid: true, consumesPaidBalance: false, countUnit: 'hours', justificationRequired: false, noticeDays: 0, approvalCircuit: 'automatic' },
];

export function leaveTypeByCode(code: string): LeaveTypeDef | undefined {
  return LEAVE_CATALOG.find((t) => t.code === code);
}
