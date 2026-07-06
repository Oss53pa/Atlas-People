/**
 * M9 Compétences — agrégat live Supabase (cockpit · PDC · certifs · anti-discrim).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isBackendConfigured, supabase } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };



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

export function useUpdateSkillAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, skillId, level, evidence }: {
      employeeId: string; skillId: string; level: 1 | 2 | 3 | 4 | 5; evidence?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m9_skill_matrix').upsert({
        tenant_id: ctx.tenantId, employee_id: employeeId, skill_id: skillId,
        level, evidence: evidence ?? null, assessed_at: now, assessed_by: ctx.userId,
      }, { onConflict: 'tenant_id,employee_id,skill_id' });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'eval_auto.skill_assessed',
        entity: 'm9_skill_matrix', entityId: `${employeeId}:${skillId}`,
        payload: { employeeId, skillId, level },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m9-raw'] }),
  });
}

export function useCreatePDC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, cycleYear, managerId }: { employeeId: string; cycleYear: number; managerId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m9_pdc').insert({
        id, tenant_id: ctx.tenantId, employee_id: employeeId,
        cycle_year: cycleYear, manager_id: managerId, status: 'draft', created_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'pdc.created',
        entity: 'm9_pdc', entityId: id,
        payload: { employeeId, cycleYear },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m9-raw'] }),
  });
}

export function useAddPDCAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pdcId, actionType, title, skillId, targetLevel, plannedDate }: {
      pdcId: string; actionType: string; title: string;
      skillId?: string; targetLevel?: number; plannedDate: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m9_pdc_actions').insert({
        id, tenant_id: ctx.tenantId, pdc_id: pdcId, action_type: actionType, title,
        skill_id: skillId ?? null, target_level: targetLevel ?? null,
        planned_date: plannedDate, status: 'planned', created_at: now,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'pdc.action_added',
        entity: 'm9_pdc_actions', entityId: id,
        payload: { pdcId, actionType, title },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m9-raw'] }),
  });
}

export function useCompletePDCAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionId }: { actionId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m9_pdc_actions')
        .update({ status: 'completed', completed_at: now, updated_at: now })
        .eq('id', actionId).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useCompletePDCAction');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'pdc.action_completed',
        entity: 'm9_pdc_actions', entityId: actionId,
        payload: { actionId },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m9-raw'] }),
  });
}

export function useSignPDC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pdcId }: { pdcId: string }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { data, error } = await sb.schema('atlas_people').from('m9_pdc')
        .update({ status: 'signed', signed_at: now, updated_at: now })
        .eq('id', pdcId).eq('tenant_id', ctx.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('useSignPDC');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'pdc.signed_advist',
        entity: 'm9_pdc', entityId: pdcId,
        payload: { pdcId },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m9-raw'] }),
  });
}

export function useRecordCertificationObtained() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, certificationId, obtainedAt, expiresAt, score }: {
      employeeId: string; certificationId: string; obtainedAt: string; expiresAt?: string; score?: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const now = new Date().toISOString();
      const { error } = await sb.schema('atlas_people').from('m9_certifications_employees').upsert({
        tenant_id: ctx.tenantId, employee_id: employeeId, certification_id: certificationId,
        status: 'obtained', obtained_at: obtainedAt, expires_at: expiresAt ?? null,
        score: score ?? null, updated_at: now,
      }, { onConflict: 'tenant_id,employee_id,certification_id' });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'certification.obtained',
        entity: 'm9_certifications_employees', entityId: `${employeeId}:${certificationId}`,
        payload: { employeeId, certificationId, obtainedAt },
        surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m9-raw'] }),
  });
}
