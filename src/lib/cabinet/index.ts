/**
 * Domaine cabinet — mandat, préfacturation, portails client.
 *
 * Couche d'accès unique aux tables créées par la migration 0069 et au
 * moteur de la 0070. Les écrans n'écrivent jamais un total ni une date de
 * transition : la base les calcule et les horodate, sans quoi l'affichage
 * et la donnée finiraient par diverger.
 */
import { supabase, isBackendConfigured } from '../supabase';

const ap = () => {
  if (!supabase) throw new Error('Backend non configuré');
  return supabase.schema('atlas_people');
};

export const cabinetLive = isBackendConfigured;

// ── Types ─────────────────────────────────────────────────────────────

export type MandateType = 'gestion_rh_complete' | 'paie_seule' | 'mise_a_disposition' | 'conseil_ponctuel';
export type ContractStatus = 'brouillon' | 'actif' | 'suspendu' | 'resilie';
export type BillingMode = 'forfait' | 'par_collaborateur' | 'par_bulletin' | 'mixte';
export type BillingPeriod = 'mensuelle' | 'trimestrielle' | 'annuelle';
export type PrefactureStatus = 'brouillon' | 'validee' | 'envoyee' | 'payee' | 'annulee';
export type PortalStatus = 'non_active' | 'invite' | 'actif' | 'revoque';

export interface Client {
  id: string;
  name: string;
  pays: string;
  effectif: number;
  status: 'actif' | 'en_attente' | 'suspendu';
  modules: string[];
  contact: string | null;
  email: string | null;
  secteur: string | null;
  ville: string | null;
  depuis: string | null;
  conformite: number;
  updated_at: string;
}

export interface ClientContract {
  id: string;
  client_id: string;
  reference: string;
  mandate_type: MandateType;
  status: ContractStatus;
  mandant_raison_sociale: string;
  mandant_forme_juridique: string | null;
  mandant_rccm: string | null;
  mandant_nif: string | null;
  mandant_siege: string | null;
  mandant_representant: string | null;
  mandant_qualite: string | null;
  mandataire_signataire: string | null;
  mandataire_qualite: string | null;
  signed_on: string | null;
  effective_from: string;
  effective_to: string | null;
  notice_days: number;
  tacit_renewal: boolean;
  billing_mode: BillingMode;
  currency: string;
  unit_amount: number;
  forfait_amount: number;
  minimum_amount: number;
  billing_period: BillingPeriod;
  billing_day: number;
  payment_terms_days: number;
  late_penalty_rate: number;
  tax_rate: number;
  scope_modules: string[];
  sla_hours: number | null;
  payroll_cutoff_day: number | null;
  confidentiality: boolean;
  data_protection: boolean;
  notes: string | null;
}

export interface PrefactureLine {
  id: string;
  prefacture_id: string;
  position: number;
  label: string;
  kind: 'abonnement' | 'collaborateur' | 'bulletin' | 'prestation' | 'remise';
  quantity: number;
  unit_amount: number;
  amount: number;
}

export interface Prefacture {
  id: string;
  client_id: string;
  contract_id: string | null;
  reference: string;
  period_start: string;
  period_end: string;
  period_label: string;
  status: PrefactureStatus;
  currency: string;
  headcount: number;
  subtotal_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  issued_on: string | null;
  sent_at: string | null;
  due_on: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  notes: string | null;
  validated_at: string | null;
  created_at: string;
}

export interface PrefactureWithClient extends Prefacture {
  client: Pick<Client, 'id' | 'name' | 'pays' | 'effectif'> | null;
}

export interface ClientPortal {
  id: string;
  client_id: string;
  contact_name: string;
  contact_email: string;
  status: PortalStatus;
  scope_payslips: boolean;
  scope_headcount: boolean;
  scope_compliance: boolean;
  scope_invoices: boolean;
  scope_documents: boolean;
  invited_at: string | null;
  activated_at: string | null;
  revoked_at: string | null;
  last_access_at: string | null;
}

export interface PortalAccess {
  id: string;
  portal_id: string;
  occurred_at: string;
  action: 'invitation' | 'activation' | 'consultation' | 'telechargement' | 'revocation';
  detail: string | null;
}

export interface RapportCabinetRow {
  client_id: string;
  client_name: string;
  pays: string;
  status: string;
  effectif: number;
  conformite: number;
  modules_count: number;
  contract_reference: string | null;
  mandate_type: MandateType | null;
  contract_status: ContractStatus | null;
  billing_mode: BillingMode | null;
  currency: string | null;
  prefactures_count: number;
  total_facture: number;
  total_encaisse: number;
  total_en_attente: number;
  derniere_periode: string | null;
  portails_actifs: number | null;
  dernier_acces: string | null;
}

// ── Libellés métier ───────────────────────────────────────────────────

export const MANDATE_LABEL: Record<MandateType, string> = {
  gestion_rh_complete: 'Gestion RH complète',
  paie_seule: 'Paie seule',
  mise_a_disposition: 'Mise à disposition',
  conseil_ponctuel: 'Conseil ponctuel',
};

export const BILLING_LABEL: Record<BillingMode, string> = {
  forfait: 'Forfait',
  par_collaborateur: 'Par collaborateur',
  par_bulletin: 'Par bulletin',
  mixte: 'Forfait + variable',
};

export const PERIOD_LABEL: Record<BillingPeriod, string> = {
  mensuelle: 'Mensuelle',
  trimestrielle: 'Trimestrielle',
  annuelle: 'Annuelle',
};

export const PREFACTURE_LABEL: Record<PrefactureStatus, string> = {
  brouillon: 'Brouillon',
  validee: 'Validée',
  envoyee: 'Envoyée',
  payee: 'Payée',
  annulee: 'Annulée',
};

export const PORTAL_LABEL: Record<PortalStatus, string> = {
  non_active: 'Non activé',
  invite: 'Invitation envoyée',
  actif: 'Portail actif',
  revoque: 'Révoqué',
};

/**
 * Transition suivante autorisée — miroir exact du garde-fou SQL
 * (guard_prefacture_status). L'interface ne propose que ce que la base
 * accepterait : proposer un bouton voué à l'échec serait un piège.
 */
export function nextPrefactureStatus(status: PrefactureStatus): PrefactureStatus | null {
  switch (status) {
    case 'brouillon': return 'validee';
    case 'validee':   return 'envoyee';
    case 'envoyee':   return 'payee';
    default:          return null;
  }
}

export function canCancelPrefacture(status: PrefactureStatus): boolean {
  return status === 'brouillon' || status === 'validee' || status === 'envoyee';
}

// ── Lectures ──────────────────────────────────────────────────────────

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await ap().from('clients').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function fetchClient(id: string): Promise<Client | null> {
  const { data } = await ap().from('clients').select('*').eq('id', id).maybeSingle();
  return (data as Client) ?? null;
}

export async function fetchContracts(clientId?: string): Promise<ClientContract[]> {
  let q = ap().from('client_contracts').select('*').order('effective_from', { ascending: false });
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ClientContract[];
}

export async function fetchPrefactures(clientId?: string): Promise<PrefactureWithClient[]> {
  let q = ap()
    .from('prefactures')
    .select('*, client:clients(id, name, pays, effectif)')
    .order('period_start', { ascending: false });
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PrefactureWithClient[];
}

export async function fetchPrefacture(id: string): Promise<PrefactureWithClient | null> {
  const { data } = await ap()
    .from('prefactures')
    .select('*, client:clients(id, name, pays, effectif)')
    .eq('id', id)
    .maybeSingle();
  return (data as PrefactureWithClient) ?? null;
}

export async function fetchPrefactureLines(prefactureId: string): Promise<PrefactureLine[]> {
  const { data, error } = await ap()
    .from('prefacture_lines').select('*')
    .eq('prefacture_id', prefactureId)
    .order('position');
  if (error) throw error;
  return (data ?? []) as PrefactureLine[];
}

export async function fetchPortals(clientId?: string): Promise<ClientPortal[]> {
  let q = ap().from('client_portals').select('*').order('created_at', { ascending: false });
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ClientPortal[];
}

export async function fetchPortalAccess(portalId: string): Promise<PortalAccess[]> {
  const { data } = await ap()
    .from('client_portal_access').select('*')
    .eq('portal_id', portalId)
    .order('occurred_at', { ascending: false })
    .limit(20);
  return (data ?? []) as PortalAccess[];
}

export async function fetchRapportCabinet(): Promise<RapportCabinetRow[]> {
  const { data, error } = await ap()
    .from('rapport_cabinet_view').select('*').order('client_name');
  if (error) throw error;
  return (data ?? []) as RapportCabinetRow[];
}

// ── Écritures ─────────────────────────────────────────────────────────

/** Génère la préfacture d'une période depuis les conditions du mandat. */
export async function generatePrefacture(clientId: string, periodStart: string): Promise<string> {
  const { data, error } = await ap().rpc('generate_prefacture', {
    p_client_id: clientId,
    p_period_start: periodStart,
  });
  if (error) throw new Error(humanizeCabinetError(error.message));
  return data as string;
}

export async function setPrefactureStatus(
  id: string,
  status: PrefactureStatus,
  paymentReference?: string,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'payee' && paymentReference) patch.payment_reference = paymentReference;
  const { error } = await ap().from('prefactures').update(patch).eq('id', id);
  if (error) throw new Error(humanizeCabinetError(error.message));
}

export async function setPortalStatus(id: string, status: PortalStatus): Promise<void> {
  const { error } = await ap().from('client_portals').update({ status }).eq('id', id);
  if (error) throw new Error(humanizeCabinetError(error.message));
}

export async function createPortal(input: {
  client_id: string; contact_name: string; contact_email: string;
}): Promise<void> {
  const tenantId = await currentTenantId();
  const { error } = await ap().from('client_portals').insert({ ...input, tenant_id: tenantId });
  if (error) throw new Error(humanizeCabinetError(error.message));
}

export async function createClient(input: {
  name: string; pays: string; effectif: number; contact?: string; email?: string;
  secteur?: string; ville?: string; modules?: string[];
}): Promise<string> {
  const tenantId = await currentTenantId();
  const { data, error } = await ap()
    .from('clients')
    .insert({ ...input, tenant_id: tenantId, depuis: String(new Date().getFullYear()) })
    .select('id')
    .single();
  if (error) throw new Error(humanizeCabinetError(error.message));
  return data.id as string;
}

export async function saveContract(
  input: Partial<ClientContract> & { client_id: string; reference: string; mandant_raison_sociale: string },
): Promise<void> {
  const tenantId = await currentTenantId();
  const { id, ...rest } = input;
  const { error } = id
    ? await ap().from('client_contracts').update(rest).eq('id', id)
    : await ap().from('client_contracts').insert({ ...rest, tenant_id: tenantId });
  if (error) throw new Error(humanizeCabinetError(error.message));
}

/** Tenant actif — les insertions doivent le porter explicitement. */
async function currentTenantId(): Promise<string> {
  const { data } = await ap().rpc('current_tenant_ids');
  const id = Array.isArray(data) ? data[0] : data;
  if (!id) throw new Error("Workspace non résolu — reconnectez-vous.");
  return id as string;
}

/** Traduit les exceptions du moteur en messages lisibles. */
export function humanizeCabinetError(message: string): string {
  if (message.includes('MANDAT_ABSENT')) {
    return "Ce client n'a aucun mandat actif : renseignez d'abord le contrat et ses conditions.";
  }
  if (message.includes('PERIODE_DEJA_FACTUREE')) {
    return 'Une préfacture existe déjà pour ce client sur cette période.';
  }
  if (message.includes('TRANSITION_INVALIDE')) {
    return "Cette étape n'est pas possible depuis l'état actuel.";
  }
  if (message.includes('PREFACTURE_PAYEE')) return 'Une préfacture encaissée ne peut plus être modifiée.';
  if (message.includes('PREFACTURE_ANNULEE')) return 'Une préfacture annulée ne peut plus être modifiée.';
  if (message.includes('CLIENT_INTROUVABLE')) return 'Client introuvable dans ce workspace.';
  return message;
}

// ── Formatage ─────────────────────────────────────────────────────────

export function formatAmount(amount: number, currency = 'XOF'): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}`;
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}
