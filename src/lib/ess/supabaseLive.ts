/**
 * ESS — couche live Supabase pour l'espace collaborateur.
 * Tables : payroll_bulletins, leave_requests
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';

export interface EssBulletinRow {
  id: string;
  cycle_id: string;
  numero: string;
  currency: string;
  brut_total: number;
  net_a_payer: number;
  cout_employeur: number;
  total_cotisations_emp: number;
  total_retenues: number;
  status: string;
  calculated_at: string | null;
  diffused_at: string | null;
  // cycle jointure
  cycle_label?: string;
  cycle_period?: string;
  cycle_pay_date?: string | null;
}

export interface EssLeaveRow {
  id: string;
  leave_type_code: string;
  start_date: string;
  end_date: string;
  counted_days: number;
  reason: string | null;
  status: string;
  submitted_at: string;
  decided_at: string | null;
}

// ── Bulletins de l'employé connecté ───────────────────────────────────

export function useMyBulletins(tenantId = DEMO, employeeId?: string) {
  return useQuery({
    queryKey: ['ess-bulletins', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('payroll_bulletins')
        .select(`
          id, cycle_id, numero, currency,
          brut_total, net_a_payer, cout_employeur, total_cotisations_emp, total_retenues,
          status, calculated_at, diffused_at,
          payroll_cycles!cycle_id(label, period, pay_date)
        `)
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .in('status', ['calculated','validated_n1','validated_n2','signed','diffused','closed'])
        .order('cycle_id', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((b: Record<string, unknown>) => {
        const cyc = b['payroll_cycles'] as Record<string, string> | null;
        return {
          ...b,
          cycle_label: cyc?.label,
          cycle_period: cyc?.period,
          cycle_pay_date: cyc?.pay_date,
        } as EssBulletinRow;
      });
    },
    enabled: isBackendConfigured && Boolean(employeeId),
    staleTime: 60_000,
  });
}

// ── Demandes de congé de l'employé ────────────────────────────────────

export function useMyLeaveRequests(tenantId = DEMO, employeeId?: string) {
  return useQuery({
    queryKey: ['ess-leaves', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('leave_requests')
        .select('id,leave_type_code,start_date,end_date,counted_days,reason,status,submitted_at,decided_at')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as EssLeaveRow[];
    },
    enabled: isBackendConfigured && Boolean(employeeId),
    staleTime: 30_000,
  });
}

export function useSubmitLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      tenantId: string; employeeId: string;
      leaveTypeCode: string; startDate: string; endDate: string;
      countedDays: number; reason?: string;
    }) => {
      if (!supabase) throw new Error('Backend non configuré');
      const { data, error } = await supabase.schema('atlas_people').from('leave_requests').insert({
        tenant_id: payload.tenantId,
        employee_id: payload.employeeId,
        leave_type_code: payload.leaveTypeCode,
        start_date: payload.startDate,
        end_date: payload.endDate,
        counted_days: payload.countedDays,
        reason: payload.reason ?? null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['ess-leaves', vars.tenantId, vars.employeeId] });
      qc.invalidateQueries({ queryKey: ['mss-approvals', vars.tenantId] });
    },
  });
}
