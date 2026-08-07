/**
 * M11 Formation — couche live Supabase (cockpit sprint 1).
 *
 * Lit les agrégats depuis atlas_people : m11_parcours / m11_pif /
 * m11_lms_progress / m11_badge_attributions / m11_formateurs /
 * m11_suspicious_patterns + vue m11_pif_progress.
 *
 * Si le backend n'est pas configuré (mode démo local), `fetchM11CockpitLive`
 * renvoie `null` et l'UI tombe sur les KPIs mock.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isBackendConfigured, supabase } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };



export interface M11CockpitLive {
  parcoursActifs: number;
  enrollmentsActifs: number;
  enrollmentsCompleted: number;
  pifSignedRate: number; // 0-1
  pifTotal: number;
  budgetTotal: number; // FCFA
  budgetConsumed: number;
  lmsCompletionRate: number; // 0-1
  lmsLearners: number;
  badgesAwardedYtd: number;
  formateursActifs: number;
  patternsCritical: number;
  patternsOpen: number;
  fetchedAt: string;
}

const sum = (arr: Array<number | null | undefined>): number =>
  arr.reduce<number>((a, b) => a + (Number.isFinite(b as number) ? (b as number) : 0), 0);

export async function fetchM11CockpitLive(): Promise<M11CockpitLive | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const { tenantId } = await resolveSessionContext(); // lève si pas de session → catch → mock
    const sb = supabase.schema('atlas_people');

    const [parcoursR, enrollR, pifR, lmsR, badgesR, formateursR, patternsR] = await Promise.all([
      sb.from('m11_parcours').select('active').eq('tenant_id', tenantId),
      sb.from('m11_parcours_enrollments').select('status').eq('tenant_id', tenantId),
      sb.from('m11_pif').select('status, budget_individual, budget_consumed').eq('tenant_id', tenantId),
      sb.from('m11_lms_progress').select('status, employee_id').eq('tenant_id', tenantId),
      sb.from('m11_badge_attributions').select('awarded_at').eq('tenant_id', tenantId),
      sb.from('m11_formateurs').select('active').eq('tenant_id', tenantId),
      sb.from('m11_suspicious_patterns').select('severity, status').eq('tenant_id', tenantId),
    ]);

    if (parcoursR.error || enrollR.error || pifR.error || lmsR.error || badgesR.error || formateursR.error || patternsR.error) {
      // Soft-fail : on retombe sur mock
      return null;
    }

    type ParcoursRow = { active: boolean };
    type EnrollRow = { status: string };
    type PifRow = { status: string; budget_individual: number | null; budget_consumed: number | null };
    type LmsRow = { status: string; employee_id: string };
    type BadgeRow = { awarded_at: string };
    type FormateurRow = { active: boolean };
    type PatternRow = { severity: string; status: string };

    const parcours = (parcoursR.data ?? []) as ParcoursRow[];
    const enrolls = (enrollR.data ?? []) as EnrollRow[];
    const pifs = (pifR.data ?? []) as PifRow[];
    const lms = (lmsR.data ?? []) as LmsRow[];
    const badges = (badgesR.data ?? []) as BadgeRow[];
    const formateurs = (formateursR.data ?? []) as FormateurRow[];
    const patterns = (patternsR.data ?? []) as PatternRow[];

    const pifSigned = pifs.filter((p) => p.status === 'signed' || p.status === 'in_progress' || p.status === 'closed').length;
    const lmsCompleted = lms.filter((p) => p.status === 'completed').length;
    const lmsLearners = new Set(lms.map((l) => l.employee_id)).size;
    const yearStart = '2026-01-01T00:00:00+00';

    const live: M11CockpitLive = {
      parcoursActifs: parcours.filter((p) => p.active).length,
      enrollmentsActifs: enrolls.filter((e) => e.status === 'active').length,
      enrollmentsCompleted: enrolls.filter((e) => e.status === 'completed').length,
      pifSignedRate: pifs.length === 0 ? 0 : pifSigned / pifs.length,
      pifTotal: pifs.length,
      budgetTotal: sum(pifs.map((p) => p.budget_individual)),
      budgetConsumed: sum(pifs.map((p) => p.budget_consumed)),
      lmsCompletionRate: lms.length === 0 ? 0 : lmsCompleted / lms.length,
      lmsLearners,
      badgesAwardedYtd: badges.filter((b) => b.awarded_at >= yearStart).length,
      formateursActifs: formateurs.filter((f) => f.active).length,
      patternsCritical: patterns.filter((p) => p.severity === 'critical' && p.status !== 'resolved').length,
      patternsOpen: patterns.filter((p) => p.status === 'open' || p.status === 'investigating').length,
      fetchedAt: new Date().toISOString(),
    };

    return live;
  } catch {
    return null;
  }
}

export function useCreatePIF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, cycleYear, managerId, budgetIndividual }: {
      employeeId: string; cycleYear: number; managerId: string; budgetIndividual?: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m11_pif').insert({
        id, tenant_id: ctx.tenantId, employee_id: employeeId, cycle_year: cycleYear,
        manager_id: managerId, budget_individual: budgetIndividual ?? null,
        budget_consumed: 0, status: 'draft', created_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'pif.created',
        entity: 'm11_pif', entityId: id,
        payload: { employeeId, cycleYear },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m11-cockpit'] }),
  });
}

export function useAddPIFAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pifId, formationId, modalite, plannedDate, cost }: {
      pifId: string; formationId?: string; modalite: string; plannedDate: string; cost?: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m11_pif_actions').insert({
        id, tenant_id: ctx.tenantId, pif_id: pifId,
        formation_id: formationId ?? null, modalite, planned_date: plannedDate,
        cost: cost ?? 0, status: 'planned', created_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'pif.action_added',
        entity: 'm11_pif_actions', entityId: id,
        payload: { pifId, modalite, plannedDate },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m11-cockpit'] }),
  });
}

export function useEnrollParcours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, parcoursId }: { employeeId: string; parcoursId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m11_parcours_enrollments').insert({
        id, tenant_id: ctx.tenantId, employee_id: employeeId, parcours_id: parcoursId,
        status: 'active', enrolled_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'parcours.enrolled',
        entity: 'm11_parcours_enrollments', entityId: id,
        payload: { employeeId, parcoursId },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m11-cockpit'] }),
  });
}

export function useCompleteEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ enrollmentId, notes }: { enrollmentId: string; notes?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m11_parcours_enrollments')
        .update({ status: 'completed', completed_at: now, notes: notes ?? null, updated_at: now })
        .eq('id', enrollmentId).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useCompleteEnrollment');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'parcours.completed',
        entity: 'm11_parcours_enrollments', entityId: enrollmentId,
        payload: { enrollmentId },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m11-cockpit'] }),
  });
}

export function useSignPIF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pifId }: { pifId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m11_pif')
        .update({ status: 'signed', signed_at: now, updated_at: now })
        .eq('id', pifId).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useSignPIF');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'pif.signed',
        entity: 'm11_pif', entityId: pifId,
        payload: { pifId },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m11-cockpit'] }),
  });
}

export function useAwardBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, badgeId, reason }: { employeeId: string; badgeId: string; reason?: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m11_badge_attributions').insert({
        id, tenant_id: ctx.tenantId, employee_id: employeeId, badge_id: badgeId,
        reason: reason ?? null, awarded_by: ctx.userId, awarded_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'badge.awarded',
        entity: 'm11_badge_attributions', entityId: id,
        payload: { employeeId, badgeId },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m11-cockpit'] }),
  });
}
