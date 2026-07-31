/**
 * M3 Paramétrage — couche live Supabase.
 * Tables : payroll_rubriques, payroll_tenant_parameters
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
import type { RubriqueType } from './referentiels';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';

// ── Types ─────────────────────────────────────────────────────────────

export interface RubriqueLive {
  id: string;
  code: string;
  libelle: string;
  category: string;
  type: RubriqueType;
  baseCnps: boolean;
  baseIrpp: boolean;
  active: boolean;
  status: 'draft' | 'submitted' | 'validated' | 'published' | 'refused' | 'archived';
  order: number;
  version: number;
  calcMode: 'fixed' | 'rate' | 'bareme' | 'formula';
}

export interface TenantCalcRules {
  rounding: 'half_even' | 'half_up';
  prorataMode: 'calendar' | 'worked';
  smigGuard: boolean;
  quotaGuard: boolean;
}

// ── Queries ───────────────────────────────────────────────────────────

export function useM3Rubriques(tenantId?: string) {
  return useQuery({
    queryKey: ['m3-rubriques', tenantId ?? DEMO],
    queryFn: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase.schema('atlas_people')
        .from('payroll_rubriques')
        .select('id, code, libelle_fr, category, rubrique_type, enters_base_cnps, enters_base_irpp, active, status, visible_position, version')
        .eq('tenant_id', tenantId ?? DEMO)
        .neq('status', 'archived')
        .order('visible_position', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>): RubriqueLive => ({
        id: r.id as string,
        code: r.code as string,
        libelle: r.libelle_fr as string,
        category: r.category as string,
        type: r.rubrique_type as RubriqueType,
        baseCnps: Boolean(r.enters_base_cnps),
        baseIrpp: Boolean(r.enters_base_irpp),
        active: Boolean(r.active),
        status: r.status as RubriqueLive['status'],
        order: Number(r.visible_position ?? 999),
        version: Number(r.version ?? 1),
        calcMode: r.rubrique_type === 'gain' ? 'fixed'
               : r.rubrique_type === 'info'  ? 'formula'
               : 'rate',
      }));
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

export function useM3TenantParams(tenantId?: string) {
  return useQuery({
    queryKey: ['m3-tenant-params', tenantId ?? DEMO],
    queryFn: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase.schema('atlas_people')
        .from('payroll_tenant_parameters')
        .select('section, params')
        .eq('tenant_id', tenantId ?? DEMO)
        .in('section', ['arrondis', 'calendrier', 'bornages']);
      if (error) throw error;
      const m: Record<string, Record<string, unknown>> = Object.fromEntries(
        (data ?? []).map((r: Record<string, unknown>) => [r.section as string, r.params as Record<string, unknown>])
      );
      return {
        rounding: (m['arrondis']?.rounding_mode as 'half_even' | 'half_up') ?? 'half_even',
        prorataMode: (m['calendrier']?.prorata_mode as 'calendar' | 'worked') ?? 'worked',
        smigGuard: (m['bornages']?.smig_guard as boolean) ?? true,
        quotaGuard: (m['bornages']?.quota_guard as boolean) ?? true,
      } as TenantCalcRules;
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────

export interface RubriquePatch {
  id: string;
  code: string;
  rubrique_type?: RubriqueType;
  active?: boolean;
  enters_base_cnps?: boolean;
  enters_base_irpp?: boolean;
  visible_position?: number;
}

export function usePatchRubrique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RubriquePatch) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const changes: Record<string, unknown> = {};
      if (payload.rubrique_type !== undefined) changes.rubrique_type = payload.rubrique_type;
      if (payload.active !== undefined) {
        changes.active = payload.active;
        changes.status = payload.active ? 'published' : 'draft';
      }
      if (payload.enters_base_cnps !== undefined) changes.enters_base_cnps = payload.enters_base_cnps;
      if (payload.enters_base_irpp !== undefined) changes.enters_base_irpp = payload.enters_base_irpp;
      if (payload.visible_position !== undefined) changes.visible_position = payload.visible_position;
      if (!Object.keys(changes).length) return payload.id;
      const { data, error } = await sb.schema('atlas_people').from('payroll_rubriques')
        .update(changes)
        .eq('id', payload.id).eq('tenant_id', ctx.tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('patchRubrique');
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'rubrique.update',
        entity: 'payroll_rubriques', entityId: payload.id,
        payload: { code: payload.code, changes }, surface: 'backoffice',
      });
      return payload.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m3-rubriques'] }),
  });
}

export interface RubriqueCreatePayload {
  code: string;
  libelle: string;
  type: RubriqueType;
  category: string;
  baseCnps: boolean;
  baseIrpp: boolean;
  order: number;
}

export function useCreateRubrique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RubriqueCreatePayload) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('payroll_rubriques').insert({
        id,
        tenant_id: ctx.tenantId,
        code: payload.code,
        libelle_fr: payload.libelle,
        category: payload.category,
        rubrique_type: payload.type,
        enters_base_cnps: payload.baseCnps,
        enters_base_irpp: payload.baseIrpp,
        active: false,
        status: 'draft',
        visible_position: payload.order,
        version: 1,
        created_by: ctx.userId,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'rubrique.create',
        entity: 'payroll_rubriques', entityId: id,
        payload: { code: payload.code, type: payload.type }, surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m3-rubriques'] }),
  });
}

export function useSaveCalcRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rules: TenantCalcRules) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const ap = sb.schema('atlas_people');
      const upserts = [
        { tenant_id: ctx.tenantId, section: 'arrondis',   params: { rounding_mode: rules.rounding } },
        { tenant_id: ctx.tenantId, section: 'calendrier', params: { prorata_mode: rules.prorataMode } },
        { tenant_id: ctx.tenantId, section: 'bornages',   params: { smig_guard: rules.smigGuard, quota_guard: rules.quotaGuard } },
      ];
      for (const u of upserts) {
        const { error } = await ap.from('payroll_tenant_parameters')
          .upsert({ ...u, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,section' });
        if (error) throw mapSupabaseError(error);
      }
      const journalId = crypto.randomUUID();
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'tenant_params.save',
        entity: 'payroll_tenant_parameters', entityId: journalId,
        payload: rules, surface: 'backoffice',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m3-tenant-params'] }),
  });
}
