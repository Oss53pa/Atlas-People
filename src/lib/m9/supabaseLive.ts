/**
 * M9 Compétences — agrégat live Supabase (cockpit · PDC · certifs · anti-discrim).
 */
import { isBackendConfigured, supabase } from '../supabase';



export interface M9LiveKpis {
  skillsTotal: number;
  matrixEntries: number;
  pdcTotal: number;
  pdcSigned: number;
  pdcActionsActive: number;
  certsCatalog: number;
  certsObtained: number;
  certsExpiring90d: number;
  patternsCritical: number; // high+
  antiDiscrimOpen: number;
  fetchedAt: string;
}

export async function fetchM9Live(tenantId = '11111111-1111-1111-1111-111111111111'): Promise<M9LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [skills, matrix, pdc, actions, certCat, certEmp, patterns, discrim] = await Promise.all([
      sb.from('m9_skills').select('id').eq('tenant_id', tenantId),
      sb.from('m9_skill_matrix').select('id').eq('tenant_id', tenantId),
      sb.from('m9_pdc').select('status, signed_at').eq('tenant_id', tenantId),
      sb.from('m9_pdc_actions').select('status').eq('tenant_id', tenantId),
      sb.from('m9_certifications_catalog').select('id').eq('tenant_id', tenantId),
      sb.from('m9_certifications_employees').select('status, expires_at').eq('tenant_id', tenantId),
      sb.from('m9_suspicious_patterns').select('severity, status').eq('tenant_id', tenantId),
      sb.from('m9_anti_discrim_alerts').select('status').eq('tenant_id', tenantId),
    ]);
    if (skills.error || matrix.error || pdc.error || actions.error || certCat.error || certEmp.error || patterns.error || discrim.error) return null;

    type PdcRow = { status: string; signed_at: string | null };
    type ActionRow = { status: string };
    type CertEmpRow = { status: string; expires_at: string | null };
    type PatternRow = { severity: string; status: string };
    type DiscrimRow = { status: string };

    const pdcArr = (pdc.data ?? []) as PdcRow[];
    const actionsArr = (actions.data ?? []) as ActionRow[];
    const certEmpArr = (certEmp.data ?? []) as CertEmpRow[];
    const patternsArr = (patterns.data ?? []) as PatternRow[];
    const discrimArr = (discrim.data ?? []) as DiscrimRow[];

    const today = new Date().toISOString().slice(0, 10);
    const in90d = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);

    return {
      skillsTotal: (skills.data ?? []).length,
      matrixEntries: (matrix.data ?? []).length,
      pdcTotal: pdcArr.length,
      pdcSigned: pdcArr.filter((p) => p.signed_at !== null).length,
      pdcActionsActive: actionsArr.filter((a) => a.status === 'in_progress' || a.status === 'planned').length,
      certsCatalog: (certCat.data ?? []).length,
      certsObtained: certEmpArr.filter((c) => c.status === 'obtained' || c.status === 'renewed').length,
      certsExpiring90d: certEmpArr.filter((c) => c.expires_at !== null && c.expires_at >= today && c.expires_at <= in90d).length,
      patternsCritical: patternsArr.filter((p) => (p.severity === 'high' || p.severity === 'critical') && p.status !== 'resolved').length,
      antiDiscrimOpen: discrimArr.filter((d) => d.status === 'open' || d.status === 'investigating' || d.status === 'escalated').length,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
