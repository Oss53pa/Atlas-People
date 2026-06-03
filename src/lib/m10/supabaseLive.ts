/**
 * M10 Carrières — agrégat live Supabase (cockpit · succession · mentorat).
 */
import { isBackendConfigured, supabase } from '../supabase';

const TENANT_DEMO = '11111111-1111-1111-1111-111111111111';

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

export async function fetchM10Live(): Promise<M10LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [cr, sc, tp, mp, pr] = await Promise.all([
      sb.from('m10_critical_roles').select('id').eq('tenant_id', TENANT_DEMO),
      sb.from('m10_succession_successors').select('critical_role_id, readiness').eq('tenant_id', TENANT_DEMO),
      sb.from('m10_talent_pools').select('annual_budget').eq('tenant_id', TENANT_DEMO),
      sb.from('m10_mentorat_pairs').select('status').eq('tenant_id', TENANT_DEMO),
      sb.from('m10_promotions').select('status').eq('tenant_id', TENANT_DEMO),
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
