/**
 * M8 Évaluations — agrégat live Supabase (cockpit cycle annuel + bias).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isBackendConfigured, supabase } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };



export interface M8LiveKpis {
  evalTotal: number;
  evalSigned: number;
  evalCalibrated: number;
  avgFinalScore: number;
  classA: number; // top performers (classe A1/A2/A3)
  classC: number; // sous-perf
  feedback360Count: number;
  biasAlertsOpen: number;
  devPlansActive: number;
  fetchedAt: string;
}

export async function fetchM8Live(tenantId = '11111111-1111-1111-1111-111111111111'): Promise<M8LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [evals, fb, bias, devs] = await Promise.all([
      sb.from('m8_evaluations').select('status, note_finale, classe, signed_at, calibrated_at').eq('tenant_id', tenantId),
      sb.from('m8_feedback_360').select('id').eq('tenant_id', tenantId),
      sb.from('m8_bias_alerts').select('resolved_at').eq('tenant_id', tenantId),
      sb.from('m8_dev_plans').select('status').eq('tenant_id', tenantId),
    ]);
    if (evals.error || fb.error || bias.error || devs.error) return null;

    type EvalRow = { status: string; note_finale: number | null; classe: string | null; signed_at: string | null; calibrated_at: string | null };
    type BiasRow = { resolved_at: string | null };
    type DevRow = { status: string };

    const evalArr = (evals.data ?? []) as EvalRow[];
    const biasArr = (bias.data ?? []) as BiasRow[];
    const devArr = (devs.data ?? []) as DevRow[];

    const scores = evalArr.map((e) => e.note_finale).filter((s): s is number => Number.isFinite(s as number));
    const avg = scores.length === 0 ? 0 : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

    return {
      evalTotal: evalArr.length,
      evalSigned: evalArr.filter((e) => e.signed_at !== null).length,
      evalCalibrated: evalArr.filter((e) => e.calibrated_at !== null).length,
      avgFinalScore: avg,
      classA: evalArr.filter((e) => (e.classe ?? '').startsWith('A')).length,
      classC: evalArr.filter((e) => (e.classe ?? '').startsWith('C')).length,
      feedback360Count: (fb.data ?? []).length,
      biasAlertsOpen: biasArr.filter((b) => b.resolved_at === null).length,
      devPlansActive: devArr.filter((d) => d.status === 'active' || d.status === 'in_progress').length,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function useCreateEvalCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, label, startDate, endDate }: {
      code: string; label: string; startDate: string; endDate: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const year = parseInt(code.slice(0, 4), 10) || new Date().getFullYear();
      const { error } = await sb.schema('atlas_people').from('m8_cycles').insert({
        id, tenant_id: ctx.tenantId, code, label, year,
        start_date: startDate, end_date: endDate, phase: 'preparation',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'eval_cycle.create',
        entity: 'm8_cycles', entityId: id,
        payload: { code, label, year },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m8-evals'] }),
  });
}

export function useSubmitAutoEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ evaluationId, scoreOkr, scoreCompetences, scoreComportements, scoreEvolution, scoreDeveloppement, autoEvalText }: {
      evaluationId: string;
      scoreOkr: number; scoreCompetences: number; scoreComportements: number;
      scoreEvolution: number; scoreDeveloppement: number;
      autoEvalText?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m8_evaluations')
        .update({
          score_dim1_okr: scoreOkr,
          score_dim2_competences: scoreCompetences,
          score_dim3_comportements: scoreComportements,
          score_dim4_evolution: scoreEvolution,
          score_dim5_developpement: scoreDeveloppement,
          auto_eval_text: autoEvalText ?? null,
          auto_submitted_at: now,
          status: 'auto_submitted',
          updated_at: now,
        })
        .eq('id', evaluationId).eq('tenant_id', ctx.tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useSubmitAutoEvaluation');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'eval.auto_eval.submit',
        entity: 'm8_evaluations', entityId: evaluationId,
        payload: { evaluationId },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m8-evals'] }),
  });
}

export function useSubmitManagerEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ evaluationId, scoreOkr, scoreCompetences, scoreComportements, scoreEvolution, scoreDeveloppement, managerEvalText, weightDim1 = 35, weightDim2 = 25, weightDim3 = 20, weightDim4 = 12, weightDim5 = 8 }: {
      evaluationId: string;
      scoreOkr: number; scoreCompetences: number; scoreComportements: number;
      scoreEvolution: number; scoreDeveloppement: number;
      managerEvalText?: string;
      weightDim1?: number; weightDim2?: number; weightDim3?: number; weightDim4?: number; weightDim5?: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const noteFinale = Math.round((
        scoreOkr * weightDim1 +
        scoreCompetences * weightDim2 +
        scoreComportements * weightDim3 +
        scoreEvolution * weightDim4 +
        scoreDeveloppement * weightDim5
      ) / 100 * 10) / 10;
      const { data, error } = await sb.schema('atlas_people').from('m8_evaluations')
        .update({
          score_dim1_okr: scoreOkr,
          score_dim2_competences: scoreCompetences,
          score_dim3_comportements: scoreComportements,
          score_dim4_evolution: scoreEvolution,
          score_dim5_developpement: scoreDeveloppement,
          note_finale: noteFinale,
          manager_eval_text: managerEvalText ?? null,
          manager_submitted_at: now,
          status: 'manager_review',
          updated_at: now,
        })
        .eq('id', evaluationId).eq('tenant_id', ctx.tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useSubmitManagerEvaluation');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'eval.manager_eval.submit',
        entity: 'm8_evaluations', entityId: evaluationId,
        payload: { evaluationId },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m8-evals'] }),
  });
}

export function useSubmitFeedback360() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ evaluationId, reviewerRelation, scoreCollab, scoreComm, scoreExcellence, strengths, improvements }: {
      evaluationId: string; reviewerRelation: string;
      scoreCollab: number; scoreComm: number; scoreExcellence: number;
      strengths?: string; improvements?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('m8_feedback_360').insert({
        id, tenant_id: ctx.tenantId, evaluation_id: evaluationId,
        reviewer_id: ctx.employeeId ?? null,
        reviewer_relation: reviewerRelation,
        submitted_at: new Date().toISOString(),
        score_collaboration: scoreCollab,
        score_communication: scoreComm,
        score_excellence: scoreExcellence,
        strengths: strengths ?? null,
        improvements: improvements ?? null,
        visible_to_employee: true,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'eval.feedback360.submit',
        entity: 'm8_feedback_360', entityId: id,
        payload: { evaluationId, reviewerRelation },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m8-evals'] }),
  });
}

export function useCreateDevPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ evaluationId, employeeId, category, title, description, dueDate }: {
      evaluationId: string; employeeId: string; category: string;
      title: string; description?: string; dueDate?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('m8_dev_plans').insert({
        id, tenant_id: ctx.tenantId, evaluation_id: evaluationId,
        employee_id: employeeId, category, title,
        description: description ?? null,
        due_date: dueDate ?? null,
        completion_pct: 0, status: 'planned',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'eval.dev_plan.create',
        entity: 'm8_dev_plans', entityId: id,
        payload: { evaluationId, category },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m8-evals'] }),
  });
}

export function useRecordCalibrationSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cycleId, level, scopeLabel, heldAt, facilitatorId, attendees, decisions }: {
      cycleId: string; level: string; scopeLabel: string; heldAt: string;
      facilitatorId?: string; attendees?: string[]; decisions?: string[];
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('m8_calibration_sessions').insert({
        id, tenant_id: ctx.tenantId, cycle_id: cycleId,
        level, scope_label: scopeLabel,
        held_at: heldAt,
        facilitator_id: facilitatorId ?? ctx.employeeId ?? null,
        attendees: attendees ?? [],
        decisions: decisions ?? [],
        evaluations_reviewed: 0,
        notes_modified: 0,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'eval.calibration.record',
        entity: 'm8_calibration_sessions', entityId: id,
        payload: { cycleId, level, scopeLabel },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m8-evals'] }),
  });
}
