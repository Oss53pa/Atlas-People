/**
 * M8 Évaluations — agrégat live Supabase (cockpit cycle annuel + bias).
 */
import { isBackendConfigured, supabase } from '../supabase';



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
