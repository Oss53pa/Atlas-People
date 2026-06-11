/**
 * M11 Formation — lecture live mappée sur les types métier du module.
 *
 * Les tables m11_* (courses, training_plans, plan_items, training_sessions,
 * registrations, certifications, fdfp_declarations) sont seedées à parité du
 * mock (supabase/seeds/m11_formation_seed.sql). `useM11Data()` est live-first
 * avec fallback mock, et expose les helpers (courseById, sessionById,
 * registrationsBySession…) LIÉS aux datasets retournés — les pages les
 * prennent du hook au lieu du module mock. Les datasets encore mock
 * (Kirkpatrick, ROI, uplifts) référencent des ids mock : les helpers
 * retombent sur le mock quand un id ne résout pas en live.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { useAuth } from '../auth';
import { mockEmpId } from '../m1/roster';
import {
  COURSES, PLAN_2026, SESSIONS, REGISTRATIONS, CERTIFICATIONS, FDFP_DECLARATIONS,
  courseById as mockCourseById, sessionById as mockSessionById,
} from './mock';
import { TRAINING_THRESHOLDS } from './referentiels';
import type { Course, TrainingPlan, PlanItem, TrainingSession, Registration, Certification, FdfpDeclaration } from './types';

const DEMO = '11111111-1111-1111-1111-111111111111';
const TODAY = '2026-06-01';
const day = (v: unknown) => (v == null ? undefined : String(v).slice(0, 10));

function useM11Table<T>(key: string, tenantId: string | undefined, fetcher: (tid: string) => Promise<T[]>) {
  return useQuery({
    queryKey: [key, tenantId ?? DEMO],
    queryFn: () => fetcher(tenantId ?? DEMO),
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export function useM11Courses(tenantId?: string) {
  return useM11Table<Course>('m11-courses-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m11_courses')
      .select('id, ref, title, modality, provider, provider_name, category, level, language, duration_hours, cost_per_head, cost_per_session, min_participants, max_participants, summary, objectives, prerequisites, certification_code, fdfp_eligible, status, kirkpatrick_levels, tags, created_at, updated_at')
      .eq('tenant_id', tid).order('ref');
    if (error) throw error;
    return (data ?? []).map((c: Record<string, unknown>): Course => ({
      id: c.id as string,
      ref: c.ref as string,
      title: (c.title as string) ?? '',
      modality: c.modality as Course['modality'],
      provider: c.provider as Course['provider'],
      providerName: (c.provider_name as string) ?? '',
      category: c.category as Course['category'],
      level: c.level as Course['level'],
      language: (c.language as Course['language']) ?? 'FR',
      durationHours: Number(c.duration_hours ?? 0),
      costPerHead: Number(c.cost_per_head ?? 0),
      costPerSession: c.cost_per_session == null ? undefined : Number(c.cost_per_session),
      minParticipants: c.min_participants == null ? undefined : Number(c.min_participants),
      maxParticipants: c.max_participants == null ? undefined : Number(c.max_participants),
      summary: (c.summary as string) ?? '',
      objectives: (c.objectives as Course['objectives']) ?? [],
      prerequisites: (c.prerequisites as string[]) ?? [],
      certificationCode: (c.certification_code as string) ?? undefined,
      fdfpEligible: Boolean(c.fdfp_eligible),
      status: c.status as Course['status'],
      kirkpatrickLevels: (Number(c.kirkpatrick_levels ?? 2)) as Course['kirkpatrickLevels'],
      createdAt: day(c.created_at) ?? '',
      updatedAt: day(c.updated_at) ?? '',
      tags: (c.tags as string[]) ?? [],
    }));
  });
}

export function useM11Sessions(tenantId?: string) {
  return useM11Table<TrainingSession>('m11-sessions-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m11_training_sessions')
      .select('id, ref, course_id, plan_id, status, delivery_mode, location, meeting_url, trainers, days, total_hours, capacity, registered_count, waitlist_count, attended_count, completion_rate, average_score, average_reaction_score, cost_total, country_code, fdfp_declaration_ref')
      .eq('tenant_id', tid).order('ref');
    if (error) throw error;
    return (data ?? []).map((s: Record<string, unknown>): TrainingSession => ({
      id: s.id as string,
      ref: s.ref as string,
      courseId: (s.course_id as string) ?? '',
      planId: (s.plan_id as string) ?? undefined,
      status: s.status as TrainingSession['status'],
      deliveryMode: s.delivery_mode as TrainingSession['deliveryMode'],
      location: (s.location as string) ?? undefined,
      meetingUrl: (s.meeting_url as string) ?? undefined,
      trainers: ((s.trainers as TrainingSession['trainers']) ?? []).map((t) => ({ ...t, employeeId: t.employeeId ? mockEmpId(t.employeeId) : undefined })),
      days: (s.days as TrainingSession['days']) ?? [],
      totalHours: Number(s.total_hours ?? 0),
      capacity: Number(s.capacity ?? 0),
      registeredCount: Number(s.registered_count ?? 0),
      waitlistCount: Number(s.waitlist_count ?? 0),
      attendedCount: s.attended_count == null ? undefined : Number(s.attended_count),
      completionRate: s.completion_rate == null ? undefined : Number(s.completion_rate),
      averageScore: s.average_score == null ? undefined : Number(s.average_score),
      averageReactionScore: s.average_reaction_score == null ? undefined : Number(s.average_reaction_score),
      costTotal: Number(s.cost_total ?? 0),
      countryCode: ((s.country_code as string) ?? '').trim(),
      fdfpDeclarationRef: (s.fdfp_declaration_ref as string) ?? undefined,
    }));
  });
}

export function useM11Registrations(tenantId?: string) {
  return useM11Table<Registration>('m11-registrations-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m11_registrations')
      .select('id, ref, session_id, employee_id, status, requested_at, approved_at, approved_by, confirmed_at, attended_hours, learning_score, reaction_score, reaction_comment, cancelled_at, cancelled_reason, allocated_cost')
      .eq('tenant_id', tid).order('ref').limit(500);
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>): Registration => ({
      id: r.id as string,
      ref: r.ref as string,
      sessionId: (r.session_id as string) ?? '',
      employeeId: mockEmpId(r.employee_id as string),
      status: r.status as Registration['status'],
      requestedAt: day(r.requested_at) ?? '',
      approvedAt: day(r.approved_at),
      approvedById: r.approved_by ? mockEmpId(r.approved_by as string) : undefined,
      confirmedAt: day(r.confirmed_at),
      attendedHours: r.attended_hours == null ? undefined : Number(r.attended_hours),
      learningScore: r.learning_score == null ? undefined : Number(r.learning_score),
      reactionScore: r.reaction_score == null ? undefined : Number(r.reaction_score),
      reactionComment: (r.reaction_comment as string) ?? undefined,
      cancelledAt: day(r.cancelled_at),
      cancelledReason: (r.cancelled_reason as string) ?? undefined,
      allocatedCost: Number(r.allocated_cost ?? 0),
    }));
  });
}

export function useM11Certifications(tenantId?: string) {
  return useM11Table<Certification>('m11-certs-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m11_certifications')
      .select('id, ref, employee_id, course_id, certificate_code, issued_at, expires_at, issuer, status, pdf_url, validated_by')
      .eq('tenant_id', tid).order('ref');
    if (error) throw error;
    return (data ?? []).map((c: Record<string, unknown>): Certification => ({
      id: c.id as string,
      ref: c.ref as string,
      employeeId: mockEmpId(c.employee_id as string),
      courseId: (c.course_id as string) ?? '',
      certificateCode: (c.certificate_code as string) ?? '',
      issuedAt: day(c.issued_at) ?? '',
      expiresAt: day(c.expires_at),
      issuer: (c.issuer as string) ?? '',
      status: c.status as Certification['status'],
      pdfUrl: (c.pdf_url as string) ?? undefined,
      validatedById: c.validated_by ? mockEmpId(c.validated_by as string) : undefined,
    }));
  });
}

export function useM11Fdfp(tenantId?: string) {
  return useM11Table<FdfpDeclaration>('m11-fdfp-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from('m11_fdfp_declarations')
      .select('id, ref, country_code, year, quarter, status, sessions_count, hours_total, beneficiaries_count, cost_declared, rebate_expected, rebate_received, submitted_at, reimbursed_at, rejection_reason')
      .eq('tenant_id', tid).order('year', { ascending: false }).order('quarter', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((f: Record<string, unknown>): FdfpDeclaration => ({
      id: f.id as string,
      ref: f.ref as string,
      countryCode: ((f.country_code as string) ?? '').trim(),
      year: Number(f.year ?? 0),
      quarter: Number(f.quarter ?? 1) as FdfpDeclaration['quarter'],
      status: f.status as FdfpDeclaration['status'],
      sessionsCount: Number(f.sessions_count ?? 0),
      hoursTotal: Number(f.hours_total ?? 0),
      beneficiariesCount: Number(f.beneficiaries_count ?? 0),
      costDeclared: Number(f.cost_declared ?? 0),
      rebateExpected: Number(f.rebate_expected ?? 0),
      rebateReceived: f.rebate_received == null ? undefined : Number(f.rebate_received),
      submittedAt: day(f.submitted_at),
      reimbursedAt: day(f.reimbursed_at),
      rejectionReason: (f.rejection_reason as string) ?? undefined,
    } as FdfpDeclaration));
  });
}

export function useM11Plan(tenantId?: string) {
  return useM11Table<TrainingPlan>('m11-plan-live', tenantId, async (tid) => {
    if (!supabase) return [];
    const ap = supabase.schema('atlas_people');
    const [planRes, itemsRes] = await Promise.all([
      ap.from('m11_training_plans').select('id, ref, year, scope, scope_label, status, budget_envelope, budget_consumed, fdfp_rebate_forecast, beneficiaries_forecast, hours_forecast, approved_by, approved_at, created_by, created_at').eq('tenant_id', tid).order('year', { ascending: false }),
      ap.from('m11_plan_items').select('id, plan_id, course_id, target_employee_ids, target_teams, origin, priority, forecast_quarter, forecast_cost, realised_cost, status, rationale').eq('tenant_id', tid),
    ]);
    if (planRes.error) throw planRes.error;
    if (itemsRes.error) throw itemsRes.error;
    return (planRes.data ?? []).map((p: Record<string, unknown>): TrainingPlan => ({
      id: p.id as string,
      ref: p.ref as string,
      year: Number(p.year ?? 0),
      scope: p.scope as TrainingPlan['scope'],
      scopeLabel: (p.scope_label as string) ?? '',
      status: p.status as TrainingPlan['status'],
      budgetEnvelope: Number(p.budget_envelope ?? 0),
      budgetConsumed: Number(p.budget_consumed ?? 0),
      fdfpRebateForecast: Number(p.fdfp_rebate_forecast ?? 0),
      beneficiariesForecast: Number(p.beneficiaries_forecast ?? 0),
      hoursForecast: Number(p.hours_forecast ?? 0),
      items: (itemsRes.data ?? []).filter((it: Record<string, unknown>) => it.plan_id === p.id).map((it: Record<string, unknown>): PlanItem => ({
        id: it.id as string,
        courseId: (it.course_id as string) ?? '',
        targetEmployeeIds: ((it.target_employee_ids as string[]) ?? []).map(mockEmpId),
        targetTeams: (it.target_teams as string[]) ?? undefined,
        origin: it.origin as PlanItem['origin'],
        priority: it.priority as PlanItem['priority'],
        forecastQuarter: it.forecast_quarter as PlanItem['forecastQuarter'],
        forecastCost: Number(it.forecast_cost ?? 0),
        realisedCost: it.realised_cost == null ? undefined : Number(it.realised_cost),
        status: it.status as PlanItem['status'],
        rationale: (it.rationale as string) ?? undefined,
      })),
      approvedById: p.approved_by ? mockEmpId(p.approved_by as string) : undefined,
      approvedAt: day(p.approved_at),
      createdAt: day(p.created_at) ?? '',
      createdById: p.created_by ? mockEmpId(p.created_by as string) : '',
    }));
  });
}

export interface M11Data {
  live: boolean;
  courses: Course[];
  sessions: TrainingSession[];
  registrations: Registration[];
  certifications: Certification[];
  fdfpDeclarations: FdfpDeclaration[];
  plan: TrainingPlan;
  courseById: (id: string) => Course | undefined;
  sessionById: (id: string) => TrainingSession | undefined;
  registrationsBySession: (sessionId: string) => Registration[];
  registrationsByEmployee: (employeeId: string) => Registration[];
  certificationsExpiringSoon: () => Certification[];
}

/** Source de données M11 : live Supabase si dispo, sinon datasets mock.
 *  Les helpers retombent sur le mock pour les ids mock (datasets non migrés). */
export function useM11Data(): M11Data {
  const { tenantId } = useAuth();
  const tid = tenantId ?? undefined;
  const { data: courses } = useM11Courses(tid);
  const { data: sessions } = useM11Sessions(tid);
  const { data: registrations } = useM11Registrations(tid);
  const { data: certifications } = useM11Certifications(tid);
  const { data: fdfp } = useM11Fdfp(tid);
  const { data: plans } = useM11Plan(tid);

  const live = isBackendConfigured && !!((courses?.length ?? 0) && (sessions?.length ?? 0));
  const ds = {
    courses: live && courses?.length ? courses : COURSES,
    sessions: live && sessions?.length ? sessions : SESSIONS,
    registrations: live && registrations?.length ? registrations : REGISTRATIONS,
    certifications: live && certifications?.length ? certifications : CERTIFICATIONS,
    fdfpDeclarations: live && fdfp?.length ? fdfp : FDFP_DECLARATIONS,
    plan: live && plans?.length ? plans[0] : PLAN_2026,
  };

  const courseById = (id: string) => ds.courses.find((c) => c.id === id) ?? mockCourseById(id);
  const sessionById = (id: string) => ds.sessions.find((s) => s.id === id) ?? mockSessionById(id);
  const registrationsBySession = (sessionId: string) => ds.registrations.filter((r) => r.sessionId === sessionId);
  const registrationsByEmployee = (employeeId: string) => ds.registrations.filter((r) => r.employeeId === employeeId);
  const certificationsExpiringSoon = () => {
    const today = new Date(TODAY).getTime();
    const horizon = today + TRAINING_THRESHOLDS.CERT_EXPIRATION_ALERT_DAYS * 86_400_000;
    return ds.certifications.filter((c) => {
      if (!c.expiresAt || c.status !== 'active') return c.status === 'pending_renewal';
      const t = new Date(c.expiresAt).getTime();
      return t > today && t < horizon;
    });
  };

  return { live, ...ds, courseById, sessionById, registrationsBySession, registrationsByEmployee, certificationsExpiringSoon };
}
