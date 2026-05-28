import type { EmployeeRecord } from '../../data/mock';
import { DEMO_USER } from '../../app/spaces';

/** Périmètre équipe du manager connecté (MSS). En production : construit depuis
 *  org_relationships (M1) avec profondeur paramétrable. En démo : les membres
 *  encadrés par le manager, repli sur un ensemble fixe cohérent avec les seeds. */
export const TEAM_MEMBER_IDS = ['e3', 'e4', 'e6', 'e8', 'e10'];

export function teamMembers(employees: EmployeeRecord[]): EmployeeRecord[] {
  const managed = employees.filter((e) => e.manager === DEMO_USER.name);
  if (managed.length >= 3) return managed;
  return employees.filter((e) => TEAM_MEMBER_IDS.includes(e.id));
}

export function isTeamMember(employeeId: string, employees: EmployeeRecord[]): boolean {
  return teamMembers(employees).some((e) => e.id === employeeId);
}
