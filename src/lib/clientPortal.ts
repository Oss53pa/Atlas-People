/**
 * Portail client — accès du contact d'une entreprise cliente à SON espace.
 *
 * Ce n'est ni l'espace salarié (`/espace`) ni l'espace manager (`/team`) :
 * le contact client n'est membre d'aucun workspace. Son périmètre est un
 * CLIENT à l'intérieur du tenant du cabinet, borné par les rubriques que
 * le cabinet lui a ouvertes (cf. migration 0071).
 */
import { supabase, isBackendConfigured } from './supabase';

const ap = () => {
  if (!supabase) throw new Error('Backend non configuré');
  return supabase.schema('atlas_people');
};

export type PortalProduct =
  | 'entreprise' | 'cabinet_complet' | 'cabinet_paie' | 'cabinet_mixte' | 'cabinet_agence';

export interface ClientPortalContext {
  portalId: string;
  clientId: string;
  clientName: string;
  clientPays: string;
  clientEffectif: number;
  contactName: string;
  contactEmail: string;
  /** Produit du cabinet — c'est lui qui décide des rubriques affichées. */
  productType: PortalProduct;
  cabinetName: string;
  scopes: {
    payslips: boolean;
    headcount: boolean;
    compliance: boolean;
    invoices: boolean;
    documents: boolean;
  };
  lastAccessAt: string | null;
}

export interface PortalInvoice {
  id: string;
  reference: string;
  period_label: string;
  status: 'envoyee' | 'payee';
  currency: string;
  subtotal_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  issued_on: string | null;
  due_on: string | null;
  paid_at: string | null;
  headcount: number;
}

export interface PortalInvoiceLine {
  id: string;
  position: number;
  label: string;
  quantity: number;
  unit_amount: number;
  amount: number;
}

/**
 * Rattache le compte au portail ouvert par le cabinet, sur la base de
 * l'email vérifié, puis renvoie le contexte. Retourne null si aucune
 * invitation ne correspond — le compte n'est alors pas un contact client.
 */
export async function resolveClientPortal(): Promise<ClientPortalContext | null> {
  if (!isBackendConfigured) return null;

  // La liaison est idempotente : réappelée à chaque ouverture, elle ne fait
  // rien si le compte est déjà rattaché.
  await ap().rpc('claim_client_portal').then(
    () => undefined,
    () => undefined, // pas d'invitation : ce compte n'est simplement pas un client
  );

  const { data, error } = await ap().rpc('my_client_portal');
  if (error) return null;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    portalId: row.portal_id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    clientPays: (row.client_pays as string) ?? '',
    clientEffectif: (row.client_effectif as number) ?? 0,
    contactName: (row.contact_name as string) ?? '',
    contactEmail: (row.contact_email as string) ?? '',
    productType: (row.product_type as PortalProduct) ?? 'cabinet_complet',
    cabinetName: (row.cabinet_name as string) ?? 'Votre cabinet',
    scopes: {
      payslips: Boolean(row.scope_payslips),
      headcount: Boolean(row.scope_headcount),
      compliance: Boolean(row.scope_compliance),
      invoices: Boolean(row.scope_invoices),
      documents: Boolean(row.scope_documents),
    },
    lastAccessAt: (row.last_access_at as string) ?? null,
  };
}

/** Journalise la consultation (une entrée par heure côté base). */
export async function touchPortalAccess(detail?: string): Promise<void> {
  if (!isBackendConfigured) return;
  await ap().rpc('touch_portal_access', { p_detail: detail ?? null }).then(
    () => undefined, () => undefined,
  );
}

/** Factures adressées au client — les brouillons ne lui sont jamais visibles. */
export async function fetchPortalInvoices(): Promise<PortalInvoice[]> {
  const { data, error } = await ap()
    .from('prefactures')
    .select('id, reference, period_label, status, currency, subtotal_amount, tax_rate, tax_amount, total_amount, issued_on, due_on, paid_at, headcount')
    .order('period_start', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PortalInvoice[];
}

export async function fetchPortalInvoiceLines(invoiceId: string): Promise<PortalInvoiceLine[]> {
  const { data } = await ap()
    .from('prefacture_lines')
    .select('id, position, label, quantity, unit_amount, amount')
    .eq('prefacture_id', invoiceId)
    .order('position');
  return (data ?? []) as PortalInvoiceLine[];
}

// ── Rubriques du portail, adaptées au produit du cabinet ──────────────

export interface PortalSection {
  key: string;
  label: string;
  description: string;
}

/**
 * Ce que le client peut consulter, selon le produit du cabinet ET les
 * rubriques ouvertes. Un client de bureau de paie n'attend pas les mêmes
 * écrans qu'un client d'agence de placement.
 */
export function portalSections(ctx: ClientPortalContext): PortalSection[] {
  const s = ctx.scopes;
  const sections: PortalSection[] = [];

  if (s.headcount) {
    sections.push(
      ctx.productType === 'cabinet_agence'
        ? { key: 'effectifs', label: 'Travailleurs placés', description: 'Les personnes mises à disposition sur vos sites.' }
        : { key: 'effectifs', label: 'Effectifs', description: 'Les collaborateurs gérés pour votre compte.' },
    );
  }

  if (s.payslips) {
    sections.push(
      ctx.productType === 'cabinet_paie'
        ? { key: 'paie', label: 'Bulletins & déclarations', description: 'Bulletins produits et déclarations sociales transmises.' }
        : { key: 'paie', label: 'Paie', description: 'Bulletins et journaux de paie de la période.' },
    );
  }

  if (s.compliance) {
    sections.push({ key: 'conformite', label: 'Conformité', description: 'Obligations légales et échéances suivies pour vous.' });
  }

  if (s.invoices) {
    sections.push({ key: 'factures', label: 'Mes factures', description: 'Honoraires du cabinet, période par période.' });
  }

  if (s.documents) {
    sections.push({ key: 'documents', label: 'Documents', description: 'Pièces mises à votre disposition par le cabinet.' });
  }

  return sections;
}

export function formatAmount(amount: number, currency = 'XOF'): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}`;
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}
