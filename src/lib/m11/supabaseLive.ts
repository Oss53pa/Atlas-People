/**
 * M11 Formation — couche live Supabase (cockpit sprint 1).
 *
 * Lit les agrégats depuis atlas_people : m11_parcours / m11_pif /
 * m11_lms_progress / m11_badge_attributions / m11_formateurs /
 * m11_suspicious_patterns + vue m11_pif_progress.
 *
 * Si le backend n'est pas configuré (mode démo local), `fetchM11CockpitLive`
 * renvoie `null` et l'UI tombe sur les KPIs mock.
 */
import { isBackendConfigured, supabase } from '../supabase';

const TENANT_DEMO = '11111111-1111-1111-1111-111111111111';

export interface M11CockpitLive {
  parcoursActifs: number;
  enrollmentsActifs: number;
  enrollmentsCompleted: number;
  pifSignedRate: number; // 0-1
  pifTotal: number;
  budgetTotal: number; // FCFA
  budgetConsumed: number;
  lmsCompletionRate: number; // 0-1
  lmsLearners: number;
  badgesAwardedYtd: number;
  formateursActifs: number;
  patternsCritical: number;
  patternsOpen: number;
  fetchedAt: string;
}

const sum = (arr: Array<number | null | undefined>): number =>
  arr.reduce<number>((a, b) => a + (Number.isFinite(b as number) ? (b as number) : 0), 0);

export async function fetchM11CockpitLive(): Promise<M11CockpitLive | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');

    const [parcoursR, enrollR, pifR, lmsR, badgesR, formateursR, patternsR] = await Promise.all([
      sb.from('m11_parcours').select('active').eq('tenant_id', TENANT_DEMO),
      sb.from('m11_parcours_enrollments').select('status').eq('tenant_id', TENANT_DEMO),
      sb.from('m11_pif').select('status, budget_individual, budget_consumed').eq('tenant_id', TENANT_DEMO),
      sb.from('m11_lms_progress').select('status, employee_id').eq('tenant_id', TENANT_DEMO),
      sb.from('m11_badge_attributions').select('awarded_at').eq('tenant_id', TENANT_DEMO),
      sb.from('m11_formateurs').select('active').eq('tenant_id', TENANT_DEMO),
      sb.from('m11_suspicious_patterns').select('severity, status').eq('tenant_id', TENANT_DEMO),
    ]);

    if (parcoursR.error || enrollR.error || pifR.error || lmsR.error || badgesR.error || formateursR.error || patternsR.error) {
      // Soft-fail : on retombe sur mock
      return null;
    }

    type ParcoursRow = { active: boolean };
    type EnrollRow = { status: string };
    type PifRow = { status: string; budget_individual: number | null; budget_consumed: number | null };
    type LmsRow = { status: string; employee_id: string };
    type BadgeRow = { awarded_at: string };
    type FormateurRow = { active: boolean };
    type PatternRow = { severity: string; status: string };

    const parcours = (parcoursR.data ?? []) as ParcoursRow[];
    const enrolls = (enrollR.data ?? []) as EnrollRow[];
    const pifs = (pifR.data ?? []) as PifRow[];
    const lms = (lmsR.data ?? []) as LmsRow[];
    const badges = (badgesR.data ?? []) as BadgeRow[];
    const formateurs = (formateursR.data ?? []) as FormateurRow[];
    const patterns = (patternsR.data ?? []) as PatternRow[];

    const pifSigned = pifs.filter((p) => p.status === 'signed' || p.status === 'in_progress' || p.status === 'closed').length;
    const lmsCompleted = lms.filter((p) => p.status === 'completed').length;
    const lmsLearners = new Set(lms.map((l) => l.employee_id)).size;
    const yearStart = '2026-01-01T00:00:00+00';

    const live: M11CockpitLive = {
      parcoursActifs: parcours.filter((p) => p.active).length,
      enrollmentsActifs: enrolls.filter((e) => e.status === 'active').length,
      enrollmentsCompleted: enrolls.filter((e) => e.status === 'completed').length,
      pifSignedRate: pifs.length === 0 ? 0 : pifSigned / pifs.length,
      pifTotal: pifs.length,
      budgetTotal: sum(pifs.map((p) => p.budget_individual)),
      budgetConsumed: sum(pifs.map((p) => p.budget_consumed)),
      lmsCompletionRate: lms.length === 0 ? 0 : lmsCompleted / lms.length,
      lmsLearners,
      badgesAwardedYtd: badges.filter((b) => b.awarded_at >= yearStart).length,
      formateursActifs: formateurs.filter((f) => f.active).length,
      patternsCritical: patterns.filter((p) => p.severity === 'critical' && p.status !== 'resolved').length,
      patternsOpen: patterns.filter((p) => p.status === 'open' || p.status === 'investigating').length,
      fetchedAt: new Date().toISOString(),
    };

    return live;
  } catch {
    return null;
  }
}
