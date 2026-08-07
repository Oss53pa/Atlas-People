/**
 * M8 Évaluations — lecture live mappée sur les types métier du module.
 *
 * Modèle DB (m8_evaluations) = 5 dimensions fixes + note_finale + classe (A-E),
 * sans rating performance/potentiel ni 9-box stockés. `useM8Data()` lit les
 * évaluations live (seed supabase/seeds/m8_evaluations_seed.sql) et DÉRIVE la
 * performance (depuis la classe) et le potentiel (depuis dim4 évolution + dim5
 * développement), donc le 9-box, de façon déterministe — la grille talents
 * reflète les scores réels plutôt qu'un tirage. Les datasets dérivés / rituels
 * (cycles, calibrations, feedback 360, plans de dev, 1-1) restent projetés mock,
 * keyés de manière compatible (id `ev-eNN`).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { useAuth } from '../auth';
import { mockEmpId } from '../m1/roster';
import { EVAL_DIMENSIONS, boxKey } from './referentiels';
import {
  CYCLES, activeCycle, cycleById, CALIBRATIONS, FEEDBACK_360, DEV_PLANS, ONE_ON_ONES,
  EVALUATIONS as MOCK_EVALUATIONS, TALENT_BOXES as MOCK_BOXES, feedbacksByEval, devPlanByEmployee,
} from './mock';
import type {
  Evaluation, EvaluationStatus, ScoreRow, TalentBoxAssignment, EvalKPI,
} from './types';

const DEMO = '11111111-1111-1111-1111-111111111111';
const ACTIVE_CYCLE_UUID = '22222222-0000-0000-0008-100000000001';

const STATUS_REV: Record<string, EvaluationStatus> = {
  draft: 'auto_in_progress', auto_submitted: 'auto_submitted', manager_review: 'manager_submitted',
  calibrated: 'calibration', entretien_pending: 'shared', signed: 'signed', closed: 'closed',
};
const PERF_FROM_CLASSE = (c: string | null): Evaluation['performanceRating'] =>
  c === 'A' ? 'outstanding' : c === 'B' ? 'exceeds' : c === 'C' ? 'meets' : 'low';
const POT_FROM_SCORE = (avg: number): Evaluation['potentialRating'] =>
  avg >= 4.25 ? 'top' : avg >= 3.75 ? 'high' : avg >= 3.0 ? 'core' : 'low';
const day = (v: unknown) => (v == null ? undefined : String(v).slice(0, 10));

/** Axe X (3 colonnes) du 9-box depuis le rating performance. */
const perf3 = (p: Evaluation['performanceRating']): 'low' | 'meets' | 'exceeds' =>
  p === 'low' ? 'low' : p === 'meets' ? 'meets' : 'exceeds';
/** Axe Y (3 lignes) du 9-box depuis le rating potentiel. */
const pot3 = (p: Evaluation['potentialRating']): 'low' | 'core' | 'high' =>
  p === 'low' ? 'low' : p === 'core' ? 'core' : 'high';

function useM8Evaluations(tenantId?: string) {
  const tid = tenantId ?? DEMO;
  return useQuery({
    queryKey: ['m8-evals', tid],
    queryFn: async (): Promise<Evaluation[] | null> => {
      if (!supabase) return null;
      const { data, error } = await supabase.schema('atlas_people')
        .from('m8_evaluations').select('*').eq('tenant_id', tid).eq('cycle_id', ACTIVE_CYCLE_UUID).order('ref');
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((e): Evaluation => {
        const dims = [
          Number(e.score_dim1_okr ?? 0), Number(e.score_dim2_competences ?? 0),
          Number(e.score_dim3_comportements ?? 0), Number(e.score_dim4_evolution ?? 0),
          Number(e.score_dim5_developpement ?? 0),
        ];
        const weights = [
          Number(e.weight_dim1 ?? 0), Number(e.weight_dim2 ?? 0), Number(e.weight_dim3 ?? 0),
          Number(e.weight_dim4 ?? 0), Number(e.weight_dim5 ?? 0),
        ];
        const scores: ScoreRow[] = EVAL_DIMENSIONS.map((d, i) => ({
          dimension: d.label,
          weight: weights[i] || d.weight,
          autoScore: dims[i] || undefined,
          managerScore: dims[i] || undefined,
          finalScore: dims[i] || undefined,
        }));
        const empId = e.employee_id ? mockEmpId(e.employee_id as string) : '';
        const potAvg = (dims[3] + dims[4]) / 2;
        return {
          id: `ev-${empId}`,
          ref: (e.ref as string) ?? '',
          cycleId: activeCycle.id,
          employeeId: empId,
          managerEmployeeId: e.manager_id ? mockEmpId(e.manager_id as string) : 'e1',
          status: STATUS_REV[(e.status as string) ?? 'draft'] ?? 'auto_in_progress',
          autoSubmittedAt: day(e.auto_submitted_at),
          managerSubmittedAt: day(e.manager_submitted_at),
          calibrationApprovedAt: day(e.calibrated_at),
          sharedAt: day(e.calibrated_at) && (e.status === 'entretien_pending' || e.status === 'signed' || e.status === 'closed') ? day(e.calibrated_at) : undefined,
          signedAt: day(e.signed_at),
          overallScore: e.note_finale == null ? undefined : Number(e.note_finale),
          performanceRating: PERF_FROM_CLASSE((e.classe as string) ?? null),
          potentialRating: POT_FROM_SCORE(potAvg),
          scores,
          strengths: (e.manager_eval_text as string) ?? 'Forte capacité d\'exécution · esprit d\'équipe reconnu · prise d\'initiative sur sujets transverses.',
          developmentAreas: 'Renforcer le leadership transverse · poser une stratégie produit à 12 mois.',
          managerComments: (e.manager_eval_text as string) ?? 'Année très solide — pilier sur son périmètre.',
          employeeComments: (e.auto_eval_text as string) ?? 'Année dense, satisfait de l\'évolution.',
        };
      });
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export interface M8Data {
  live: boolean;
  evaluations: Evaluation[];
  talentBoxes: TalentBoxAssignment[];
  cycles: typeof CYCLES;
  activeCycle: typeof activeCycle;
  calibrations: typeof CALIBRATIONS;
  feedback360: typeof FEEDBACK_360;
  devPlans: typeof DEV_PLANS;
  oneOnOnes: typeof ONE_ON_ONES;
  evaluationByEmployee: (empId: string) => Evaluation | undefined;
  evaluationById: (id: string) => Evaluation | undefined;
  boxOfEmployee: (empId: string) => TalentBoxAssignment | undefined;
  cycleById: typeof cycleById;
  feedbacksByEval: typeof feedbacksByEval;
  devPlanByEmployee: typeof devPlanByEmployee;
  kpis: () => EvalKPI;
}

/** Source de données M8 : évaluations live Supabase si dispo, sinon mock. */
export function useM8Data(): M8Data {
  const { tenantId } = useAuth();
  const { data: liveEvals } = useM8Evaluations(tenantId ?? undefined);
  const live = isBackendConfigured && !!liveEvals && liveEvals.length > 0;
  const evaluations = live && liveEvals ? liveEvals : MOCK_EVALUATIONS;

  const talentBoxes: TalentBoxAssignment[] = live
    ? evaluations.map((ev) => {
        const perf = perf3(ev.performanceRating);
        const pot = pot3(ev.potentialRating);
        return {
          evaluationId: ev.id, employeeId: ev.employeeId, cycleId: ev.cycleId,
          performance: perf, potential: pot, box: boxKey(perf, pot),
          rationale: 'Position calibrée commission RH · revue annuelle 2026',
        };
      })
    : MOCK_BOXES;

  const kpis = (): EvalKPI => {
    const total = evaluations.length;
    const completed = evaluations.filter((e) => ['shared', 'signed', 'closed'].includes(e.status)).length;
    const autoSub = evaluations.filter((e) => !!e.autoSubmittedAt).length;
    const mgrSub = evaluations.filter((e) => !!e.managerSubmittedAt).length;
    const avgScore = evaluations.reduce((s, e) => s + (e.overallScore ?? 0), 0) / Math.max(1, total);
    const high = talentBoxes.filter((t) => t.potential === 'high').length;
    const lowPerf = talentBoxes.filter((t) => t.performance === 'low').length;
    return {
      cyclesActifs: CYCLES.filter((c) => c.status === 'in_progress' || c.status === 'calibration').length,
      campagnesEnCours: CALIBRATIONS.filter((c) => c.status === 'planned' || c.status === 'in_progress').length,
      evaluationsActives: total,
      completionPct: Math.round((completed / Math.max(1, total)) * 100),
      autoEvalSubmittedPct: Math.round((autoSub / Math.max(1, total)) * 100),
      managerEvalSubmittedPct: Math.round((mgrSub / Math.max(1, total)) * 100),
      calibrationPlanifiees: CALIBRATIONS.length,
      scoresMoyens: Math.round(avgScore * 10) / 10,
      hautPotentielPct: Math.round((high / Math.max(1, total)) * 100),
      bas_perfPct: Math.round((lowPerf / Math.max(1, total)) * 100),
      plansDevActifs: DEV_PLANS.length,
    };
  };

  return {
    live,
    evaluations,
    talentBoxes,
    cycles: CYCLES,
    activeCycle,
    calibrations: CALIBRATIONS,
    feedback360: FEEDBACK_360,
    devPlans: DEV_PLANS,
    oneOnOnes: ONE_ON_ONES,
    evaluationByEmployee: (empId) => evaluations.find((e) => e.employeeId === empId),
    evaluationById: (id) => evaluations.find((e) => e.id === id),
    boxOfEmployee: (empId) => talentBoxes.find((t) => t.employeeId === empId),
    cycleById,
    feedbacksByEval,
    devPlanByEmployee,
    kpis,
  };
}
