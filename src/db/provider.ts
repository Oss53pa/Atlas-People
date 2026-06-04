/**
 * Atlas People — DataProvider interface (REPORTING_STANDARD §8).
 *
 * Abstraction unique pour la persistance des rapports & templates. Toute lecture/
 * écriture passe par cette interface (jamais `supabase.from(...)` dans l'UI).
 *
 * Deux implémentations :
 *   - SupabaseProvider : production, RLS par tenant_id
 *   - DemoProvider     : tenant_id = '11111111-...' → writes no-op
 */
import type { ReportDoc, ReportTemplate } from '../engine/reportBlocks';

export interface DataProvider {
  // Rapports
  getReports(tenantId: string): Promise<ReportDoc[]>;
  getReport(id: number): Promise<ReportDoc | undefined>;
  upsertReport(doc: Omit<ReportDoc, 'id'> & { id?: number }): Promise<number>;
  deleteReport(id: number): Promise<void>;

  // Templates (modèles personnels)
  getTemplates(tenantId: string): Promise<ReportTemplate[]>;
  upsertTemplate(tpl: Omit<ReportTemplate, 'id'> & { id?: number }): Promise<number>;
  deleteTemplate(id: number): Promise<void>;
}
