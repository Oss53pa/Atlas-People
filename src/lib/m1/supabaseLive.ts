/**
 * M1 Collaborateurs — couche live Supabase.
 * Table principale : employees
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';

export interface EmployeeRow {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  role_title: string | null;
  department: string | null;
  country_code: string;
  contract: string;
  hire_date: string | null;
  status: string;
  lifecycle_status: string;
  base_salary: number;
  taxable_allowances: number;
  non_taxable_allowances: number;
  fiscal_parts: number;
  manager_id: string | null;
  created_at: string;
}

export function useEmployees(tenantId = DEMO) {
  return useQuery({
    queryKey: ['employees', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('employees')
        .select('id,tenant_id,first_name,last_name,email,role_title,department,country_code,contract,hire_date,status,lifecycle_status,base_salary,taxable_allowances,non_taxable_allowances,fiscal_parts,manager_id,created_at')
        .eq('tenant_id', tenantId)
        .order('last_name');
      if (error) throw error;
      return (data ?? []) as EmployeeRow[];
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export function useEmployee(tenantId = DEMO, employeeId?: string) {
  return useQuery({
    queryKey: ['employee', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return null;
      const { data, error } = await supabase.schema('atlas_people')
        .from('employees').select('*')
        .eq('tenant_id', tenantId).eq('id', employeeId).single();
      if (error) throw error;
      return data as EmployeeRow;
    },
    enabled: isBackendConfigured && Boolean(employeeId),
    staleTime: 60_000,
  });
}

export function useEmployeeStats(tenantId = DEMO) {
  return useQuery({
    queryKey: ['employee-stats', tenantId],
    queryFn: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase.schema('atlas_people')
        .from('employees')
        .select('status, department, country_code, contract')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      const rows = (data ?? []) as Pick<EmployeeRow,'status'|'department'|'country_code'|'contract'>[];
      const byDept: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byCountry: Record<string, number> = {};
      rows.forEach((r) => {
        byDept[r.department ?? 'N/A'] = (byDept[r.department ?? 'N/A'] ?? 0) + 1;
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
        byCountry[r.country_code] = (byCountry[r.country_code] ?? 0) + 1;
      });
      return {
        total: rows.length,
        active: byStatus['active'] ?? 0,
        onboarding: byStatus['onboarding'] ?? 0,
        leave: byStatus['leave'] ?? 0,
        notice: byStatus['notice'] ?? 0,
        byDept,
        byCountry,
        cdi: rows.filter((r) => r.contract === 'CDI').length,
        cdd: rows.filter((r) => r.contract === 'CDD').length,
      };
    },
    enabled: isBackendConfigured,
    staleTime: 120_000,
  });
}
