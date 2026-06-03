/**
 * M12 Conformité & SST — agrégat live Supabase (DUER · AT · RPS · déclarations).
 */
import { isBackendConfigured, supabase } from '../supabase';

const TENANT_DEMO = '11111111-1111-1111-1111-111111111111';

export interface M12LiveKpis {
  duerRisksTotal: number;
  duerCritical: number;
  duerEleve: number;
  atIncidentsOpen: number;
  atSevere: number; // grave/tres_grave/mortel
  rpsSurveysActive: number;
  rpsBurnoutAvg: number;
  declarationsOverdue: number;
  declarationsPaid: number;
  authorizationsExpiring90d: number;
  fetchedAt: string;
}

export async function fetchM12Live(): Promise<M12LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [risks, ats, rps, decls, auths] = await Promise.all([
      sb.from('m12_risks').select('level').eq('tenant_id', TENANT_DEMO),
      sb.from('m12_work_incidents').select('severity, status').eq('tenant_id', TENANT_DEMO),
      sb.from('m12_rps_surveys').select('status, burnout_risk_pct').eq('tenant_id', TENANT_DEMO),
      sb.from('m12_social_declarations').select('status, due_date').eq('tenant_id', TENANT_DEMO),
      sb.from('m12_authorizations').select('expires_at, status').eq('tenant_id', TENANT_DEMO),
    ]);
    if (risks.error || ats.error || rps.error || decls.error || auths.error) return null;

    type RiskRow = { level: string };
    type AtRow = { severity: string; status: string };
    type RpsRow = { status: string; burnout_risk_pct: number | null };
    type DeclRow = { status: string; due_date: string | null };
    type AuthRow = { expires_at: string | null; status: string };

    const riskArr = (risks.data ?? []) as RiskRow[];
    const atArr = (ats.data ?? []) as AtRow[];
    const rpsArr = (rps.data ?? []) as RpsRow[];
    const declArr = (decls.data ?? []) as DeclRow[];
    const authArr = (auths.data ?? []) as AuthRow[];

    const today = new Date().toISOString().slice(0, 10);
    const in90d = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);

    const burnoutScores = rpsArr.map((r) => r.burnout_risk_pct).filter((b): b is number => Number.isFinite(b as number));
    const avgBurnout = burnoutScores.length === 0 ? 0 : Math.round((burnoutScores.reduce((a, b) => a + b, 0) / burnoutScores.length) * 10) / 10;

    return {
      duerRisksTotal: riskArr.length,
      duerCritical: riskArr.filter((r) => r.level === 'critique').length,
      duerEleve: riskArr.filter((r) => r.level === 'eleve').length,
      atIncidentsOpen: atArr.filter((a) => a.status !== 'closed' && a.status !== 'litige').length,
      atSevere: atArr.filter((a) => a.severity === 'grave' || a.severity === 'tres_grave' || a.severity === 'mortel').length,
      rpsSurveysActive: rpsArr.filter((r) => r.status === 'open').length,
      rpsBurnoutAvg: avgBurnout,
      declarationsOverdue: declArr.filter((d) => d.status !== 'paid' && d.due_date !== null && d.due_date < today).length,
      declarationsPaid: declArr.filter((d) => d.status === 'paid').length,
      authorizationsExpiring90d: authArr.filter((a) => a.expires_at !== null && a.expires_at <= in90d && a.expires_at >= today).length,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
