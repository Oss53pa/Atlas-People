/**
 * M5 Recrutement — lecture live mappée sur les types métier du module.
 *
 * Tables seedées à parité du mock (supabase/seeds/m5_recrutement_seed.sql) :
 * m5_jobs, m5_candidates, m5_applications, m5_interviews, m5_offers,
 * m5_referrals. `useM5Data()` est live-first avec fallback mock et expose les
 * helpers LIÉS (jobById, candidateById, applicationsByJob…). Les datasets
 * encore mock (scorecards, sourcing, activité) gardent leurs ids mock : les
 * helpers retombent sur le mock quand un id ne résout pas en live.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { useAuth } from '../auth';
import { mockEmpId } from '../m1/roster';
import {
  JOBS, CANDIDATES, APPLICATIONS, INTERVIEWS, OFFERS, REFERRALS,
  jobById as mockJobById, candidateById as mockCandidateById, appById as mockAppById,
} from './mock';
import type { JobPosting, Candidate, Application, Interview, Offer, Referral } from './types';

const DEMO = '11111111-1111-1111-1111-111111111111';
const day = (v: unknown) => (v == null ? undefined : String(v).slice(0, 10));

interface M5Raw {
  jobs: JobPosting[];
  candidates: Candidate[];
  applications: Application[];
  interviews: Interview[];
  offers: Offer[];
  referrals: Referral[];
}

function useM5Raw(tenantId?: string) {
  const tid = tenantId ?? DEMO;
  return useQuery({
    queryKey: ['m5-raw', tid],
    queryFn: async (): Promise<M5Raw | null> => {
      if (!supabase) return null;
      const ap = supabase.schema('atlas_people');
      const [jobs, cands, apps, intvs, offers, refs] = await Promise.all([
        ap.from('m5_jobs').select('*').eq('tenant_id', tid).order('ref'),
        ap.from('m5_candidates').select('*').eq('tenant_id', tid).order('anon_ref'),
        ap.from('m5_applications').select('*').eq('tenant_id', tid).order('ref'),
        ap.from('m5_interviews').select('*').eq('tenant_id', tid).order('scheduled_at'),
        ap.from('m5_offers').select('*').eq('tenant_id', tid).order('ref'),
        ap.from('m5_referrals').select('*').eq('tenant_id', tid).order('ref'),
      ]);
      for (const r of [jobs, cands, apps, intvs, offers, refs]) if (r.error) throw r.error;
      return {
        jobs: ((jobs.data ?? []) as Record<string, unknown>[]).map((j): JobPosting => ({
          id: j.id as string,
          ref: (j.ref as string) ?? '',
          title: (j.title as string) ?? '',
          department: (j.department as string) ?? '',
          location: (j.location as string) ?? '',
          countryCode: ((j.country_code as string) ?? '').trim(),
          contractType: j.contract_type as JobPosting['contractType'],
          level: j.level as JobPosting['level'],
          salaryRangeMin: Number(j.salary_range_min ?? 0),
          salaryRangeMax: Number(j.salary_range_max ?? 0),
          status: j.status as JobPosting['status'],
          openedAt: day(j.opened_at) ?? '',
          closedAt: day(j.closed_at),
          targetCloseAt: day(j.target_close_at),
          hiringManager: j.hiring_manager_id ? mockEmpId(j.hiring_manager_id as string) : 'e1',
          recruiter: j.recruiter_id ? mockEmpId(j.recruiter_id as string) : 'e7',
          summary: (j.summary as string) ?? '',
          responsibilities: (j.responsibilities as string[]) ?? [],
          requirements: (j.requirements as string[]) ?? [],
          perks: (j.perks as string[]) ?? [],
          publishedChannels: (j.published_channels as string[]) ?? [],
          applicationsCount: Number(j.applications_count ?? 0),
          remoteAllowed: Boolean(j.remote_allowed),
          cooptationBonus: j.cooptation_bonus == null ? undefined : Number(j.cooptation_bonus),
        })),
        candidates: ((cands.data ?? []) as Record<string, unknown>[]).map((c): Candidate => ({
          id: c.id as string,
          anonRef: (c.anon_ref as string) ?? '',
          firstName: (c.first_name as string) ?? '',
          lastName: (c.last_name as string) ?? '',
          email: (c.email as string) ?? '',
          currentRole: (c.current_role_label as string) ?? '',
          currentCompany: (c.current_company as string) ?? '',
          location: (c.location as string) ?? '',
          countryCode: ((c.country_code as string) ?? '').trim() as Candidate['countryCode'],
          expectedSalaryMin: Number(c.expected_salary_min ?? 0),
          expectedSalaryMax: Number(c.expected_salary_max ?? 0),
          availability: (c.availability as string) ?? '',
          yearsExperience: Number(c.years_experience ?? 0),
          skills: (c.skills as string[]) ?? [],
          tags: (c.tags as string[]) ?? [],
          source: (c.source as string) ?? '',
          referrerEmployeeId: c.referrer_employee_id ? mockEmpId(c.referrer_employee_id as string) : undefined,
          rgpdConsent: Boolean(c.rgpd_consent),
          rgpdConsentAt: day(c.rgpd_consent_at) ?? '',
          rgpdRetentionUntil: day(c.rgpd_retention_until) ?? '',
        })),
        applications: ((apps.data ?? []) as Record<string, unknown>[]).map((a): Application => ({
          id: a.id as string,
          ref: (a.ref as string) ?? '',
          candidateId: (a.candidate_id as string) ?? '',
          jobId: (a.job_id as string) ?? '',
          stage: a.stage as Application['stage'],
          stageEnteredAt: day(a.stage_entered_at) ?? '',
          appliedAt: day(a.applied_at) ?? '',
          score: a.score == null ? undefined : Number(a.score),
          lastActivityAt: day(a.last_activity_at) ?? '',
          rejectionReasonCode: (a.rejection_reason_code as string) ?? undefined,
        })),
        interviews: ((intvs.data ?? []) as Record<string, unknown>[]).map((i): Interview => ({
          id: i.id as string,
          ref: (i.ref as string) ?? '',
          applicationId: (i.application_id as string) ?? '',
          type: i.type as Interview['type'],
          mode: i.mode as Interview['mode'],
          scheduledAt: (i.scheduled_at as string) ?? '',
          durationMin: Number(i.duration_min ?? 60),
          location: (i.location as string) ?? '',
          participants: ((i.participants as Interview['participants']) ?? []).map((p) => ({ ...p, employeeId: p.employeeId ? mockEmpId(p.employeeId) : p.employeeId })),
          status: i.status as Interview['status'],
        })),
        offers: ((offers.data ?? []) as Record<string, unknown>[]).map((o): Offer => ({
          id: o.id as string,
          ref: (o.ref as string) ?? '',
          applicationId: (o.application_id as string) ?? '',
          status: o.status as Offer['status'],
          contractType: o.contract_type as Offer['contractType'],
          baseSalary: Number(o.base_salary ?? 0),
          allowancesTotal: Number(o.allowances_total ?? 0),
          totalPackage: Number(o.total_package ?? 0),
          startDate: day(o.start_date) ?? '',
          draftAt: day(o.draft_at) ?? '',
          sentAt: day(o.sent_at),
          acceptedAt: day(o.accepted_at),
          declinedAt: day(o.declined_at),
          declinedReason: (o.declined_reason as string) ?? undefined,
          validUntil: day(o.valid_until) ?? '',
          signatureWorkflow: (o.signature_workflow as string) ?? undefined,
        })),
        referrals: ((refs.data ?? []) as Record<string, unknown>[]).map((r): Referral => ({
          id: r.id as string,
          ref: (r.ref as string) ?? '',
          referrerEmployeeId: r.referrer_employee_id ? mockEmpId(r.referrer_employee_id as string) : '',
          candidateId: (r.candidate_id as string) ?? '',
          jobId: (r.job_id as string) ?? '',
          status: r.status as Referral['status'],
          submittedAt: day(r.submitted_at) ?? '',
          bonusAmount: Number(r.bonus_amount ?? 0),
        })),
      };
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export interface M5Data extends M5Raw {
  live: boolean;
  jobById: (id: string) => JobPosting | undefined;
  candidateById: (id: string) => Candidate | undefined;
  appById: (id: string) => Application | undefined;
  applicationsByJob: (jobId: string) => Application[];
  applicationsByCandidate: (candidateId: string) => Application[];
  interviewsByApp: (appId: string) => Interview[];
  offerByApp: (appId: string) => Offer | undefined;
}

/** Source de données M5 : live Supabase si dispo, sinon datasets mock. */
export function useM5Data(): M5Data {
  const { tenantId } = useAuth();
  const { data: raw } = useM5Raw(tenantId ?? undefined);
  const live = isBackendConfigured && !!raw && raw.jobs.length > 0 && raw.applications.length > 0;
  const ds: M5Raw = live && raw ? raw : {
    jobs: JOBS, candidates: CANDIDATES, applications: APPLICATIONS,
    interviews: INTERVIEWS, offers: OFFERS, referrals: REFERRALS,
  };
  return {
    live,
    ...ds,
    jobById: (id) => ds.jobs.find((j) => j.id === id) ?? mockJobById(id),
    candidateById: (id) => ds.candidates.find((c) => c.id === id) ?? mockCandidateById(id),
    appById: (id) => ds.applications.find((a) => a.id === id) ?? mockAppById(id),
    applicationsByJob: (jobId) => ds.applications.filter((a) => a.jobId === jobId),
    applicationsByCandidate: (candidateId) => ds.applications.filter((a) => a.candidateId === candidateId),
    interviewsByApp: (appId) => ds.interviews.filter((i) => i.applicationId === appId),
    offerByApp: (appId) => ds.offers.find((o) => o.applicationId === appId),
  };
}
