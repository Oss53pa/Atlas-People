/**
 * Implémentation Supabase du DataProvider (REPORTING_STANDARD §8).
 * Toute lecture/écriture passe ici, jamais `supabase.from(...)` dans l'UI.
 */
import { supabase, isBackendConfigured } from '../lib/supabase';
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
const toRow = (d: Omit<ReportDoc, 'id'> & { id?: number }) => ({
  ...(d.id !== undefined ? { id: d.id } : {}),
  tenant_id: d.tenantId, title: d.title, type: d.type, author: d.author,
  status: d.status, content: d.content ?? null,
  created_at: d.createdAt, updated_at: d.updatedAt,
});
const fromTpl = (r: TemplateRow): ReportTemplate => ({
  id: r.id, tenantId: r.tenant_id, name: r.name, author: r.author ?? '',
  config: r.config, createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
});
const toTpl = (t: Omit<ReportTemplate, 'id'> & { id?: number }) => ({
  ...(t.id !== undefined ? { id: t.id } : {}),
  tenant_id: t.tenantId, name: t.name, author: t.author,
  config: t.config, created_at: t.createdAt, updated_at: t.updatedAt,
});

export const supabaseProvider: DataProvider = {
  async getReports(tenantId: string): Promise<ReportDoc[]> {
    if (!isBackendConfigured || !supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from(TBL_REPORTS)
      .select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
    if (error) { console.warn('[supabaseProvider.getReports]', error.message); return []; }
    return (data ?? []).map((r: unknown) => fromRow(r as ReportRow));
  },
  async getReport(id: number): Promise<ReportDoc | undefined> {
    if (!isBackendConfigured || !supabase) return undefined;
    const { data, error } = await supabase.schema('atlas_people').from(TBL_REPORTS)
      .select('*').eq('id', id).maybeSingle();
    if (error || !data) return undefined;
    return fromRow(data as ReportRow);
  },
  async upsertReport(doc) {
    if (!isBackendConfigured || !supabase) return -1;
    const row = toRow(doc);
    if (doc.id !== undefined) {
      const { error } = await supabase.schema('atlas_people').from(TBL_REPORTS)
        .update(row).eq('id', doc.id);
      if (error) console.warn('[supabaseProvider.upsertReport]', error.message);
      return doc.id;
    } else {
      const { data, error } = await supabase.schema('atlas_people').from(TBL_REPORTS)
        .insert(row).select('id').single();
      if (error) { console.warn('[supabaseProvider.upsertReport]', error.message); return -1; }
      return (data as { id: number }).id;
    }
  },
  async deleteReport(id) {
    if (!isBackendConfigured || !supabase) return;
    const { error } = await supabase.schema('atlas_people').from(TBL_REPORTS).delete().eq('id', id);
    if (error) console.warn('[supabaseProvider.deleteReport]', error.message);
  },
  async getTemplates(tenantId): Promise<ReportTemplate[]> {
    if (!isBackendConfigured || !supabase) return [];
    const { data, error } = await supabase.schema('atlas_people').from(TBL_TEMPLATES)
      .select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
    if (error) return [];
    return (data ?? []).map((r: unknown) => fromTpl(r as TemplateRow));
  },
  async upsertTemplate(tpl) {
    if (!isBackendConfigured || !supabase) return -1;
    const row = toTpl(tpl);
    if (tpl.id !== undefined) {
      await supabase.schema('atlas_people').from(TBL_TEMPLATES).update(row).eq('id', tpl.id);
      return tpl.id;
    } else {
      const { data, error } = await supabase.schema('atlas_people').from(TBL_TEMPLATES)
        .insert(row).select('id').single();
      if (error) return -1;
      return (data as { id: number }).id;
    }
  },
  async deleteTemplate(id) {
    if (!isBackendConfigured || !supabase) return;
    await supabase.schema('atlas_people').from(TBL_TEMPLATES).delete().eq('id', id);
  },
};
