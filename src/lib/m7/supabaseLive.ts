/**
 * M7 OKR — agrégat live Supabase (cockpit · cycles · check-ins).
 */
import { isBackendConfigured, supabase } from '../supabase';

const TENANT_DEMO = '11111111-1111-1111-1111-111111111111';

export interface M7LiveKpis {
  objectivesTotal: number;
  objectivesActive: number;
  objectivesCompleted: number;
  krsTotal: number;
  krsAvgScore: number;
  krsAtRisk: number;
  checkInsLast30d: number;
  avgConfidence: number;
  fetchedAt: string;
}

export async function fetchM7Live(): Promise<M7LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [objs, krs, cis] = await Promise.all([
      sb.from('m7_objectives').select('status, final_score').eq('tenant_id', TENANT_DEMO),
      sb.from('m7_key_results').select('score, confidence').eq('tenant_id', TENANT_DEMO),
      sb.from('m7_check_ins').select('occurred_at, confidence').eq('tenant_id', TENANT_DEMO),
    ]);
    if (objs.error || krs.error || cis.error) return null;

    type ObjRow = { status: string; final_score: number | null };
    type KrRow = { score: number | null; confidence: number | null };
    type CiRow = { occurred_at: string; confidence: number | null };

    const objArr = (objs.data ?? []) as ObjRow[];
    const krArr = (krs.data ?? []) as KrRow[];
    const ciArr = (cis.data ?? []) as CiRow[];

    const krScores = krArr.map((k) => k.score).filter((s): s is number => Number.isFinite(s as number));
    const krConfs = krArr.map((k) => k.confidence).filter((c): c is number => Number.isFinite(c as number));
    const ciConfs = ciArr.map((c) => c.confidence).filter((c): c is number => Number.isFinite(c as number));
    const allConfs = [...krConfs, ...ciConfs];

    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();

    return {
      objectivesTotal: objArr.length,
      objectivesActive: objArr.filter((o) => o.status === 'active' || o.status === 'in_progress').length,
      objectivesCompleted: objArr.filter((o) => o.status === 'completed' || o.status === 'closed').length,
      krsTotal: krArr.length,
      krsAvgScore: krScores.length === 0 ? 0 : Math.round((krScores.reduce((a, b) => a + b, 0) / krScores.length) * 100) / 100,
      krsAtRisk: krArr.filter((k) => (k.confidence ?? 5) < 4).length,
      checkInsLast30d: ciArr.filter((c) => c.occurred_at >= cutoff).length,
      avgConfidence: allConfs.length === 0 ? 0 : Math.round((allConfs.reduce((a, b) => a + b, 0) / allConfs.length) * 10) / 10,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
