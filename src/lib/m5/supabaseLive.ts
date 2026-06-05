/**
 * M5 Recrutement — agrégat live Supabase (cockpit + Kanban SLA).
 */
import { isBackendConfigured, supabase } from '../supabase';



export interface M5LiveKpis {
  jobsOpen: number;
  jobsTotal: number;
  applicationsActive: number;
  interviewsPlanned: number;
  offersPending: number;
  offersAccepted: number;
  candidatesPool: number;
  referrals: number;
  fetchedAt: string;
}

export async function fetchM5Live(tenantId = '11111111-1111-1111-1111-111111111111'): Promise<M5LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [jobs, apps, intvs, offers, cands, refs] = await Promise.all([
      sb.from('m5_jobs').select('status').eq('tenant_id', tenantId),
      sb.from('m5_applications').select('stage').eq('tenant_id', tenantId),
      sb.from('m5_interviews').select('status').eq('tenant_id', tenantId),
      sb.from('m5_offers').select('status').eq('tenant_id', tenantId),
      sb.from('m5_candidates').select('id').eq('tenant_id', tenantId),
      sb.from('m5_referrals').select('id').eq('tenant_id', tenantId),
    ]);
    if (jobs.error || apps.error || intvs.error || offers.error || cands.error || refs.error) return null;

    type JobRow = { status: string };
    type AppRow = { stage: string };
    type IntvRow = { status: string };
    type OfferRow = { status: string };

    const jobsArr = (jobs.data ?? []) as JobRow[];
    const appsArr = (apps.data ?? []) as AppRow[];
    const intvsArr = (intvs.data ?? []) as IntvRow[];
    const offersArr = (offers.data ?? []) as OfferRow[];

    return {
      jobsOpen: jobsArr.filter((j) => j.status === 'open').length,
      jobsTotal: jobsArr.length,
      applicationsActive: appsArr.filter((a) => !['hired', 'rejected', 'withdrawn'].includes(a.stage)).length,
      interviewsPlanned: intvsArr.filter((i) => i.status === 'planned' || i.status === 'scheduled').length,
      offersPending: offersArr.filter((o) => o.status === 'sent' || o.status === 'negotiating').length,
      offersAccepted: offersArr.filter((o) => o.status === 'accepted').length,
      candidatesPool: (cands.data ?? []).length,
      referrals: (refs.data ?? []).length,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
