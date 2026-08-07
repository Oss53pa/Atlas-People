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
        entity: 'expense_claims', entityId: claimId, payload: { decision }, surface: 'mss',
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

// ── Performance équipe — évaluations (m8) & objectifs (m7) ─────────────

export interface TeamEvaluationRow {
  id: string;
  employee_id: string;
  ref: string | null;
  status: string;
  note_finale: number | null;
  classe: string | null;
  score_dim1_okr: number | null;
  score_dim2_competences: number | null;
  score_dim3_comportements: number | null;
  score_dim4_evolution: number | null;
  score_dim5_developpement: number | null;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_department?: string;
}

export function useTeamEvaluations(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-evaluations', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('m8_evaluations')
        .select('id,employee_id,ref,status,note_finale,classe,score_dim1_okr,score_dim2_competences,score_dim3_comportements,score_dim4_evolution,score_dim5_developpement,employees!employee_id(first_name,last_name,department)')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return { ...r, employees: undefined, employee_first_name: emp?.first_name, employee_last_name: emp?.last_name, employee_department: emp?.department } as unknown as TeamEvaluationRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export interface TeamObjectiveRow {
  id: string;
  owner_id: string | null;
  title: string;
  status: string;
  final_score: number | null;
  team_label: string | null;
  employee_first_name?: string;
  employee_last_name?: string;
}

export function useTeamObjectives(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-objectives', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('m7_objectives')
        .select('id,owner_id,title,status,final_score,team_label,level,employees!owner_id(first_name,last_name)')
        .eq('tenant_id', tenantId)
        .in('level', ['individuel', 'equipe'])
        .order('level', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return { ...r, employees: undefined, employee_first_name: emp?.first_name, employee_last_name: emp?.last_name } as unknown as TeamObjectiveRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

// ── Développement équipe — validations formation (m11) & compétences (m9) ──

export interface TeamTrainingRequestRow {
  id: string;
  employee_id: string;
  session_id: string;
  status: string;
  requested_at: string;
  allocated_cost: number | null;
  course_title?: string;
  employee_first_name?: string;
  employee_last_name?: string;
}

/** Demandes d'inscription formation de l'équipe en attente de validation manager. */
export function useTeamTrainingRequests(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-training-requests', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const sb = supabase.schema('atlas_people');
      const { data, error } = await sb
        .from('m11_registrations')
        .select('id,employee_id,session_id,status,requested_at,allocated_cost,employees!employee_id(first_name,last_name)')
        .eq('tenant_id', tenantId)
        .eq('status', 'requested')
        .order('requested_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Record<string, unknown>[];
      // Résolution de l'intitulé : registration → session.course_id → course.title
      const sessionIds = [...new Set(rows.map((r) => r['session_id'] as string).filter(Boolean))];
      const titleBySession = new Map<string, string>();
      if (sessionIds.length) {
        const { data: sess } = await sb.from('m11_training_sessions').select('id,course_id').in('id', sessionIds);
        const courseIds = [...new Set((sess ?? []).map((s: Record<string, unknown>) => s['course_id'] as string).filter(Boolean))];
        const titleByCourse = new Map<string, string>();
        if (courseIds.length) {
          const { data: courses } = await sb.from('m11_courses').select('id,title').in('id', courseIds);
          (courses ?? []).forEach((c: Record<string, unknown>) => titleByCourse.set(c['id'] as string, c['title'] as string));
        }
        (sess ?? []).forEach((s: Record<string, unknown>) => titleBySession.set(s['id'] as string, titleByCourse.get(s['course_id'] as string) ?? ''));
      }
      return rows.map((r) => {
        const emp = r['employees'] as Record<string, string> | null;
        return {
          id: r['id'], employee_id: r['employee_id'], session_id: r['session_id'], status: r['status'],
          requested_at: r['requested_at'], allocated_cost: r['allocated_cost'],
          course_title: titleBySession.get(r['session_id'] as string),
          employee_first_name: emp?.first_name, employee_last_name: emp?.last_name,
        } as TeamTrainingRequestRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

/** Décision manager sur une demande de formation (approve/refuse) + audit 'mss'. */
export function useDecideTrainingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ registrationId, decision, tenantId }: { registrationId: string; decision: 'approved' | 'cancelled'; tenantId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const patch = decision === 'approved'
        ? { status: 'approved', approved_at: new Date().toISOString(), approved_by: ctx.employeeId }
        : { status: 'cancelled', cancelled_at: new Date().toISOString() };
      const { data, error } = await sb.schema('atlas_people').from('m11_registrations')
        .update(patch).eq('id', registrationId).eq('tenant_id', tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('decideTraining');
      await appendAuditEntry({
        tenantId, actorId: ctx.userId, action: `training.${decision === 'approved' ? 'approved' : 'refused'}`,
        entity: 'm11_registrations', entityId: registrationId, payload: { decision }, surface: 'mss',
      });
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['mss-training-requests', vars.tenantId] }),
  });
}

export interface TeamSkillMatrixRow {
  id: string;
  employee_id: string;
  skill_id: string;
  level: number;
  target_level: number | null;
  certified: boolean;
  skill_name?: string;
  employee_first_name?: string;
  employee_last_name?: string;
}

export function useTeamSkillMatrix(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-skill-matrix', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('m9_skill_matrix')
        .select('id,employee_id,skill_id,level,target_level,certified,m9_skills!skill_id(name),employees!employee_id(first_name,last_name)')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const sk = r['m9_skills'] as Record<string, string> | null;
        const emp = r['employees'] as Record<string, string> | null;
        return {
          id: r['id'], employee_id: r['employee_id'], skill_id: r['skill_id'], level: r['level'],
          target_level: r['target_level'], certified: r['certified'],
          skill_name: sk?.name, employee_first_name: emp?.first_name, employee_last_name: emp?.last_name,
        } as TeamSkillMatrixRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

// ── Recrutement équipe (m5) ────────────────────────────────────────────

export interface TeamJobRow {
  id: string;
  ref: string;
  title: string;
  department: string | null;
  status: string;
  applications_count: number | null;
  opened_at: string | null;
  target_close_at: string | null;
  hiring_manager_id: string | null;
}

export function useTeamJobs(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-jobs', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      // m5_jobs.hiring_manager_id n'a pas de FK employees → pas d'embed (le nom
      // manager se résout côté page via mockEmpId + roster si besoin).
      const { data, error } = await supabase.schema('atlas_people')
        .from('m5_jobs')
        .select('id,ref,title,department,status,applications_count,opened_at,target_close_at,hiring_manager_id')
        .eq('tenant_id', tenantId)
        .order('opened_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamJobRow[];
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export interface TeamApplicationRow {
  id: string;
  ref: string;
  stage: string;
  score: number | null;
  applied_at: string | null;
  candidate_first_name?: string;
  candidate_last_name?: string;
  candidate_role?: string;
  job_title?: string;
  job_hiring_manager_id?: string;
}

export function useTeamApplications(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-applications', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('m5_applications')
        .select('id,ref,stage,score,applied_at,m5_candidates!candidate_id(first_name,last_name,current_role_label),m5_jobs!job_id(title,hiring_manager_id)')
        .eq('tenant_id', tenantId)
        .order('applied_at', { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const c = r['m5_candidates'] as Record<string, string> | null;
        const j = r['m5_jobs'] as Record<string, string> | null;
        return {
          id: r['id'], ref: r['ref'], stage: r['stage'], score: r['score'], applied_at: r['applied_at'],
          candidate_first_name: c?.first_name, candidate_last_name: c?.last_name, candidate_role: c?.current_role_label,
          job_title: j?.title, job_hiring_manager_id: j?.hiring_manager_id,
        } as TeamApplicationRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

// ── Temps équipe — heures supplémentaires (validation) & présence ──────

export interface TeamOvertimeRow {
  id: string;
  employee_id: string;
  work_date: string;
  hours: number;
  rate_pct: number;
  category: string;
  status: string;
  employee_first_name?: string;
  employee_last_name?: string;
}

/** Heures supplémentaires de l'équipe. status='all' pour ignorer le filtre. */
export function useTeamOvertime(tenantId = DEMO, status: string | 'all' = 'detected') {
  return useQuery({
    queryKey: ['mss-overtime', tenantId, status],
    queryFn: async () => {
      if (!supabase) return [];
      let q = supabase.schema('atlas_people')
        .from('overtime_records')
        .select('id,employee_id,work_date,hours,rate_pct,category,status,employees!employee_id(first_name,last_name)')
        .eq('tenant_id', tenantId)
        .order('work_date', { ascending: false });
      if (status !== 'all') q = (q as typeof q).eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return { ...r, employees: undefined, employee_first_name: emp?.first_name, employee_last_name: emp?.last_name } as unknown as TeamOvertimeRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

/** Décision manager sur des heures supplémentaires (validate/refuse) + audit 'mss'.
 *  Statuts conformes au CHECK overtime_records_status. */
export function useDecideOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ overtimeId, decision, tenantId }: { overtimeId: string; decision: 'validated' | 'refused'; tenantId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const { data, error } = await sb.schema('atlas_people').from('overtime_records')
        .update({ status: decision, validated_by: ctx.employeeId, validated_at: new Date().toISOString() })
        .eq('id', overtimeId).eq('tenant_id', tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('decideOvertime');
      await appendAuditEntry({
        tenantId, actorId: ctx.userId, action: `overtime.${decision}`,
        entity: 'overtime_records', entityId: overtimeId, payload: { decision }, surface: 'mss',
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['mss-overtime', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['portal-overtime'] });
    },
  });
}

export interface TeamClockingRow {
  id: string;
  employee_id: string;
  clocking_type: string;
  clocked_at: string;
  method: string;
  verification_status: string;
  employee_first_name?: string;
  employee_last_name?: string;
}

/** Présence : derniers pointages de l'équipe (lecture). */
export function useTeamClockings(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-clockings', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('time_clockings')
        .select('id,employee_id,clocking_type,clocked_at,method,verification_status,employees!employee_id(first_name,last_name)')
        .eq('tenant_id', tenantId)
        .order('clocked_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return { ...r, employees: undefined, employee_first_name: emp?.first_name, employee_last_name: emp?.last_name } as unknown as TeamClockingRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 20_000,
  });
}

// ── Paramètres — Délégations de validation (table manager_delegations) ──

/** eNN → uuid démo (mapping fixe du tenant de démonstration). */
const empUuid = (mockId: string) => 'e1000001-0000-0000-0000-' + String(parseInt(mockId.slice(1), 10) || 0).padStart(12, '0');
export { empUuid };

export interface DelegationRow {
  id: string;
  delegator_employee_id: string;
  delegate_employee_id: string;
  delegate_name: string | null;
  scope: string[];
  status: string;
  message: string | null;
  valid_from: string | null;
  valid_until: string | null;
}

export function useMyDelegations(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-delegations', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('manager_delegations')
        .select('id,delegator_employee_id,delegate_employee_id,delegate_name,scope,status,message,valid_from,valid_until')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DelegationRow[];
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

export function useCreateDelegation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { tenantId: string; delegatorEmployeeId: string; delegateEmployeeId: string; delegateName: string; scope: string[]; message?: string; validFrom?: string; validUntil?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const { data, error } = await sb.schema('atlas_people').from('manager_delegations').insert({
        tenant_id: v.tenantId,
        delegator_employee_id: v.delegatorEmployeeId,
        delegate_employee_id: v.delegateEmployeeId,
        delegate_name: v.delegateName,
        scope: v.scope,
        status: 'active',
        message: v.message ?? null,
        valid_from: v.validFrom ?? null,
        valid_until: v.validUntil ?? null,
        created_by: ctx.employeeId,
      }).select('id').single();
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({ tenantId: v.tenantId, actorId: ctx.userId, action: 'delegation.created', entity: 'manager_delegations', entityId: data.id as string, payload: { delegate_employee_id: v.delegateEmployeeId ?? v.delegateName, scope: v.scope }, surface: 'mss' });
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['mss-delegations', v.tenantId] }),
  });
}

export function useRevokeDelegation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: string; tenantId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const { data, error } = await sb.schema('atlas_people').from('manager_delegations')
        .update({ status: 'revoked', revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id).eq('tenant_id', tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('revokeDelegation');
      await appendAuditEntry({ tenantId, actorId: ctx.userId, action: 'delegation.revoked', entity: 'manager_delegations', entityId: id, payload: {}, surface: 'mss' });
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['mss-delegations', v.tenantId] }),
  });
}

// ── Reporting — agrégats live (compléments aux dérivations roster) ──────

export interface MssReportingLive {
  leaveApproved: number;
  leaveDays: number;
  overtimeHours: number;
  trainingCount: number;
  trainingHours: number;
  payrollNetMass: number;
  payrollBrutMass: number;
  evalClasses: Record<string, number>;
}

export function useMssReportingLive(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-reporting-live', tenantId],
    queryFn: async (): Promise<MssReportingLive> => {
      const empty: MssReportingLive = { leaveApproved: 0, leaveDays: 0, overtimeHours: 0, trainingCount: 0, trainingHours: 0, payrollNetMass: 0, payrollBrutMass: 0, evalClasses: {} };
      if (!supabase) return empty;
      const sb = supabase.schema('atlas_people');
      const [leaves, overtime, trainings, bulletins, evals] = await Promise.all([
        sb.from('leave_requests').select('counted_days,status').eq('tenant_id', tenantId).eq('status', 'approved'),
        sb.from('overtime_records').select('hours,status').eq('tenant_id', tenantId).eq('status', 'validated'),
        sb.from('m11_registrations').select('attended_hours,status').eq('tenant_id', tenantId).in('status', ['approved', 'confirmed', 'attended', 'completed']),
        sb.from('payroll_bulletins').select('net_a_payer,brut_total,status').eq('tenant_id', tenantId).in('status', ['calculated', 'validated_n1', 'validated_n2', 'signed', 'diffused', 'closed']),
        sb.from('m8_evaluations').select('classe').eq('tenant_id', tenantId),
      ]);
      const sum = (rows: unknown, key: string) => ((rows as Record<string, number>[] | null) ?? []).reduce((s, r) => s + (Number(r[key]) || 0), 0);
      const evalClasses: Record<string, number> = {};
      ((evals.data as { classe: string | null }[] | null) ?? []).forEach((e) => { if (e.classe) evalClasses[e.classe] = (evalClasses[e.classe] ?? 0) + 1; });
      return {
        leaveApproved: (leaves.data ?? []).length,
        leaveDays: sum(leaves.data, 'counted_days'),
        overtimeHours: sum(overtime.data, 'hours'),
        trainingCount: (trainings.data ?? []).length,
        trainingHours: sum(trainings.data, 'attended_hours'),
        payrollNetMass: sum(bulletins.data, 'net_a_payer'),
        payrollBrutMass: sum(bulletins.data, 'brut_total'),
        evalClasses,
      };
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

// ── Ma pratique — développement propre du manager ──────────────────────

export interface ManagerPracticeData {
  trainings: { id: string; status: string; course_title?: string; requested_at: string | null }[];
  evaluation: { note_finale: number | null; classe: string | null; status: string } | null;
}

export function useManagerOwnPractice(tenantId = DEMO, managerEmployeeId?: string) {
  return useQuery({
    queryKey: ['mss-practice', tenantId, managerEmployeeId],
    queryFn: async (): Promise<ManagerPracticeData> => {
      const empty: ManagerPracticeData = { trainings: [], evaluation: null };
      if (!supabase || !managerEmployeeId) return empty;
      const sb = supabase.schema('atlas_people');
      const [regs, evalRes] = await Promise.all([
        sb.from('m11_registrations').select('id,status,session_id,requested_at').eq('tenant_id', tenantId).eq('employee_id', managerEmployeeId).order('requested_at', { ascending: false }),
        sb.from('m8_evaluations').select('note_finale,classe,status').eq('tenant_id', tenantId).eq('employee_id', managerEmployeeId).maybeSingle(),
      ]);
      // Résolution intitulé formation (registration → session → course).
      const regRows = (regs.data ?? []) as Record<string, unknown>[];
      const sessionIds = [...new Set(regRows.map((r) => r['session_id'] as string).filter(Boolean))];
      const titleBySession = new Map<string, string>();
      if (sessionIds.length) {
        const { data: sess } = await sb.from('m11_training_sessions').select('id,course_id').in('id', sessionIds);
        const courseIds = [...new Set((sess ?? []).map((s: Record<string, unknown>) => s['course_id'] as string).filter(Boolean))];
        const titleByCourse = new Map<string, string>();
        if (courseIds.length) {
          const { data: courses } = await sb.from('m11_courses').select('id,title').in('id', courseIds);
          (courses ?? []).forEach((c: Record<string, unknown>) => titleByCourse.set(c['id'] as string, c['title'] as string));
        }
        (sess ?? []).forEach((s: Record<string, unknown>) => titleBySession.set(s['id'] as string, titleByCourse.get(s['course_id'] as string) ?? ''));
      }
      return {
        trainings: regRows.map((r) => ({ id: r['id'] as string, status: r['status'] as string, course_title: titleBySession.get(r['session_id'] as string), requested_at: (r['requested_at'] as string) ?? null })),
        evaluation: (evalRes.data as ManagerPracticeData['evaluation']) ?? null,
      };
    },
    enabled: isBackendConfigured && Boolean(managerEmployeeId),
    staleTime: 60_000,
  });
}

// ── Annuaire équipe ───────────────────────────────────────────────────

export interface TeamDirectoryRow {
  id: string;
  first_name: string;
  last_name: string;
  department: string | null;
  role_title: string | null;
  status: string;
  hire_date: string | null;
  birth_date: string | null;
  manager_id: string | null;
  employee_number: string | null;
  site: string | null;
  email: string | null;
  phone: string | null;
}

export function useTeamDirectory(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-team-directory', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('employees')
        .select('id, first_name, last_name, department, role_title, status, hire_date, birth_date, manager_id, employee_number, site, email, phone')
        .eq('tenant_id', tenantId)
        .order('last_name');
      if (error) throw error;
      return (data ?? []) as TeamDirectoryRow[];
    },
    enabled: isBackendConfigured,
    staleTime: 120_000,
  });
}

export const dirName = (e: TeamDirectoryRow) => `${e.first_name} ${e.last_name}`;

// ── Soldes de congés ──────────────────────────────────────────────────

export interface TeamLeaveBalanceRow {
  id: string;
  employee_id: string;
  leave_type_code: string;
  balance: number;
  taken: number;
  remaining: number;
  expiry_date: string | null;
}

export function useTeamLeaveBalances(tenantId = DEMO) {
  return useQuery({
    queryKey: ['mss-leave-balances', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('leave_balances')
        .select('id, employee_id, leave_type_code, balance, taken, remaining, expiry_date')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      return (data ?? []) as TeamLeaveBalanceRow[];
    },
    enabled: isBackendConfigured,
    staleTime: 120_000,
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
