/**
 * M7 OKR — agrégat live Supabase (cockpit · cycles · check-ins).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isBackendConfigured, supabase } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };



export interface M7LiveKpis {
  objectivesTotal: number;
  objectivesActive: number;
  objectivesCompleted: number;
  krsTotal: number;
  krsAvgScore: number;
  krsAtRisk: number;
  checkInsLast30d: number;
  avgConfidence: number;
  fetchedAt: string;
}

export async function fetchM7Live(tenantId = '11111111-1111-1111-1111-111111111111'): Promise<M7LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [objs, krs, cis] = await Promise.all([
      sb.from('m7_objectives').select('status, final_score').eq('tenant_id', tenantId),
      sb.from('m7_key_results').select('score, confidence').eq('tenant_id', tenantId),
      sb.from('m7_check_ins').select('occurred_at, confidence').eq('tenant_id', tenantId),
    ]);
    if (objs.error || krs.error || cis.error) return null;

    type ObjRow = { status: string; final_score: number | null };
    type KrRow = { score: number | null; confidence: number | null };
    type CiRow = { occurred_at: string; confidence: number | null };

    const objArr = (objs.data ?? []) as ObjRow[];
    const krArr = (krs.data ?? []) as KrRow[];
    const ciArr = (cis.data ?? []) as CiRow[];

    const krScores = krArr.map((k) => k.score).filter((s): s is number => Number.isFinite(s as number));
    const krConfs = krArr.map((k) => k.confidence).filter((c): c is number => Number.isFinite(c as number));
    const ciConfs = ciArr.map((c) => c.confidence).filter((c): c is number => Number.isFinite(c as number));
    const allConfs = [...krConfs, ...ciConfs];

    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();

    return {
      objectivesTotal: objArr.length,
      objectivesActive: objArr.filter((o) => o.status === 'active' || o.status === 'in_progress').length,
      objectivesCompleted: objArr.filter((o) => o.status === 'completed' || o.status === 'closed').length,
      krsTotal: krArr.length,
      krsAvgScore: krScores.length === 0 ? 0 : Math.round((krScores.reduce((a, b) => a + b, 0) / krScores.length) * 100) / 100,
      krsAtRisk: krArr.filter((k) => (k.confidence ?? 5) < 4).length,
      checkInsLast30d: ciArr.filter((c) => c.occurred_at >= cutoff).length,
      avgConfidence: allConfs.length === 0 ? 0 : Math.round((allConfs.reduce((a, b) => a + b, 0) / allConfs.length) * 10) / 10,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

const UI_LEVEL_TO_DB: Record<string, string> = {
  company: 'entreprise', department: 'direction', team: 'equipe', individual: 'individuel',
};

export function useCreateOkrCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, label, startDate, endDate }: {
      code: string; label: string; startDate: string; endDate: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('m7_cycles').insert({
        id, tenant_id: ctx.tenantId, code, label,
        start_date: startDate, end_date: endDate, status: 'planning',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'okr_cycle.create',
        entity: 'm7_cycles', entityId: id,
        payload: { code, label },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m7-raw'] }),
  });
}

export function useCreateObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cycleId, level, title, description }: {
      cycleId: string; level: string; title: string; description?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const dbLevel = UI_LEVEL_TO_DB[level] ?? level;
      const ref = `OBJ-${new Date().getFullYear()}-${id.slice(0, 6).toUpperCase()}`;
      const { error } = await sb.schema('atlas_people').from('m7_objectives').insert({
        id, tenant_id: ctx.tenantId, cycle_id: cycleId, ref,
        level: dbLevel, title, description: description ?? null,
        owner_id: ctx.employeeId, status: 'draft',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'objective.create',
        entity: 'm7_objectives', entityId: id,
        payload: { cycleId, level: dbLevel, ref },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m7-raw'] }),
  });
}

export function useCreateKeyResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ objectiveId, title, type, baseline, target, unit, weightPct }: {
      objectiveId: string; title: string; type: string;
      baseline: number; target: number; unit?: string; weightPct: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const ref = `KR-${new Date().getFullYear()}-${id.slice(0, 6).toUpperCase()}`;
      const { error } = await sb.schema('atlas_people').from('m7_key_results').insert({
        id, tenant_id: ctx.tenantId, objective_id: objectiveId, ref,
        title, type, baseline, target, current_value: baseline,
        unit: unit ?? null, weight_pct: weightPct,
        score: null, confidence: 5,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'key_result.create',
        entity: 'm7_key_results', entityId: id,
        payload: { objectiveId, ref, type },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m7-raw'] }),
  });
}

export function useSubmitCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ keyResultId, reportedValue, confidence, blockers, nextStep }: {
      keyResultId: string; reportedValue: number; confidence: number;
      blockers?: string; nextStep?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      if (!ctx.employeeId) throw new Error('Aucun employé associé à votre compte');
      const id = crypto.randomUUID();
      const occurredAt = new Date().toISOString();
      const ap = sb.schema('atlas_people');
      const { error: ciErr } = await ap.from('m7_check_ins').insert({
        id, tenant_id: ctx.tenantId, key_result_id: keyResultId,
        occurred_at: occurredAt, author_id: ctx.employeeId,
        reported_value: reportedValue, computed_score: null,
        confidence, blockers: blockers ?? null, next_step: nextStep ?? null,
      });
      if (ciErr) throw mapSupabaseError(ciErr);
      await ap.from('m7_key_results')
        .update({ current_value: reportedValue, confidence, last_updated_at: occurredAt })
        .eq('id', keyResultId).eq('tenant_id', ctx.tenantId);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'check_in.submit',
        entity: 'm7_check_ins', entityId: id,
        payload: { keyResultId, confidence },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m7-raw'] }),
  });
}

export function useUpdateCycleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cycleId, status }: { cycleId: string; status: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const patch: Record<string, unknown> = { status };
      if (status === 'closed') patch.closed_at = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m7_cycles')
        .update(patch)
        .eq('id', cycleId).eq('tenant_id', ctx.tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useUpdateCycleStatus');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'okr_cycle.status_change',
        entity: 'm7_cycles', entityId: cycleId,
        payload: { status },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m7-raw'] }),
  });
}

export function useSubmitOkrScoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ keyResultId, score }: { keyResultId: string; score: number }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const { data, error } = await sb.schema('atlas_people').from('m7_key_results')
        .update({ score, last_updated_at: new Date().toISOString() })
        .eq('id', keyResultId).eq('tenant_id', ctx.tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useSubmitOkrScoring');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'okr_scoring.submit',
        entity: 'm7_key_results', entityId: keyResultId,
        payload: { score },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m7-raw'] }),
  });
}
