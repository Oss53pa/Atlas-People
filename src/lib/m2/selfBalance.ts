import type { EmployeeRecord } from '../../data/mock';
import { employeeFamily } from '../../data/mock';
import { leaveTypeByCode } from './leaveTypes';
import { DEFAULT_ACCRUAL_CI, annualEntitlement, monthlyAccrual, seniorityBonusDays } from './leaveEngine';
import type { TimeOffRequest } from '../../store/useTimeOff';

const TODAY = '2026-05-28';
const round1 = (n: number) => Math.round(n * 10) / 10;

export interface SelfLeaveBalance {
  acquired: number;
  taken: number;
  pending: number;
  available: number;
  monthlyRate: number;
  seniorityYears: number;
  majorations: string[];
}

/** Solde de congés payés de l'employé connecté (ESS), calculé déterministiquement
 *  depuis le moteur M2 + ses demandes. Acquis annuel théorique − pris − en cours. */
export function computeSelfLeaveBalance(employee: EmployeeRecord, requests: TimeOffRequest[]): SelfLeaveBalance {
  const seniorityYears = Math.max(0, Math.floor((Date.parse(`${TODAY}T00:00:00`) - Date.parse(`${employee.hireDate}T00:00:00`)) / (365.25 * 86_400_000)));
  const childrenUnder14 = employeeFamily(employee).filter((m) => m.type === 'child').length;
  const acquired = annualEntitlement(DEFAULT_ACCRUAL_CI, { seniorityYears, childrenUnder14, age: 35 });

  const consuming = requests.filter((r) => leaveTypeByCode(r.code)?.consumesPaidBalance);
  const taken = round1(consuming.filter((r) => r.status === 'approved').reduce((s, r) => s + r.countedDays, 0));
  const pending = round1(consuming.filter((r) => r.status === 'pending').reduce((s, r) => s + r.countedDays, 0));
  const available = round1(acquired - taken - pending);

  const majorations: string[] = [];
  const sb = seniorityBonusDays(DEFAULT_ACCRUAL_CI, seniorityYears);
  if (sb > 0) majorations.push(`+${sb} j ancienneté (${seniorityYears} ans)`);
  if (childrenUnder14 > 0) majorations.push(`+${childrenUnder14 * DEFAULT_ACCRUAL_CI.motherBonusPerChild} j enfant(s) à charge`);

  return { acquired, taken, pending, available, monthlyRate: monthlyAccrual(DEFAULT_ACCRUAL_CI), seniorityYears, majorations };
}
