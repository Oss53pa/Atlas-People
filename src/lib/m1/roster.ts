import { useMemo } from 'react';
import { useEmployees, isBackendConfigured } from './supabaseLive';
import { useAuth } from '../auth';
import { EMPLOYEES, employeeById, type EmployeeRecord } from '../../data/mock';

/** UUID employé démo (e1000001-...-0000NN) → id mock eNN. */
export function mockEmpId(uuid: string): string {
  const n = parseInt(uuid.slice(-12), 10);
  return Number.isFinite(n) && n > 0 ? `e${n}` : uuid;
}

/**
 * Roster LIVE — source unique des collaborateurs pour les pages qui affichaient
 * `EMPLOYEES` en dur. Lit la table `employees` (Supabase) et la convertit au
 * shape `EmployeeRecord` (id mock eNN conservé pour ne pas casser la logique
 * existante : statuts keyés par id, mapping vers l'UUID DB, etc.). Fallback sur
 * le mock si backend absent ou table vide → jamais d'écran vide.
 */
export function useRoster(): EmployeeRecord[] {
  const { tenantId } = useAuth();
  const { data } = useEmployees(tenantId ?? undefined);
  return useMemo(() => {
    if (!isBackendConfigured || !data || data.length === 0) return EMPLOYEES;
    return data
      .map((e): EmployeeRecord => {
        const id = mockEmpId(e.id);
        // Enrichissement dérivé (champs hors schéma DB : signaux RH, alertes,
        // retenues, coordonnées) repris du mock par id pour ne dégrader aucune page.
        const base = employeeById(id);
        return {
          ...(base ?? ({} as EmployeeRecord)),
          // Cœur RH : source de vérité = Supabase.
          id,
          firstName: e.first_name,
          lastName: e.last_name,
          role: e.role_title ?? base?.role ?? '',
          department: e.department ?? base?.department ?? '',
          countryCode: e.country_code,
          email: e.email ?? base?.email ?? '',
          contractType: (e.contract as EmployeeRecord['contractType']) ?? base?.contractType ?? 'CDI',
          hireDate: e.hire_date ?? base?.hireDate ?? '',
          status: (e.status as EmployeeRecord['status']) ?? base?.status ?? 'active',
          baseSalary: e.base_salary,
          taxableAllowances: e.taxable_allowances,
          nonTaxableAllowances: e.non_taxable_allowances,
          fiscalParts: Number(e.fiscal_parts),
          retentionAttention: base?.retentionAttention ?? 0,
        };
      })
      .sort((a, b) => (parseInt(a.id.slice(1), 10) || 0) - (parseInt(b.id.slice(1), 10) || 0));
  }, [data]);
}
