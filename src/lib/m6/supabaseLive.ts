/**
 * M6 Onboarding — agrégat live Supabase (cockpit + Pulse 30/60/90).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isBackendConfigured, supabase } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };



export interface M6LiveKpis {
  arrivantsTotal: number;
  arrivantsEnCours: number;
  jalonsCompleted: number;
  jalonsOverdue: number;
  pulsesAvgScore: number; // 0-10
  pulsesCount: number;
  tasksOpen: number;
  fetchedAt: string;
}

export async function fetchM6Live(tenantId = '11111111-1111-1111-1111-111111111111'): Promise<M6LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [arrivants, jalons, pulses, tasks] = await Promise.all([
      sb.from('m6_arrivants').select('parcours_status').eq('tenant_id', tenantId),
      sb.from('m6_jalons').select('status, due_date').eq('tenant_id', tenantId),
      sb.from('m6_pulses').select('score').eq('tenant_id', tenantId),
      sb.from('m6_tasks').select('status').eq('tenant_id', tenantId),
    ]);
    if (arrivants.error || jalons.error || pulses.error || tasks.error) return null;

    type ArrivantRow = { parcours_status: string };
    type JalonRow = { status: string; due_date: string | null };
    type PulseRow = { score: string | null };
    type TaskRow = { status: string };

    const arrArr = (arrivants.data ?? []) as ArrivantRow[];
    const jalArr = (jalons.data ?? []) as JalonRow[];
    const pulseArr = (pulses.data ?? []) as PulseRow[];
    const taskArr = (tasks.data ?? []) as TaskRow[];

    const today = new Date().toISOString().slice(0, 10);
    const scoreMap: Record<string, number> = { happy: 10, neutral: 5, unhappy: 1 };
    const validScores = pulseArr.map((p) => scoreMap[p.score ?? ''] ?? null).filter((s): s is number => s !== null);
    const avg = validScores.length === 0 ? 0 : validScores.reduce((a, b) => a + b, 0) / validScores.length;

    return {
      arrivantsTotal: arrArr.length,
      arrivantsEnCours: arrArr.filter((a) => a.parcours_status === 'active').length,
      jalonsCompleted: jalArr.filter((j) => j.status === 'completed').length,
      jalonsOverdue: jalArr.filter((j) => j.status !== 'completed' && j.due_date && j.due_date < today).length,
      pulsesAvgScore: Math.round(avg * 10) / 10,
      pulsesCount: pulseArr.length,
      tasksOpen: taskArr.filter((t) => t.status !== 'done' && t.status !== 'skipped').length,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function useCreateOnboardingJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, startDate, managerId, rhReferentId, buddyId, templateId }: {
      employeeId: string; startDate: string; managerId: string; rhReferentId: string;
      buddyId?: string; templateId?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const finEssaiAt = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 3)).toISOString().slice(0, 10);
      const { error } = await sb.schema('atlas_people').from('m6_arrivants').insert({
        id, tenant_id: ctx.tenantId, employee_id: employeeId,
        start_date: startDate, manager_id: managerId, rh_referent_id: rhReferentId,
        buddy_id: buddyId ?? null, template_id: templateId ?? null,
        parcours_status: 'active', overall_completion_pct: 0,
        fin_essai_at: finEssaiAt,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'onboarding.journey.create',
        entity: 'm6_arrivants', entityId: id,
        payload: { employeeId, startDate },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m6-raw'] }),
  });
}

export function useCompleteOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status = 'done' }: { taskId: string; status?: 'done' | 'skipped' | 'blocked' }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m6_tasks')
        .update({ status, completed_at: status === 'done' ? now : null, updated_at: now })
        .eq('id', taskId).eq('tenant_id', ctx.tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useCompleteOnboardingTask');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'onboarding.task.complete',
        entity: 'm6_tasks', entityId: taskId,
        payload: { taskId, status },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m6-raw'] }),
  });
}

export function useSubmitPulseFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ arrivantId, jalonKind, score, comment }: {
      arrivantId: string; jalonKind: string;
      score: 'happy' | 'neutral' | 'unhappy'; comment?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m6_pulses').insert({
        id, tenant_id: ctx.tenantId, arrivant_id: arrivantId,
        jalon_kind: jalonKind, score,
        triggered_at: now, submitted_at: now,
        comment: comment ?? null,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'onboarding.pulse.submit',
        entity: 'm6_pulses', entityId: id,
        payload: { arrivantId, jalonKind, score },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m6-raw'] }),
  });
}

export function useAssignBuddy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ arrivantId, buddyEmployeeId }: { arrivantId: string; buddyEmployeeId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const { data, error } = await sb.schema('atlas_people').from('m6_arrivants')
        .update({ buddy_id: buddyEmployeeId, updated_at: new Date().toISOString() })
        .eq('id', arrivantId).eq('tenant_id', ctx.tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useAssignBuddy');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'onboarding.buddy.assign',
        entity: 'm6_arrivants', entityId: arrivantId,
        payload: { arrivantId, buddyEmployeeId },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m6-raw'] }),
  });
}

export function useMakeProbationDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ arrivantId, decision, finEssaiAt }: {
      arrivantId: string;
      decision: 'confirmed' | 'extended' | 'terminated';
      finEssaiAt?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const parcours_status = decision === 'confirmed' ? 'completed' : decision === 'terminated' ? 'interrupted' : 'active';
      const patch: Record<string, unknown> = { parcours_status, updated_at: now };
      if (finEssaiAt) patch.fin_essai_at = finEssaiAt;
      if (decision !== 'extended') patch.fin_essai_at = now.slice(0, 10);
      const { data, error } = await sb.schema('atlas_people').from('m6_arrivants')
        .update(patch)
        .eq('id', arrivantId).eq('tenant_id', ctx.tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useMakeProbationDecision');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'onboarding.probation.decision',
        entity: 'm6_arrivants', entityId: arrivantId,
        payload: { arrivantId, decision },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m6-raw'] }),
  });
}

export function useMarkWelcomeBookRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ arrivantId, docKind }: { arrivantId: string; docKind: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m6_welcome_book')
        .update({ read_status: 'read', read_at: now })
        .eq('arrivant_id', arrivantId).eq('doc_kind', docKind).eq('tenant_id', ctx.tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useMarkWelcomeBookRead');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'onboarding.welcome_book.read',
        entity: 'm6_welcome_book', entityId: `${arrivantId}:${docKind}`,
        payload: { arrivantId, docKind },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m6-raw'] }),
  });
}
