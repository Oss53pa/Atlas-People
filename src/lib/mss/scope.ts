import { EMPLOYEES, type EmployeeRecord } from '../../data/mock';
import { useSessionContext } from '../useSession';

/** Profondeur de vue managériale (cf. 01_FONDATION §0.3).
 *  - direct      : N-1 directs uniquement
 *  - department  : N-1 + N-2 (manager de managers)
 *  - all         : toute la cascade sous le manager (N-1 … N-k) */
export type ManagerDepth = 'direct' | 'department' | 'all';

/** Manager connecté pour la démo MSS. Awa Koné (e1) encadre des managers
 *  (Kouadio e2, Ibrahim e4) → cascade N-1/N-2 réelle, idéale pour les 3 niveaux. */
export const MANAGER_ID = 'e1';

/** Hook React — retourne l'employeeId du manager authentifié, fallback 'e1' en demo. */
export function useManagerId(): string {
  const { data: ctx } = useSessionContext();
  return ctx?.employeeId ?? 'e1';
}

const fullName = (e: EmployeeRecord) => `${e.firstName} ${e.lastName}`;

export interface ChainNode {
  employee: EmployeeRecord;
  depth: number;       // 1 = N-1 direct, 2 = N-2, …
  managerId: string;   // encadrant direct de ce collaborateur
}

function directReports(managerId: string, employees: EmployeeRecord[]): EmployeeRecord[] {
  const mgr = employees.find((e) => e.id === managerId);
  if (!mgr) return [];
  const name = fullName(mgr);
  return employees.filter((e) => e.manager === name);
}

/** Cascade hiérarchique complète sous un manager, annotée par profondeur.
 *  Équivalent front de la table `employee_management_chain`. */
export function managementChain(managerId: string, employees: EmployeeRecord[] = EMPLOYEES): ChainNode[] {
  const out: ChainNode[] = [];
  const seen = new Set<string>([managerId]);
  let frontier = [managerId];
  let depth = 1;
  while (frontier.length && depth <= 6) {
    const next: string[] = [];
    for (const mid of frontier) {
      for (const rep of directReports(mid, employees)) {
        if (seen.has(rep.id)) continue;
        seen.add(rep.id);
        out.push({ employee: rep, depth, managerId: mid });
        next.push(rep.id);
      }
    }
    frontier = next;
    depth += 1;
  }
  return out;
}

const DEPTH_LIMIT: Record<ManagerDepth, number> = { direct: 1, department: 2, all: 99 };

/** Membres de l'équipe visibles à la profondeur donnée (R8 : strictement le périmètre). */
export function scopedTeam(depth: ManagerDepth, employees: EmployeeRecord[] = EMPLOYEES, managerId: string = MANAGER_ID): EmployeeRecord[] {
  const limit = DEPTH_LIMIT[depth];
  return managementChain(managerId, employees).filter((n) => n.depth <= limit).map((n) => n.employee);
}

export function scopedTeamIds(depth: ManagerDepth, employees: EmployeeRecord[] = EMPLOYEES, managerId: string = MANAGER_ID): Set<string> {
  return new Set(scopedTeam(depth, employees, managerId).map((e) => e.id));
}

/** R8 : un collaborateur hors cascade n'est JAMAIS dans le périmètre. */
export function isInScope(employeeId: string, depth: ManagerDepth = 'all', employees: EmployeeRecord[] = EMPLOYEES, managerId: string = MANAGER_ID): boolean {
  return scopedTeamIds(depth, employees, managerId).has(employeeId);
}

/** Profondeur maximale réelle de la cascade (pour adapter le sélecteur). */
export function maxChainDepth(employees: EmployeeRecord[] = EMPLOYEES, managerId: string = MANAGER_ID): number {
  return managementChain(managerId, employees).reduce((m, n) => Math.max(m, n.depth), 0);
}

export interface DepthCounts { n1: number; n2: number; n3plus: number; total: number }

/** Effectifs par niveau pour le bandeau héros (cf. 02 §M1). */
export function depthCounts(employees: EmployeeRecord[] = EMPLOYEES, managerId: string = MANAGER_ID): DepthCounts {
  const chain = managementChain(managerId, employees);
  return {
    n1: chain.filter((n) => n.depth === 1).length,
    n2: chain.filter((n) => n.depth === 2).length,
    n3plus: chain.filter((n) => n.depth >= 3).length,
    total: chain.length,
  };
}

/** Sous-arbre direct d'un manager intermédiaire (annuaire des managers, N2+). */
export function reportsOf(managerId: string, employees: EmployeeRecord[] = EMPLOYEES): EmployeeRecord[] {
  return directReports(managerId, employees);
}

export const DEPTH_LABEL: Record<ManagerDepth, string> = {
  direct: 'Mon équipe directe',
  department: 'Mon département',
  all: 'Tout mon périmètre',
};

export const DEPTH_SUBLABEL: Record<ManagerDepth, string> = {
  direct: 'N-1 directs',
  department: 'N-1 + N-2',
  all: 'N-1 à N-4',
};
