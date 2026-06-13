/**
 * M4 Admin RH (2e lot) — lecture live mappée sur les types métier du module.
 *
 * Tables seedées (supabase/seeds/m4_admin2_seed.sql) : m4_disciplinary_cases,
 * m4_representation_mandates, m4_representation_elections, m4_probation_periods,
 * m4_expat_files (+ m4_expat_documents / m4_expat_packages imbriqués).
 * `useM4AdminData()` est live-first (React Query) avec fallback mock, et expose
 * les datasets + helpers liés (disciplinaryOf, mandatesOf, probationOf).
 *
 * Les datasets dérivés du roster / référentiels (ALERTS, DPAE, CERTIFICATES,
 * LEGAL_OBLIGATIONS) restent calculés côté mock — ce ne sont pas des faits
 * indépendants mais des projections déterministes.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { useAuth } from '../auth';
import { mockEmpId } from '../m1/roster';
import {
  DISCIPLINARY, MANDATES, ELECTIONS, PROBATIONS, EXPATS,
} from './mock';
import type {
  DisciplinaryProcedure, DisciplinaryStatus, FauteLevel, SanctionType,
  RepresentationMandate, RepresentationElection, ProbationPeriod,
  ContractTypeCode, ProbationDecision, ExpatFile, ExpatPermitDoc,
} from './types';

const DEMO = '11111111-1111-1111-1111-111111111111';
const day = (v: unknown) => (v == null ? undefined : String(v).slice(0, 10));

const DISC_STATUS_REV: Record<string, DisciplinaryStatus> = {
  opened: 'open', under_investigation: 'open', interview_scheduled: 'convocation',
  interview_done: 'hearing', deciding: 'hearing', sanction_notified: 'sanctioned',
  contested: 'appealed', closed: 'closed', cancelled: 'closed',
};
const CT_REV = (t: string): ContractTypeCode => (t === 'CDD_CHANT' ? 'CDD_CHANTIER' : (t as ContractTypeCode));
const DEC_REV: Record<string, ProbationDecision> = {
  pending: 'pending', confirmed: 'confirmation', extended: 'prolongation', terminated: 'rupture',
};

interface M4AdminRaw {
  disciplinary: DisciplinaryProcedure[];
  mandates: RepresentationMandate[];
  elections: RepresentationElection[];
  probations: ProbationPeriod[];
  expats: ExpatFile[];
}

function useM4AdminRaw(tenantId?: string) {
  const tid = tenantId ?? DEMO;
  return useQuery({
    queryKey: ['m4-admin2-raw', tid],
    queryFn: async (): Promise<M4AdminRaw | null> => {
      if (!supabase) return null;
      const ap = supabase.schema('atlas_people');
      const [disc, mnd, elec, prob, exf, exd, exp] = await Promise.all([
        ap.from('m4_disciplinary_cases').select('*').eq('tenant_id', tid).order('opened_at', { ascending: false }),
        ap.from('m4_representation_mandates').select('*').eq('tenant_id', tid).order('start_date', { ascending: false }),
        ap.from('m4_representation_elections').select('*').eq('tenant_id', tid).order('scrutin_date', { ascending: false }),
        ap.from('m4_probation_periods').select('*').eq('tenant_id', tid).order('start_date', { ascending: false }),
        ap.from('m4_expat_files').select('*').eq('tenant_id', tid).order('mission_start', { ascending: false }),
        ap.from('m4_expat_documents').select('*').eq('tenant_id', tid),
        ap.from('m4_expat_packages').select('*').eq('tenant_id', tid),
      ]);
      for (const r of [disc, mnd, elec, prob, exf, exd, exp]) if (r.error) throw r.error;

      const docsByExpat = new Map<string, Record<string, unknown>[]>();
      for (const d of (exd.data ?? []) as Record<string, unknown>[]) {
        const k = d.expat_id as string;
        (docsByExpat.get(k) ?? docsByExpat.set(k, []).get(k)!).push(d);
      }
      const pkgByExpat = new Map<string, Record<string, unknown>>();
      for (const p of (exp.data ?? []) as Record<string, unknown>[]) pkgByExpat.set(p.expat_id as string, p);
      const permitOf = (docs: Record<string, unknown>[], type: string): ExpatPermitDoc | undefined => {
        const d = docs.find((x) => x.doc_type === type);
        return d ? { label: (d.label as string) ?? '', ref: (d.ref as string) ?? undefined, expiry: day(d.expiry) ?? '' } : undefined;
      };

      return {
        disciplinary: ((disc.data ?? []) as Record<string, unknown>[]).map((d): DisciplinaryProcedure => ({
          id: (d.id as string),
          ref: (d.case_number as string) ?? '',
          employeeId: d.employee_id ? mockEmpId(d.employee_id as string) : '',
          motif: (d.facts_description as string) ?? '',
          faute: ((d.proposed_qualification as string) ?? 'simple') as FauteLevel,
          openedAt: day(d.opened_at) ?? '',
          convocationAt: undefined,
          hearingAt: undefined,
          sanction: ((d.final_sanction as string) ?? (d.envisaged_sanction as string) ?? undefined) as SanctionType | undefined,
          sanctionNotifiedAt: undefined,
          effacementDate: day(d.effacement_date),
          status: DISC_STATUS_REV[(d.status as string) ?? 'opened'] ?? 'open',
          steps: [],
        })),
        mandates: ((mnd.data ?? []) as Record<string, unknown>[]).map((m): RepresentationMandate => ({
          id: (m.id as string),
          employeeId: m.employee_id ? mockEmpId(m.employee_id as string) : '',
          type: (m.type as string) ?? '',
          mode: ((m.mode as string) ?? 'elu') as RepresentationMandate['mode'],
          start: day(m.start_date) ?? '',
          end: day(m.end_date),
          protectedUntil: day(m.protected_until),
          delegationHours: m.delegation_hours == null ? undefined : Number(m.delegation_hours),
          status: ((m.status as string) ?? 'active') as RepresentationMandate['status'],
        })),
        elections: ((elec.data ?? []) as Record<string, unknown>[]).map((e): RepresentationElection => {
          const res = (e.results as Record<string, unknown>) ?? {};
          return {
            id: (e.id as string),
            instance: (res.instance as string) ?? '',
            societe: (res.societe as string) ?? '',
            scheduledDate: day(e.scrutin_date) ?? '',
            phase: ((res.phase as string) ?? (e.status as string) ?? 'planned') as RepresentationElection['phase'],
            seats: Number(res.seats ?? 0),
            turnout: e.turnout_pct == null ? undefined : Number(e.turnout_pct),
          };
        }),
        probations: ((prob.data ?? []) as Record<string, unknown>[]).map((p): ProbationPeriod => {
          const start = day(p.start_date) ?? '';
          const months = Number(p.duration_months ?? 0);
          const pending = (p.decision as string) === 'pending';
          // Évaluation intermédiaire dérivée (la colonne n'existe pas en DB).
          const interDate = pending && start
            ? (() => { const dt = new Date(start); dt.setDate(dt.getDate() + Math.round(months * 30 * 0.6)); return dt.toISOString().slice(0, 10); })()
            : undefined;
          return {
            id: (p.id as string),
            employeeId: p.employee_id ? mockEmpId(p.employee_id as string) : '',
            contractType: CT_REV((p.contract_type as string) ?? 'CDI'),
            category: (p.category as string) ?? '',
            durationMonths: months,
            startDate: start,
            endDate: day(p.end_date) ?? '',
            intermediateEvalDate: interDate,
            intermediateEvalDone: !pending,
            decision: DEC_REV[(p.decision as string) ?? 'pending'] ?? 'pending',
            decisionNotifiedAt: day(p.decision_notified_at),
          };
        }),
        expats: ((exf.data ?? []) as Record<string, unknown>[]).map((x): ExpatFile => {
          const docs = docsByExpat.get(x.id as string) ?? [];
          const pkg = pkgByExpat.get(x.id as string);
          const lines = (pkg?.lines as { label: string; value: string }[]) ?? [];
          return {
            id: (x.id as string),
            employeeId: x.employee_id ? mockEmpId(x.employee_id as string) : '',
            originCountry: (x.origin_country as string) ?? '',
            hostCountry: (x.host_country as string) ?? '',
            missionType: (x.mission_type as string) ?? '',
            missionStart: day(x.mission_start) ?? '',
            missionEnd: day(x.mission_end) ?? '',
            visa: permitOf(docs, 'visa'),
            workPermit: permitOf(docs, 'work_permit'),
            residenceCard: permitOf(docs, 'residence_card'),
            package: lines,
            surSalairePct: x.sur_salaire_pct == null ? undefined : Number(x.sur_salaire_pct),
          };
        }),
      };
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export interface M4AdminData extends M4AdminRaw {
  live: boolean;
  disciplinaryOf: (empId: string) => DisciplinaryProcedure[];
  mandatesOf: (empId: string) => RepresentationMandate[];
  probationOf: (empId: string) => ProbationPeriod | undefined;
}

/** Source de données M4 admin (2e lot) : live Supabase si dispo, sinon mock. */
export function useM4AdminData(): M4AdminData {
  const { tenantId } = useAuth();
  const { data: raw } = useM4AdminRaw(tenantId ?? undefined);
  const live = isBackendConfigured && !!raw && raw.probations.length > 0;
  const ds: M4AdminRaw = live && raw ? raw : {
    disciplinary: DISCIPLINARY, mandates: MANDATES, elections: ELECTIONS, probations: PROBATIONS, expats: EXPATS,
  };
  return {
    live,
    ...ds,
    disciplinaryOf: (empId) => ds.disciplinary.filter((d) => d.employeeId === empId),
    mandatesOf: (empId) => ds.mandates.filter((m) => m.employeeId === empId),
    probationOf: (empId) => ds.probations.find((p) => p.employeeId === empId),
  };
}
