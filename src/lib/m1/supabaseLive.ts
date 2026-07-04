/**
 * M1 Collaborateurs — couche live Supabase.
 * Table principale : employees
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
import type { EmployeeRecord } from '../../data/mock';
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

// ── Écritures (CDC §5.2) ──────────────────────────────────────────────

/** id roster mock `eNN` → uuid DB (motif démo). Un uuid réel passe tel quel. */
export function mockIdToUuid(id: string): string {
  const m = /^e(\d+)$/.exec(id);
  return m ? `e1000001-0000-0000-0000-${m[1].padStart(12, '0')}` : id;
}

/** Projette un EmployeeRecord (partiel) sur les colonnes `employees` (cœur RH). */
function toEmployeeColumns(r: Partial<EmployeeRecord>): Record<string, unknown> {
  const c: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => { if (v !== undefined) c[k] = v; };
  set('first_name', r.firstName);
  set('last_name', r.lastName);
  set('role_title', r.role);
  set('department', r.department);
  set('country_code', r.countryCode);
  set('email', r.email);
  set('contract', r.contractType);
  if (r.hireDate !== undefined) c.hire_date = r.hireDate || null;
  set('status', r.status);
  set('base_salary', r.baseSalary);
  set('taxable_allowances', r.taxableAllowances);
  set('non_taxable_allowances', r.nonTaxableAllowances);
  set('fiscal_parts', r.fiscalParts);
  set('phone_primary', r.phone);
  set('address', r.address);
  return c;
}

/** Création d'un collaborateur (persistée + audit). Renvoie l'uuid DB créé. */
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rec: Partial<EmployeeRecord>): Promise<string> => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const cols = toEmployeeColumns(rec);
      if (cols.status === undefined) cols.status = 'onboarding';
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('employees')
        .insert({ id, tenant_id: ctx.tenantId, created_by: ctx.userId, ...cols })
        .select('id').single();
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'employee.create',
        entity: 'employees', entityId: id, payload: cols, surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-stats'] });
    },
  });
}

/** Mise à jour d'un collaborateur (édition / avenant / mobilité). Persistée + audit. */
export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch, action = 'employee.update' }: { id: string; patch: Partial<EmployeeRecord>; action?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const uuid = mockIdToUuid(id);
      const cols = toEmployeeColumns(patch);
      cols.updated_at = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('employees')
        .update(cols).eq('id', uuid).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('updateEmployee');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action,
        entity: 'employees', entityId: uuid, payload: patch, surface: 'backoffice',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee'] });
      qc.invalidateQueries({ queryKey: ['employee-stats'] });
    },
  });
}

/** Sortie / offboarding (finalisation). Persistée + audit. */
export function useOffboardEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, exitDate, reason }: { id: string; exitDate?: string; reason?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const uuid = mockIdToUuid(id);
      const { data, error } = await sb.schema('atlas_people').from('employees')
        .update({
          status: 'offboarded', lifecycle_status: 'left',
          exit_date: exitDate ?? new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        })
        .eq('id', uuid).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('offboardEmployee');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'employee.offboard',
        entity: 'employees', entityId: uuid, payload: { exitDate, reason }, surface: 'backoffice',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-stats'] });
    },
  });
}

/** Import de masse (insert atomique + audit). Retourne le nombre créé. */
export async function bulkCreateEmployees(records: Partial<EmployeeRecord>[]): Promise<number> {
  const sb = getSupabaseOrThrow();
  const ctx = await resolveSessionContext();
  const rows = records.map((r) => {
    const cols = toEmployeeColumns(r);
    if (cols.status === undefined) cols.status = 'onboarding';
    return { id: crypto.randomUUID(), tenant_id: ctx.tenantId, created_by: ctx.userId, ...cols };
  });
  const { data, error } = await sb.schema('atlas_people').from('employees').insert(rows).select('id');
  if (error) throw mapSupabaseError(error);
  await appendAuditEntry({
    tenantId: ctx.tenantId, actorId: ctx.userId, action: 'employee.bulk_import',
    entity: 'employees', entityId: 'bulk', payload: { count: rows.length }, surface: 'backoffice',
  });
  return data?.length ?? 0;
}
