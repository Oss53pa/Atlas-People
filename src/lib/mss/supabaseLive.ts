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

// ── Vie quotidienne — Notes de frais équipe (validation manager) ───────

export interface TeamExpenseClaimRow {
  id: string;
  employee_id: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  receipt_url: string | null;
  created_at: string;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_department?: string;
}

/** Notes de frais de l'équipe en attente de validation manager. */
export function useTeamExpenseClaims(tenantId = DEMO, status = 'submitted') {
  return useQuery({
    queryKey: ['mss-expense-claims', tenantId, status],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('expense_claims')
        .select('id,employee_id,amount,currency,category,status,receipt_url,created_at,employees!employee_id(first_name,last_name,department)')
        .eq('tenant_id', tenantId)
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return {
          id: r['id'], employee_id: r['employee_id'], amount: r['amount'], currency: r['currency'],
          category: r['category'], status: r['status'], receipt_url: r['receipt_url'], created_at: r['created_at'],
          employee_first_name: emp?.first_name, employee_last_name: emp?.last_name, employee_department: emp?.department,
        } as TeamExpenseClaimRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

/** Décision manager sur une NDF (approve/refuse) — écriture vérifiée + audit 'mss'.
 *  Chaque décision est tracée individuellement (R15). */
export function useDecideExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ claimId, decision, tenantId, motif }: { claimId: string; decision: 'manager_approved' | 'refused'; tenantId: string; motif?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const { data, error } = await sb.schema('atlas_people').from('expense_claims')
        .update({ status: decision })
        .eq('id', claimId).eq('tenant_id', tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('decideExpenseClaim');
      await appendAuditEntry({
        tenantId, actorId: ctx.userId, action: `expense.${decision === 'refused' ? 'refused' : 'manager_approved'}`,
        entity: 'expense_claims', entityId: claimId, payload: { decision, motif: motif ?? null }, surface: 'mss',
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['mss-expense-claims', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['portal-expenses'] });
    },
  });
}

// ── Vie quotidienne — Demandes RH de l'équipe (lecture) ────────────────

export interface TeamServiceRequestRow {
  id: string;
  reference: string;
  requester_employee_id: string;
  request_type_code: string;
  subject: string;
  urgency: string;
  status: string;
  created_at: string;
  employee_first_name?: string;
  employee_last_name?: string;
}

export function useTeamServiceRequests(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-service-requests', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('service_requests')
        .select('id,reference,requester_employee_id,request_type_code,subject,urgency,status,created_at,employees!requester_employee_id(first_name,last_name)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return {
          id: r['id'], reference: r['reference'], requester_employee_id: r['requester_employee_id'],
          request_type_code: r['request_type_code'], subject: r['subject'], urgency: r['urgency'],
          status: r['status'], created_at: r['created_at'],
          employee_first_name: emp?.first_name, employee_last_name: emp?.last_name,
        } as TeamServiceRequestRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
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
