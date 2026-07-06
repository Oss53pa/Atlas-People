/**
 * M10 Carrières — agrégat live Supabase (cockpit · succession · mentorat).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isBackendConfigured, supabase } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };



export interface M10LiveKpis {
  criticalRoles: number;
  successionCovered: number; // critical_roles avec >=1 successor
  successorsReadyNow: number;
  successorsTotal: number;
  talentPools: number;
  poolsBudget: number; // FCFA
  mentoratPairs: number;
  promotionsApproved: number;
  promotionsPending: number;
  fetchedAt: string;
}

export async function fetchM10Live(tenantId = '11111111-1111-1111-1111-111111111111'): Promise<M10LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [cr, sc, tp, mp, pr] = await Promise.all([
      sb.from('m10_critical_roles').select('id').eq('tenant_id', tenantId),
      sb.from('m10_succession_successors').select('critical_role_id, readiness').eq('tenant_id', tenantId),
      sb.from('m10_talent_pools').select('annual_budget').eq('tenant_id', tenantId),
      sb.from('m10_mentorat_pairs').select('status').eq('tenant_id', tenantId),
      sb.from('m10_promotions').select('status').eq('tenant_id', tenantId),
    ]);
    if (cr.error || sc.error || tp.error || mp.error || pr.error) return null;

    type ScRow = { critical_role_id: string; readiness: string };
    type TpRow = { annual_budget: number | null };
    type MpRow = { status: string };
    type PrRow = { status: string };

    const scArr = (sc.data ?? []) as ScRow[];
    const tpArr = (tp.data ?? []) as TpRow[];
    const mpArr = (mp.data ?? []) as MpRow[];
    const prArr = (pr.data ?? []) as PrRow[];

    const coveredRoles = new Set(scArr.map((s) => s.critical_role_id));
    const budgetSum = tpArr.reduce<number>((a, b) => a + (Number.isFinite(b.annual_budget as number) ? (b.annual_budget as number) : 0), 0);

    return {
      criticalRoles: (cr.data ?? []).length,
      successionCovered: coveredRoles.size,
      successorsReadyNow: scArr.filter((s) => s.readiness === 'ready_now').length,
      successorsTotal: scArr.length,
      talentPools: tpArr.length,
      poolsBudget: budgetSum,
      mentoratPairs: mpArr.filter((p) => p.status === 'active').length,
      promotionsApproved: prArr.filter((p) => p.status === 'comite_approved' || p.status === 'validated' || p.status === 'communicated').length,
      promotionsPending: prArr.filter((p) => p.status === 'proposed' || p.status === 'comite_pending' || p.status === 'director_validated').length,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function useNominateSuccessor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ criticalRoleId, employeeId, readiness }: {
      criticalRoleId: string; employeeId: string;
      readiness: 'ready_now' | 'ready_1y' | 'ready_2y' | 'ready_3y';
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m10_succession_successors').insert({
        id, tenant_id: ctx.tenantId, critical_role_id: criticalRoleId,
        employee_id: employeeId, readiness, nominated_by: ctx.userId, nominated_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'succession.successor_nominated',
        entity: 'm10_succession_successors', entityId: id,
        payload: { criticalRoleId, employeeId, readiness },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m10-raw'] }),
  });
}

export function useEnrollTalentPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, poolId, rationale }: { employeeId: string; poolId: string; rationale?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m10_talent_pool_members').insert({
        id, tenant_id: ctx.tenantId, employee_id: employeeId, pool_id: poolId,
        nominated_by: ctx.userId, rationale: rationale ?? null, enrolled_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'talent_pool.member_enrolled',
        entity: 'm10_talent_pool_members', entityId: id,
        payload: { employeeId, poolId },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m10-raw'] }),
  });
}

export function useSubmitPromotionProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, fromGrade, toGrade, effectiveDate, rationale }: {
      employeeId: string; fromGrade: string; toGrade: string; effectiveDate: string; rationale: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m10_promotions').insert({
        id, tenant_id: ctx.tenantId, employee_id: employeeId,
        from_grade: fromGrade, to_grade: toGrade, effective_date: effectiveDate,
        rationale, status: 'proposed', proposed_by: ctx.userId, proposed_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'promotion.proposed',
        entity: 'm10_promotions', entityId: id,
        payload: { employeeId, fromGrade, toGrade, effectiveDate },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m10-raw'] }),
  });
}

export function useApprovePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ promotionId }: { promotionId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m10_promotions')
        .update({ status: 'comite_approved', approved_by: ctx.userId, approved_at: now, updated_at: now })
        .eq('id', promotionId).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useApprovePromotion');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'promotion.comite_approved',
        entity: 'm10_promotions', entityId: promotionId,
        payload: { promotionId },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m10-raw'] }),
  });
}

export function useCreateMentoratPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mentorEmployeeId, menteeEmployeeId, startDate, focus }: {
      mentorEmployeeId: string; menteeEmployeeId: string; startDate: string; focus?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m10_mentorat_pairs').insert({
        id, tenant_id: ctx.tenantId, mentor_employee_id: mentorEmployeeId,
        mentee_employee_id: menteeEmployeeId, start_date: startDate,
        focus: focus ?? null, status: 'active', created_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'mentorat.pair_created',
        entity: 'm10_mentorat_pairs', entityId: id,
        payload: { mentorEmployeeId, menteeEmployeeId, startDate },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m10-raw'] }),
  });
}

export function useCreateCareerPath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, currentPositionId, targetPositionId, targetDate, managerId }: {
      employeeId: string; currentPositionId: string; targetPositionId: string;
      targetDate?: string; managerId: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m10_career_paths').insert({
        id, tenant_id: ctx.tenantId, employee_id: employeeId,
        current_position_id: currentPositionId, target_position_id: targetPositionId,
        target_date: targetDate ?? null, manager_id: managerId,
        status: 'active', created_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'career_path.created',
        entity: 'm10_career_paths', entityId: id,
        payload: { employeeId, currentPositionId, targetPositionId },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m10-raw'] }),
  });
}
