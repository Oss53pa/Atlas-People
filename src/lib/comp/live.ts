/**
 * Readiness Compétences — chargement LIVE.
 *
 * Reconstruit `MockReadinessEmploye[]` depuis les tables live (comp_readiness →
 * paires (employé, poste cible) ; m9_job_requirements → attentes ;
 * comp_evaluations → triangulation ; m9_skills/m9_jobs/employees → libellés),
 * pour être calculé par le MÊME moteur (src/engine/competences) que la démo.
 * Repli mock si backend non configuré / aucune readiness calculée.
 */
import { isBackendConfigured, supabase } from '../supabase';
import type { MockCompetence, MockReadinessEmploye } from './mock';

const SCHEMA = 'atlas_people';
const DEMO_TENANT = '11111111-1111-1111-1111-111111111111';

type PairRow = { employe_id: string; job_cible_id: string };
type ReqRow = { job_id: string; skill_id: string; min_level: number; critical: boolean };
type EvalRow = {
  employe_id: string; skill_id: string; niveau_self: number | null; niveau_manager: number | null;
  niveau_rh_override: number | null; preuve_id: string | null; date_validite: string | null;
};

export async function fetchReadinessLive(tenantId: string = DEMO_TENANT): Promise<MockReadinessEmploye[] | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema(SCHEMA);

    const { data: readies } = await sb.from('comp_readiness').select('employe_id, job_cible_id').eq('tenant_id', tenantId);
    const pairs = (readies ?? []) as PairRow[];
    if (pairs.length === 0) return null;

    const employeIds = [...new Set(pairs.map((p) => p.employe_id))];
    const jobIds = [...new Set(pairs.map((p) => p.job_cible_id))];

    const [{ data: reqs }, { data: evals }, { data: jobs }, { data: emps }] = await Promise.all([
      sb.from('m9_job_requirements').select('job_id, skill_id, min_level, critical').in('job_id', jobIds),
      sb.from('comp_evaluations').select('employe_id, skill_id, niveau_self, niveau_manager, niveau_rh_override, preuve_id, date_validite').in('employe_id', employeIds),
      sb.from('m9_jobs').select('id, name').in('id', jobIds),
      sb.from('employees').select('id, role_title').in('id', employeIds),
    ]);
    const reqRows = (reqs ?? []) as ReqRow[];
    const evalRows = (evals ?? []) as EvalRow[];

    const skillIds = [...new Set(reqRows.map((r) => r.skill_id))];
    const { data: skills } = skillIds.length
      ? await sb.from('m9_skills').select('id, name').in('id', skillIds)
      : { data: [] };
    const skillName = new Map(((skills ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name]));
    const jobName = new Map(((jobs ?? []) as { id: string; name: string }[]).map((j) => [j.id, j.name]));
    const roleName = new Map(((emps ?? []) as { id: string; role_title: string | null }[]).map((e) => [e.id, e.role_title]));

    const evalMap = new Map<string, EvalRow>();
    for (const ev of evalRows) evalMap.set(`${ev.employe_id}|${ev.skill_id}`, ev);
    const reqsByJob = new Map<string, ReqRow[]>();
    for (const r of reqRows) reqsByJob.set(r.job_id, [...(reqsByJob.get(r.job_id) ?? []), r]);

    const out: MockReadinessEmploye[] = pairs.map((p) => {
      const competences: MockCompetence[] = (reqsByJob.get(p.job_cible_id) ?? []).map((r) => {
        const ev = evalMap.get(`${p.employe_id}|${r.skill_id}`);
        return {
          competenceId: r.skill_id,
          libelle: skillName.get(r.skill_id) ?? r.skill_id,
          niveauAttendu: r.min_level,
          criticite: r.critical ? 2 : 1,
          bloquante: !!r.critical,
          triangulation: {
            niveauSelf: ev?.niveau_self ?? undefined,
            niveauManager: ev?.niveau_manager ?? undefined,
            niveauRhOverride: ev?.niveau_rh_override ?? undefined,
            preuveFournie: ev ? ev.preuve_id != null : false,
            dateValidite: ev?.date_validite ?? undefined,
          },
        };
      });
      return {
        employeId: p.employe_id,
        posteActuel: roleName.get(p.employe_id) ?? '—',
        posteCible: jobName.get(p.job_cible_id) ?? p.job_cible_id,
        competences,
      };
    });
    return out.length ? out : null;
  } catch {
    return null;
  }
}
