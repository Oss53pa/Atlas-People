/**
 * M12 Conformité & SST — lecture live mappée sur les types métier du module.
 *
 * Les tables m12_* (risks, work_incidents, rps_surveys, social_declarations,
 * authorizations) sont seedées à parité du mock (supabase/seeds/
 * m12_conformite_seed.sql). Ces hooks renvoient les shapes TS du module
 * (RiskAssessment, WorkIncident, …) pour brancher les pages sans les réécrire.
 * `useM12Data()` est live-first avec fallback mock si backend absent/vide.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { useAuth } from '../auth';
import { mockEmpId } from '../m1/roster';
import { RISKS, INCIDENTS, RPS_SURVEYS, DECLARATIONS, AUTHORIZATIONS } from './mock';
import type { RiskAssessment, WorkIncident, RpsSurvey, SocialDeclaration, Authorization } from './types';

const DEMO = '11111111-1111-1111-1111-111111111111';
const day = (v: unknown) => (v == null ? undefined : String(v).slice(0, 10));

function useM12Table<T>(key: string, tenantId: string | undefined, fetcher: (tid: string) => Promise<T[]>) {
  return useQuery({
    queryKey: [key, tenantId ?? DEMO],
    queryFn: () => fetcher(tenantId ?? DEMO),
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export function useM12Risks(tenantId?: string) {
  return useM12Table<RiskAssessment>('m12-risks-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m12_risks')
      .select('id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at, next_review_due, created_at, updated_at')
      .eq('tenant_id', tid).order('ref');
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>): RiskAssessment => ({
      id: r.id as string,
      ref: r.ref as string,
      unite: (r.unite as string) ?? '',
      countryCode: ((r.country_code as string) ?? '').trim(),
      category: r.category as RiskAssessment['category'],
      hazard: (r.hazard as string) ?? '',
      probability: Number(r.probability) as RiskAssessment['probability'],
      severity: Number(r.severity) as RiskAssessment['severity'],
      level: r.level as RiskAssessment['level'],
      controls: (r.controls as string[]) ?? [],
      actions: ((r.actions as RiskAssessment['actions']) ?? []).map((a) => ({ ...a, ownerEmployeeId: mockEmpId(a.ownerEmployeeId) })),
      exposedEmployeeCount: Number(r.exposed_employee_count ?? 0),
      lastReviewAt: day(r.last_review_at) ?? '',
      nextReviewDue: day(r.next_review_due) ?? '',
      createdAt: day(r.created_at) ?? '',
      updatedAt: day(r.updated_at) ?? '',
    }));
  });
}

export function useM12Incidents(tenantId?: string) {
  return useM12Table<WorkIncident>('m12-incidents-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m12_work_incidents')
      .select('id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla')
      .eq('tenant_id', tid).order('occurred_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((i: Record<string, unknown>): WorkIncident => ({
      id: i.id as string,
      ref: i.ref as string,
      employeeId: mockEmpId(i.employee_id as string),
      type: i.type as WorkIncident['type'],
      severity: i.severity as WorkIncident['severity'],
      occurredAt: day(i.occurred_at) ?? '',
      declaredAt: day(i.declared_at) ?? '',
      countryCode: ((i.country_code as string) ?? '').trim(),
      unite: (i.unite as string) ?? '',
      location: (i.location as string) ?? '',
      description: (i.description as string) ?? '',
      workdaysLost: Number(i.workdays_lost ?? 0),
      thirdPartyInvolved: Boolean(i.third_party_involved),
      rootCause: (i.root_cause as string) ?? undefined,
      correctiveActions: (i.corrective_actions as string[]) ?? [],
      status: i.status as WorkIncident['status'],
      cnpsRef: (i.cnps_ref as string) ?? undefined,
      declaredWithinSLA: Boolean(i.declared_within_sla),
    }));
  });
}

export function useM12RpsSurveys(tenantId?: string) {
  return useM12Table<RpsSurvey>('m12-rps-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m12_rps_surveys')
      .select('id, ref, title, country_code, scope, scope_label, status, opened_at, closed_at, target_respondents, respondents, average_wellbeing_score, burnout_risk_pct, listening_cell_triggered, insights')
      .eq('tenant_id', tid).order('opened_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((s: Record<string, unknown>): RpsSurvey => ({
      id: s.id as string,
      ref: s.ref as string,
      title: (s.title as string) ?? '',
      countryCode: ((s.country_code as string) ?? '').trim(),
      scope: s.scope as RpsSurvey['scope'],
      scopeLabel: (s.scope_label as string) ?? '',
      status: s.status as RpsSurvey['status'],
      openedAt: day(s.opened_at) ?? '',
      closedAt: day(s.closed_at),
      targetRespondents: Number(s.target_respondents ?? 0),
      respondents: Number(s.respondents ?? 0),
      averageWellbeingScore: s.average_wellbeing_score == null ? undefined : Number(s.average_wellbeing_score),
      burnoutRiskPct: s.burnout_risk_pct == null ? undefined : Number(s.burnout_risk_pct),
      listeningCellTriggered: Boolean(s.listening_cell_triggered),
      insights: (s.insights as string[]) ?? [],
    }));
  });
}

export function useM12Declarations(tenantId?: string) {
  return useM12Table<SocialDeclaration>('m12-decl-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m12_social_declarations')
      .select('id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount')
      .eq('tenant_id', tid).order('due_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d: Record<string, unknown>): SocialDeclaration => ({
      id: d.id as string,
      ref: d.ref as string,
      kind: d.kind as SocialDeclaration['kind'],
      countryCode: ((d.country_code as string) ?? '').trim(),
      period: (d.period as string) ?? '',
      frequency: d.frequency as SocialDeclaration['frequency'],
      status: d.status as SocialDeclaration['status'],
      dueDate: day(d.due_date) ?? '',
      submittedAt: day(d.submitted_at),
      paidAt: day(d.paid_at),
      amountDeclared: Number(d.amount_declared ?? 0),
      penalty: d.penalty == null ? undefined : Number(d.penalty),
      headcount: Number(d.headcount ?? 0),
    }));
  });
}

export function useM12Authorizations(tenantId?: string) {
  return useM12Table<Authorization>('m12-auth-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m12_authorizations')
      .select('id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority')
      .eq('tenant_id', tid).order('expires_at');
    if (error) throw error;
    return (data ?? []).map((a: Record<string, unknown>): Authorization => ({
      id: a.id as string,
      ref: a.ref as string,
      employeeId: mockEmpId(a.employee_id as string),
      kind: a.kind as Authorization['kind'],
      level: (a.level as string) ?? '',
      issuedAt: day(a.issued_at) ?? '',
      expiresAt: day(a.expires_at) ?? '',
      status: a.status as Authorization['status'],
      issuingAuthority: (a.issuing_authority as string) ?? '',
    }));
  });
}

export interface M12Data {
  live: boolean;
  risks: RiskAssessment[];
  incidents: WorkIncident[];
  rpsSurveys: RpsSurvey[];
  declarations: SocialDeclaration[];
  authorizations: Authorization[];
}

/** Source de données M12 : live Supabase si dispo, sinon datasets mock. */
export function useM12Data(): M12Data {
  const { tenantId } = useAuth();
  const tid = tenantId ?? undefined;
  const { data: risks } = useM12Risks(tid);
  const { data: incidents } = useM12Incidents(tid);
  const { data: rps } = useM12RpsSurveys(tid);
  const { data: decl } = useM12Declarations(tid);
  const { data: auth } = useM12Authorizations(tid);
  const live = isBackendConfigured && !!((risks?.length ?? 0) || (incidents?.length ?? 0));
  return {
    live,
    risks: isBackendConfigured && risks?.length ? risks : RISKS,
    incidents: isBackendConfigured && incidents?.length ? incidents : INCIDENTS,
    rpsSurveys: isBackendConfigured && rps?.length ? rps : RPS_SURVEYS,
    declarations: isBackendConfigured && decl?.length ? decl : DECLARATIONS,
    authorizations: isBackendConfigured && auth?.length ? auth : AUTHORIZATIONS,
  };
}
