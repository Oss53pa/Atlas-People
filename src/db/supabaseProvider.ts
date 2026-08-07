/**
 * Implémentation Supabase du DataProvider (REPORTING_STANDARD §8).
 * Toute lecture/écriture passe ici, jamais `supabase.from(...)` dans l'UI.
 *
 * Écritures conformes au socle CDC : jamais d'échec silencieux (throw typé),
 * jamais la colonne `id` dans un UPDATE (IDENTITY GENERATED ALWAYS), audit chaîné,
 * `created_at` préservé à la mise à jour.
 */
import { supabase, isBackendConfigured } from '../lib/supabase';
import { mapSupabaseError, NoRowsAffectedError, resolveSessionContext } from '../lib/session';
import { appendAuditEntry } from '../lib/auditLog';
import type { DataProvider } from './provider';
import type { ReportDoc, ReportTemplate } from '../engine/reportBlocks';

const TBL_REPORTS = 'atlas_people_reports';
const TBL_TEMPLATES = 'atlas_people_report_templates';

interface ReportRow {
  id: number;
  tenant_id: string;
  title: string;
  type: string;
  author: string | null;
  status: 'draft' | 'review' | 'approved' | 'diffused';
  content: string | null;
  created_at: number;
  updated_at: number;
}
interface TemplateRow {
  id: number;
  tenant_id: string;
  name: string;
  author: string | null;
  config: string;
  created_at: number;
  updated_at: number;
}

const fromRow = (r: ReportRow): ReportDoc => ({
  id: r.id, tenantId: r.tenant_id, title: r.title, type: r.type,
  author: r.author ?? '', status: r.status, content: r.content ?? undefined,
  createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
});
/** Corps d'écriture SANS `id` (IDENTITY GENERATED ALWAYS → jamais dans insert/update). */
const toRow = (d: Omit<ReportDoc, 'id'>) => ({
  tenant_id: d.tenantId, title: d.title, type: d.type, author: d.author,
  status: d.status, content: d.content ?? null,
  created_at: d.createdAt, updated_at: d.updatedAt,
});
const fromTpl = (r: TemplateRow): ReportTemplate => ({
  id: r.id, tenantId: r.tenant_id, name: r.name, author: r.author ?? '',
  config: r.config, createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
});
const toTpl = (t: Omit<ReportTemplate, 'id'>) => ({
  tenant_id: t.tenantId, name: t.name, author: t.author,
  config: t.config, created_at: t.createdAt, updated_at: t.updatedAt,
});

/** Audit chaîné non bloquant (une écriture de rapport = acte sensible, CDC §6). */
async function audit(tenantId: string, action: string, entityId: string, payload: unknown, entity: string) {
  try {
    const ctx = await resolveSessionContext();
    await appendAuditEntry({ tenantId, actorId: ctx.userId, action, entity, entityId, payload, surface: 'backoffice' });
  } catch { /* l'audit ne doit jamais faire échouer l'écriture métier déjà réussie */ }
}

export const supabaseProvider: DataProvider = {
  async getReports(tenantId: string): Promise<ReportDoc[]> {
    if (!isBackendConfigured || !supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from(TBL_REPORTS)
      .select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
    if (error) throw mapSupabaseError(error);
    return (data ?? []).map((r: unknown) => fromRow(r as ReportRow));
  },
  async getReport(id: number): Promise<ReportDoc | undefined> {
    if (!isBackendConfigured || !supabase) return undefined;
    const { data, error } = await supabase.schema('atlas_people').from(TBL_REPORTS)
      .select('*').eq('id', id).maybeSingle();
    if (error) throw mapSupabaseError(error);
    return data ? fromRow(data as ReportRow) : undefined;
  },
  async upsertReport(doc) {
    if (!isBackendConfigured || !supabase) throw new Error('Backend non configuré');
    const ap = supabase.schema('atlas_people');
    if (doc.id !== undefined) {
      // UPDATE : ni `id` (IDENTITY), ni `created_at` (préservé).
      const { created_at: _created, ...body } = toRow(doc);
      const { data, error } = await ap.from(TBL_REPORTS).update(body)
        .eq('id', doc.id).eq('tenant_id', doc.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('upsertReport');
      await audit(doc.tenantId, 'report.update', String(doc.id), { title: doc.title, status: doc.status }, TBL_REPORTS);
      return doc.id;
    }
    const { data, error } = await ap.from(TBL_REPORTS).insert(toRow(doc)).select('id').single();
    if (error) throw mapSupabaseError(error);
    const id = (data as { id: number }).id;
    await audit(doc.tenantId, 'report.create', String(id), { title: doc.title, status: doc.status }, TBL_REPORTS);
    return id;
  },
  async deleteReport(id, tenantId) {
    if (!isBackendConfigured || !supabase) return;
    let q = supabase.schema('atlas_people').from(TBL_REPORTS).delete().eq('id', id);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data, error } = await q.select('id');
    if (error) throw mapSupabaseError(error);
    if (!data || data.length === 0) throw new NoRowsAffectedError('deleteReport');
    if (tenantId) await audit(tenantId, 'report.delete', String(id), {}, TBL_REPORTS);
  },
  async getTemplates(tenantId): Promise<ReportTemplate[]> {
    if (!isBackendConfigured || !supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from(TBL_TEMPLATES)
      .select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
    if (error) throw mapSupabaseError(error);
    return (data ?? []).map((r: unknown) => fromTpl(r as TemplateRow));
  },
  async upsertTemplate(tpl) {
    if (!isBackendConfigured || !supabase) throw new Error('Backend non configuré');
    const ap = supabase.schema('atlas_people');
    if (tpl.id !== undefined) {
      const { created_at: _created, ...body } = toTpl(tpl);
      const { data, error } = await ap.from(TBL_TEMPLATES).update(body)
        .eq('id', tpl.id).eq('tenant_id', tpl.tenantId).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('upsertTemplate');
      return tpl.id;
    }
    const { data, error } = await ap.from(TBL_TEMPLATES).insert(toTpl(tpl)).select('id').single();
    if (error) throw mapSupabaseError(error);
    return (data as { id: number }).id;
  },
  async deleteTemplate(id, tenantId) {
    if (!isBackendConfigured || !supabase) return;
    let q = supabase.schema('atlas_people').from(TBL_TEMPLATES).delete().eq('id', id);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { error } = await q;
    if (error) throw mapSupabaseError(error);
  },
};
