/**
 * MSS — couche live Supabase pour l'espace manager.
 * Tables : leave_requests, employees
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';

export interface MssApprovalRow {
  id: string;
  employee_id: string;
  leave_type_code: string;
  start_date: string;
  end_date: string;
  counted_days: number;
  reason: string | null;
  status: string;
  submitted_at: string;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_department?: string;
  employee_role_title?: string;
}

export function usePendingApprovals(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-approvals', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('leave_requests')
        .select(`
          id, employee_id, leave_type_code, start_date, end_date,
          counted_days, reason, status, submitted_at,
          employees!employee_id(first_name, last_name, department, role_title)
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return {
          ...r,
          employee_first_name: emp?.first_name,
          employee_last_name: emp?.last_name,
          employee_department: emp?.department,
          employee_role_title: emp?.role_title,
        } as MssApprovalRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
    refetchInterval: 60_000, // refresh auto toutes les minutes
  });
}

export function useAllLeaveRequests(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-all-leaves', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('leave_requests')
        .select(`
          id, employee_id, leave_type_code, start_date, end_date,
          counted_days, reason, status, submitted_at, decided_at,
          employees!employee_id(first_name, last_name, department)
        `)
        .eq('tenant_id', tenantId)
        .order('submitted_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return { ...r, employee_first_name: emp?.first_name, employee_last_name: emp?.last_name, employee_department: emp?.department } as MssApprovalRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

/** Décision manager sur une demande de congé (contrat §3.1 : id réel, écriture
 *  vérifiée, audit chaîné). Statuts conformes au CHECK leave_requests_status. */
export function useDecideLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, decision, tenantId }: { requestId: string; decision: 'approved' | 'refused' | 'info_requested'; tenantId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const { data, error } = await sb.schema('atlas_people').from('leave_requests')
        .update({ status: decision, decided_at: new Date().toISOString() })
        .eq('id', requestId).eq('tenant_id', tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('decideLeave');
      await appendAuditEntry({
        tenantId, actorId: ctx.userId, action: `leave.${decision}`,
        entity: 'leave_requests', entityId: requestId, payload: { decision }, surface: 'mss',
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['mss-approvals', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['mss-all-leaves', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['m2-leaves', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['m2-leaves-full', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['m2-time-stats', vars.tenantId] });
    },
  });
}

export function useMssTeamStats(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-team-stats', tenantId],
    queryFn: async () => {
      if (!supabase) return null;
      const [empRes, pendingRes] = await Promise.all([
        supabase.schema('atlas_people').from('employees').select('status', { count: 'exact' }).eq('tenant_id', tenantId),
        supabase.schema('atlas_people').from('leave_requests').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pending'),
      ]);
      return {
        teamSize: empRes.count ?? 0,
        activeCount: (empRes.data ?? []).filter((e: { status: string }) => e.status === 'active').length,
        onLeaveCount: (empRes.data ?? []).filter((e: { status: string }) => e.status === 'leave').length,
        pendingApprovals: pendingRes.count ?? 0,
      };
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}
