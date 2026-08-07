/**
 * M5 Recrutement — agrégat live Supabase (cockpit + Kanban SLA).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isBackendConfigured, supabase } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };



export interface M5LiveKpis {
  jobsOpen: number;
  jobsTotal: number;
  applicationsActive: number;
  interviewsPlanned: number;
  offersPending: number;
  offersAccepted: number;
  candidatesPool: number;
  referrals: number;
  fetchedAt: string;
}

export async function fetchM5Live(tenantId = '11111111-1111-1111-1111-111111111111'): Promise<M5LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [jobs, apps, intvs, offers, cands, refs] = await Promise.all([
      sb.from('m5_jobs').select('status').eq('tenant_id', tenantId),
      sb.from('m5_applications').select('stage').eq('tenant_id', tenantId),
      sb.from('m5_interviews').select('status').eq('tenant_id', tenantId),
      sb.from('m5_offers').select('status').eq('tenant_id', tenantId),
      sb.from('m5_candidates').select('id').eq('tenant_id', tenantId),
      sb.from('m5_referrals').select('id').eq('tenant_id', tenantId),
    ]);
    if (jobs.error || apps.error || intvs.error || offers.error || cands.error || refs.error) return null;

    type JobRow = { status: string };
    type AppRow = { stage: string };
    type IntvRow = { status: string };
    type OfferRow = { status: string };

    const jobsArr = (jobs.data ?? []) as JobRow[];
    const appsArr = (apps.data ?? []) as AppRow[];
    const intvsArr = (intvs.data ?? []) as IntvRow[];
    const offersArr = (offers.data ?? []) as OfferRow[];

    return {
      jobsOpen: jobsArr.filter((j) => j.status === 'open').length,
      jobsTotal: jobsArr.length,
      applicationsActive: appsArr.filter((a) => !['hired', 'rejected', 'withdrawn'].includes(a.stage)).length,
      interviewsPlanned: intvsArr.filter((i) => i.status === 'planned' || i.status === 'scheduled').length,
      offersPending: offersArr.filter((o) => o.status === 'sent' || o.status === 'negotiating').length,
      offersAccepted: offersArr.filter((o) => o.status === 'accepted').length,
      candidatesPool: (cands.data ?? []).length,
      referrals: (refs.data ?? []).length,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function useAdvanceApplicationStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, newStage, reason }: { applicationId: string; newStage: string; reason?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { stage: newStage, stage_entered_at: now, updated_at: now };
      if (reason) patch.stage_change_reason = reason;
      const { data, error } = await sb.schema('atlas_people').from('m5_applications')
        .update(patch).eq('id', applicationId).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useAdvanceApplicationStage');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'application.stage_changed',
        entity: 'm5_applications', entityId: applicationId,
        payload: { applicationId, newStage },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m5-raw'] }),
  });
}

export function useRejectApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, reason, feedback }: { applicationId: string; reason: string; feedback?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m5_applications')
        .update({ stage: 'rejected', stage_entered_at: now, rejection_reason: reason, rejection_feedback: feedback ?? null, updated_at: now })
        .eq('id', applicationId).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useRejectApplication');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'application.rejected',
        entity: 'm5_applications', entityId: applicationId,
        payload: { applicationId, reason },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m5-raw'] }),
  });
}

export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, interviewType, scheduledStart, scheduledEnd, modality }: {
      applicationId: string; interviewType: string;
      scheduledStart: string; scheduledEnd: string;
      modality: 'phone' | 'video' | 'in_person';
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m5_interviews').insert({
        id, tenant_id: ctx.tenantId, application_id: applicationId,
        interview_type: interviewType, scheduled_start: scheduledStart, scheduled_end: scheduledEnd,
        modality, status: 'scheduled', created_by: ctx.userId, created_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'interview.scheduled',
        entity: 'm5_interviews', entityId: id,
        payload: { applicationId, interviewType, scheduledStart, modality },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m5-raw'] }),
  });
}

export function useRecordInterviewOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ interviewId, outcome, notes }: {
      interviewId: string; outcome: 'completed' | 'no_show' | 'cancelled'; notes?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m5_interviews')
        .update({ status: outcome, actual_end: outcome === 'completed' ? now : null, notes: notes ?? null, updated_at: now })
        .eq('id', interviewId).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useRecordInterviewOutcome');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'interview.held',
        entity: 'm5_interviews', entityId: interviewId,
        payload: { interviewId, outcome },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m5-raw'] }),
  });
}

export function useEmitFormalOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, salaryAmount, currency, contractType, startDate }: {
      applicationId: string; salaryAmount: number; currency: string;
      contractType: string; startDate: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m5_offers').insert({
        id, tenant_id: ctx.tenantId, application_id: applicationId,
        salary_amount: salaryAmount, currency, contract_type: contractType,
        start_date: startDate, status: 'draft', created_by: ctx.userId, created_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'offer_emitted.created',
        entity: 'm5_offers', entityId: id,
        payload: { applicationId, contractType, startDate },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m5-raw'] }),
  });
}

export function useRegisterHiringDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, decisionSummary }: { applicationId: string; decisionSummary?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m5_applications')
        .update({ stage: 'hired', stage_entered_at: now, updated_at: now })
        .eq('id', applicationId).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useRegisterHiringDecision');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'decision.hire',
        entity: 'm5_applications', entityId: applicationId,
        payload: { applicationId, decisionSummary: decisionSummary ?? null },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m5-raw'] }),
  });
}
