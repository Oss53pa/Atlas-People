/**
 * M12 Conformité & SST — agrégat live Supabase (DUER · AT · RPS · déclarations).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isBackendConfigured, supabase } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };

function computeRiskLevel(p: number, s: number): 'acceptable' | 'modere' | 'eleve' | 'critique' {
  const ps = p * s;
  if (ps <= 4) return 'acceptable';
  if (ps <= 8) return 'modere';
  if (ps <= 12) return 'eleve';
  return 'critique';
}

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

export async function fetchM12Live(tenantId = '11111111-1111-1111-1111-111111111111'): Promise<M12LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [risks, ats, rps, decls, auths] = await Promise.all([
      sb.from('m12_risks').select('level').eq('tenant_id', tenantId),
      sb.from('m12_work_incidents').select('severity, status').eq('tenant_id', tenantId),
      sb.from('m12_rps_surveys').select('status, burnout_risk_pct').eq('tenant_id', tenantId),
      sb.from('m12_social_declarations').select('status, due_date').eq('tenant_id', tenantId),
      sb.from('m12_authorizations').select('expires_at, status').eq('tenant_id', tenantId),
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

/* ═══════════════════════ MUTATIONS CDC ═══════════════════════════════════════
 * Chaque mutation suit le socle CDC Remédiation :
 *   getSupabaseOrThrow → insert → appendAuditEntry → NoRowsAffectedError si UPDATE.
 * Payload audit : identifiants techniques uniquement.
 * Interdiction : nom, montant salaire, motif médical dans les breadcrumbs.
 * ══════════════════════════════════════════════════════════════════════════ */

export function useCreateDuerRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ category, unite, hazard, probability, severity }: {
      category: string; unite: string; hazard: string;
      probability: number; severity: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const year = new Date().getFullYear();
      const ref = `RSK-${year}-${id.slice(0, 6).toUpperCase()}`;
      const level = computeRiskLevel(probability, severity);
      const today = new Date().toISOString().slice(0, 10);
      const nextReview = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);
      const { error } = await sb.schema('atlas_people').from('m12_risks').insert({
        id, tenant_id: ctx.tenantId, ref, category, unite, hazard,
        probability, severity, level,
        controls: [], actions: [],
        exposed_employee_count: 0,
        last_review_at: today,
        next_review_due: nextReview,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'duer_risk.create',
        entity: 'm12_risks', entityId: id,
        payload: { ref, category, unite },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m12-risks-live'] }),
  });
}

export function useCreateWorkIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, severity, occurredAt, description, workdaysLost }: {
      type: string; severity: string; occurredAt: string;
      description: string; workdaysLost: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const year = new Date().getFullYear();
      const ref = `INC-${year}-${id.slice(0, 6).toUpperCase()}`;
      const today = new Date().toISOString().slice(0, 10);
      const diffHours = (Date.now() - new Date(occurredAt).getTime()) / 3_600_000;
      const declaredWithinSLA = diffHours <= 48;
      const { error } = await sb.schema('atlas_people').from('m12_work_incidents').insert({
        id, tenant_id: ctx.tenantId, ref,
        employee_id: ctx.employeeId,
        type, severity,
        occurred_at: occurredAt,
        declared_at: today,
        unite: '', location: '', description,
        workdays_lost: workdaysLost,
        third_party_involved: false,
        corrective_actions: [],
        status: 'declare',
        declared_within_sla: declaredWithinSLA,
      });
      if (error) throw mapSupabaseError(error);
      // Payload : type/sévérité/ref uniquement — pas d'identifiant employé (CDC SST §3)
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'work_incident.create',
        entity: 'm12_work_incidents', entityId: id,
        payload: { ref, type, severity },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m12-incidents-live'] }),
  });
}

export function useCreateRpsSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, scopeLabel, targetRespondents }: {
      title: string; scopeLabel: string; targetRespondents: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const year = new Date().getFullYear();
      const ref = `RPS-${year}-${id.slice(0, 6).toUpperCase()}`;
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await sb.schema('atlas_people').from('m12_rps_surveys').insert({
        id, tenant_id: ctx.tenantId, ref, title,
        scope: 'company', scope_label: scopeLabel,
        status: 'open',
        opened_at: today,
        target_respondents: targetRespondents,
        respondents: 0,
        listening_cell_triggered: false,
      });
      if (error) throw mapSupabaseError(error);
      // PROPH3T JAMAIS sur données RPS individuelles — payload scope technique uniquement
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'rps_survey.create',
        entity: 'm12_rps_surveys', entityId: id,
        payload: { ref, scope: 'company' },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m12-rps-live'] }),
  });
}

export function useCreateSocialDeclaration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, period, frequency, dueDate, amountDeclared }: {
      kind: string; period: string; frequency: string;
      dueDate: string; amountDeclared: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const year = new Date().getFullYear();
      const ref = `DECL-${year}-${id.slice(0, 6).toUpperCase()}`;
      const { error } = await sb.schema('atlas_people').from('m12_social_declarations').insert({
        id, tenant_id: ctx.tenantId, ref, kind,
        period, frequency,
        due_date: dueDate,
        amount_declared: amountDeclared,
        status: 'draft',
        headcount: 0,
      });
      if (error) throw mapSupabaseError(error);
      // Pas de montant dans le payload audit (CDC §1 — interdiction données financières RH)
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'social_declaration.create',
        entity: 'm12_social_declarations', entityId: id,
        payload: { ref, kind, period },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m12-decl-live'] }),
  });
}

// SECRET MÉDICAL ABSOLU — aucune donnée médicale individuelle dans audit_log.
// Chaîne médicale séparée : m12_medical_access_log (INSERT-only RLS).
// Prod : hash SHA-256 complété par EF verify-m12-audit-chain.
export function useProgramMedicalVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, scheduledAt }: {
      kind: string; scheduledAt: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const year = new Date().getFullYear();
      const ref = `VM-${year}-${id.slice(0, 6).toUpperCase()}`;
      const { error } = await sb.schema('atlas_people').from('m12_medical_visits').insert({
        id, tenant_id: ctx.tenantId, ref,
        employee_id: ctx.employeeId,
        kind,
        scheduled_at: scheduledAt,
        status: 'scheduled',
      });
      if (error) throw mapSupabaseError(error);
      // Chaîne médicale séparée — colonnes exactes de m12_medical_access_log (migration 0045).
      // patient_employee_id = employé concerné par la visite (= acteur connecté ici, car auto-déclaration).
      // hash null → EF verify-m12-audit-chain complète la chaîne en prod.
      const { error: logErr } = await sb.schema('atlas_people').from('m12_medical_access_log').insert({
        tenant_id: ctx.tenantId,
        accessor_id: ctx.userId,
        accessor_role: 'rh_admin',
        patient_employee_id: ctx.employeeId,
        resource_type: 'medical_visit',
        resource_id: id,
        access_reason: `schedule_${kind}`,
        data_modified: true,
      });
      if (logErr) throw mapSupabaseError(logErr);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m12-visits-live'] }),
  });
}

export function useScheduleReunionComite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ comiteType, plannedAt, odj }: {
      comiteType: string; plannedAt: string; odj: string[];
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const year = new Date().getFullYear();
      const ref = `RUN-${comiteType.toUpperCase().slice(0, 4)}-${year}-${id.slice(0, 5).toUpperCase()}`;
      // Upsert comite if not exists
      const { data: comite, error: comiteErr } = await sb.schema('atlas_people')
        .from('m12_gouvernance_comites')
        .upsert({
          tenant_id: ctx.tenantId,
          type: comiteType,
          label: comiteType,
          frequence: comiteType === 'CHSCT' ? 'trimestriel' : comiteType === 'ComiteHSE' ? 'mensuel' : 'annuel',
        }, { onConflict: 'tenant_id,type', ignoreDuplicates: false })
        .select('id')
        .single();
      if (comiteErr) throw mapSupabaseError(comiteErr);
      const { error } = await sb.schema('atlas_people').from('m12_gouvernance_comites_reunions').insert({
        id, tenant_id: ctx.tenantId, comite_id: comite.id, ref,
        planned_at: plannedAt,
        status: 'planned',
        odj,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'gouvernance.reunion_scheduled',
        entity: 'm12_gouvernance_comites_reunions', entityId: id,
        payload: { ref, comiteType, plannedAt },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m12-gouvernance-live'] }),
  });
}

export function useUpdatePolitiqueTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      // Upsert politique tenant
      const { data: existing } = await sb.schema('atlas_people')
        .from('m12_gouvernance_politique_tenant')
        .select('id, current_version')
        .eq('tenant_id', ctx.tenantId)
        .maybeSingle();
      const nextVersion = (existing?.current_version ?? 0) + 1;
      if (existing?.id) {
        const { error } = await sb.schema('atlas_people')
          .from('m12_gouvernance_politique_tenant')
          .update({ ...patch, current_version: nextVersion, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw mapSupabaseError(error);
      } else {
        const { error } = await sb.schema('atlas_people')
          .from('m12_gouvernance_politique_tenant')
          .insert({ id: crypto.randomUUID(), tenant_id: ctx.tenantId, ...patch, current_version: 1 });
        if (error) throw mapSupabaseError(error);
      }
      // Snapshot versionné
      const { error: snapErr } = await sb.schema('atlas_people')
        .from('m12_gouvernance_politique_versions')
        .insert({
          id, tenant_id: ctx.tenantId,
          version: nextVersion,
          snapshot: patch,
          changed_by: ctx.userId,
        });
      if (snapErr) throw mapSupabaseError(snapErr);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'gouvernance.politique_updated',
        entity: 'm12_gouvernance_politique_tenant', entityId: id,
        payload: { version: nextVersion },
        surface: 'backoffice',
      });
      return nextVersion;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m12-gouvernance-live'] }),
  });
}

export function useCreateSuspiciousPattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ patternCode, severity, patternData, penaImplications, cnpsImplications }: {
      patternCode: string; severity: 'critical' | 'high' | 'medium' | 'low';
      patternData?: Record<string, unknown>;
      penaImplications?: boolean; cnpsImplications?: boolean;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('m12_suspicious_patterns').insert({
        id, tenant_id: ctx.tenantId,
        pattern_code: patternCode,
        severity,
        pattern_data: patternData ?? {},
        penal_implications: penaImplications ?? false,
        cnps_implications: cnpsImplications ?? false,
        juriste_notified: severity === 'critical',
        dg_notified: severity === 'critical',
        status: 'open',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'audit.suspicious_detected',
        entity: 'm12_suspicious_patterns', entityId: id,
        payload: { patternCode, severity },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m12-alertes-live'] }),
  });
}

export function useCreateAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ scope, title, plannedAt }: {
      scope: string; title: string; plannedAt: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const year = new Date().getFullYear();
      const ref = `AUD-${year}-${id.slice(0, 6).toUpperCase()}`;
      const { error } = await sb.schema('atlas_people').from('m12_audits').insert({
        id, tenant_id: ctx.tenantId, ref, scope, title,
        lead_auditor_employee_id: ctx.employeeId,
        planned_at: plannedAt,
        status: 'planned',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'audit.create',
        entity: 'm12_audits', entityId: id,
        payload: { ref, scope, title },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m12-audits-live'] }),
  });
}
