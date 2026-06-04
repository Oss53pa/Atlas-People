/**
 * Demo provider — intercepte tenant_id = TENANT_DEMO (`11111111-...`) :
 * - reads vont d'abord à Supabase si configuré (le seed démo y vit)
 * - writes sont no-op pour préserver l'intégrité du tenant démo public
 */
import { supabaseProvider } from './supabaseProvider';
import type { DataProvider } from './provider';

const TENANT_DEMO_PREFIX = '11111111-1111-1111-1111-';

export const demoProvider: DataProvider = {
  async getReports(tenantId) { return supabaseProvider.getReports(tenantId); },
  async getReport(id)        { return supabaseProvider.getReport(id); },
  async upsertReport(doc) {
    if (doc.tenantId.startsWith(TENANT_DEMO_PREFIX)) {
      console.info('[demoProvider] upsertReport no-op pour tenant démo');
      return doc.id ?? -1;
    }
    return supabaseProvider.upsertReport(doc);
  },
  async deleteReport(id) { /* lecture only en démo */ return supabaseProvider.deleteReport(id); },
  async getTemplates(tenantId) { return supabaseProvider.getTemplates(tenantId); },
  async upsertTemplate(tpl) {
    if (tpl.tenantId.startsWith(TENANT_DEMO_PREFIX)) {
      console.info('[demoProvider] upsertTemplate no-op pour tenant démo');
      return tpl.id ?? -1;
    }
    return supabaseProvider.upsertTemplate(tpl);
  },
  async deleteTemplate(id) { return supabaseProvider.deleteTemplate(id); },
};

/** Le provider effectif utilisé par l'app. */
export const dataProvider: DataProvider = demoProvider;
