/**
 * Portail collaborateur — couche live Supabase (CDC §3.2 / §3.4).
 *
 * Lectures : React Query sur `atlas_people`, bornées tenant + employee, actives
 * seulement si `isBackendConfigured`. Écritures : résolution d'identité via
 * `resolveSessionContext()` (jamais de DEMO_*), garde `NoRowsAffectedError`,
 * audit chaîné SHA-256 (`appendAuditEntry`, surface 'ess').
 *
 * Toutes les surfaces du portail (courrier, consentements, notifications, santé,
 * profil, frais, objectifs) lisent d'ici, avec repli mock/store côté page.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import {
  resolveSessionContext,
  getSupabaseOrThrow,
  NoRowsAffectedError,
  mapSupabaseError,
} from '../session';
import { appendAuditEntry } from '../auditLog';

export { isBackendConfigured };

const ap = () => getSupabaseOrThrow().schema('atlas_people');
const enabled = (employeeId?: string) => isBackendConfigured && Boolean(employeeId);

// ── S9 Mon courrier ────────────────────────────────────────────────────

export interface CorrespondenceRow {
  id: string;
  correspondence_type: string;
  subject: string;
  body: string | null;
  sender_type: string;
  status: string;
  delivered_at: string;
  first_read_at: string | null;
  requires_signature: boolean;
  signature_deadline: string | null;
  signed_at: string | null;
  requires_acknowledgment: boolean;
  acknowledged_at: string | null;
  requires_attendance_confirmation: boolean;
  attendance_confirmed_at: string | null;
  confidentiality_level: string;
  archived_at: string | null;
}

const CORR_COLS =
  'id,correspondence_type,subject,body,sender_type,status,delivered_at,first_read_at,' +
  'requires_signature,signature_deadline,signed_at,requires_acknowledgment,acknowledged_at,' +
  'requires_attendance_confirmation,attendance_confirmed_at,confidentiality_level,archived_at';

export function useMyCorrespondence(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-correspondence', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('official_correspondence')
        .select(CORR_COLS)
        .eq('tenant_id', tenantId)
        .eq('recipient_employee_id', employeeId)
        .order('delivered_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CorrespondenceRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 30_000,
  });
}

/** Enregistre une action de courrier (statut + correspondence_actions + audit). */
function useCorrespondenceAction(
  action: 'read' | 'acknowledged' | 'signed' | 'archived',
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (corrId: string) => {
      const ctx = await resolveSessionContext();
      const nowIso = new Date().toISOString();
      const patch: Record<string, unknown> =
        action === 'read'
          ? { status: 'read', first_read_at: nowIso }
          : action === 'acknowledged'
            ? { status: 'acknowledged', acknowledged_at: nowIso, last_action_at: nowIso }
            : action === 'signed'
              ? { status: 'signed', signed_at: nowIso, last_action_at: nowIso }
              : { status: 'archived', archived_at: nowIso, last_action_at: nowIso };

      const { data, error } = await ap()
        .from('official_correspondence')
        .update(patch)
        .eq('tenant_id', ctx.tenantId)
        .eq('recipient_employee_id', ctx.employeeId)
        .eq('id', corrId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('correspondence.' + action);

      // Trace d'action + audit chaîné pour les actions à valeur juridique.
      if (action !== 'read') {
        await ap().from('correspondence_actions').insert({
          tenant_id: ctx.tenantId,
          correspondence_id: corrId,
          action_type: action === 'acknowledged' ? 'acknowledged' : action === 'signed' ? 'signed' : 'archived',
          action_payload: { at: nowIso },
          acted_at: nowIso,
        });
        await appendAuditEntry({
          tenantId: ctx.tenantId,
          actorId: ctx.userId,
          action: `correspondence.${action}`,
          entity: 'official_correspondence',
          entityId: corrId,
          payload: { action },
          surface: 'ess',
        });
      } else {
        // Log de lecture (chaîne de preuve C.2).
        await ap().from('correspondence_read_log').insert({
          tenant_id: ctx.tenantId,
          correspondence_id: corrId,
          read_at: nowIso,
        });
      }
      return corrId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-correspondence'] });
    },
  });
}

export const useMarkCorrespondenceRead = () => useCorrespondenceAction('read');
export const useAcknowledgeCorrespondence = () => useCorrespondenceAction('acknowledged');
export const useSignCorrespondence = () => useCorrespondenceAction('signed');
export const useArchiveCorrespondence = () => useCorrespondenceAction('archived');

// ── Paramètres — consentements ─────────────────────────────────────────

export interface ConsentRow {
  consent_code: string;
  granted: boolean;
  granted_at: string | null;
  withdrawn_at: string | null;
}

export function useMyConsents(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-consents', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('employee_consents')
        .select('consent_code,granted,granted_at,withdrawn_at')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .order('consent_code');
      if (error) throw error;
      return (data ?? []) as ConsentRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 60_000,
  });
}

/** Bascule un consentement : update + trace consent_history + audit. */
export function useToggleConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { code: string; granted: boolean }) => {
      const ctx = await resolveSessionContext();
      const nowIso = new Date().toISOString();
      const { data, error } = await ap()
        .from('employee_consents')
        .update({
          granted: vars.granted,
          granted_at: vars.granted ? nowIso : null,
          withdrawn_at: vars.granted ? null : nowIso,
        })
        .eq('tenant_id', ctx.tenantId)
        .eq('employee_id', ctx.employeeId)
        .eq('consent_code', vars.code)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('consent.toggle');

      await ap().from('consent_history').insert({
        tenant_id: ctx.tenantId,
        employee_id: ctx.employeeId,
        consent_code: vars.code,
        previous_state: !vars.granted,
        new_state: vars.granted,
        changed_at: nowIso,
        changed_by: ctx.userId,
      });
      await appendAuditEntry({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: vars.granted ? 'consent.granted' : 'consent.revoked',
        entity: 'employee_consents',
        entityId: vars.code,
        payload: { code: vars.code, granted: vars.granted },
        surface: 'ess',
      });
      return vars;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-consents'] });
    },
  });
}

export interface NotifPrefRow {
  notification_type: string;
  channel: string;
  enabled: boolean;
  is_mandatory: boolean;
}

export function useMyNotificationPrefs(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-notif-prefs', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('notification_preferences')
        .select('notification_type,channel,enabled,is_mandatory')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId);
      if (error) throw error;
      return (data ?? []) as NotifPrefRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 60_000,
  });
}

// ── S10 Mon suivi santé ────────────────────────────────────────────────

export interface MedicalVisitRow {
  id: string;
  visit_type: string;
  scheduled_date: string;
  effective_date: string | null;
  status: string;
  doctor_conclusion: string | null;
  next_obligatory_visit: string | null;
}
export interface VaccinationRow {
  id: string;
  vaccination_id: string;
  last_dose_date: string;
  status: string;
  next_recall_date: string | null;
  obligatory_for_position: boolean;
  label?: string;
}
export interface MedicalFollowupData {
  service: string | null;
  assignedAt: string | null;
  visits: MedicalVisitRow[];
  vaccinations: VaccinationRow[];
}

export function useMyMedical(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-medical', tenantId, employeeId],
    queryFn: async (): Promise<MedicalFollowupData> => {
      if (!supabase || !employeeId) return { service: null, assignedAt: null, visits: [], vaccinations: [] };
      const sb = supabase.schema('atlas_people');
      const [followup, visits, vaccs, catalog] = await Promise.all([
        sb.from('employee_medical_followup').select('occupational_health_service,assigned_at').eq('tenant_id', tenantId).eq('employee_id', employeeId).maybeSingle(),
        sb.from('medical_visits').select('id,visit_type,scheduled_date,effective_date,status,doctor_conclusion,next_obligatory_visit').eq('tenant_id', tenantId).eq('employee_id', employeeId).order('scheduled_date', { ascending: false }),
        sb.from('employee_vaccinations').select('id,vaccination_id,last_dose_date,status,next_recall_date,obligatory_for_position').eq('tenant_id', tenantId).eq('employee_id', employeeId),
        sb.from('vaccination_catalog').select('id,label'),
      ]);
      if (visits.error) throw visits.error;
      const labels = new Map<string, string>(((catalog.data ?? []) as { id: string; label: string }[]).map((c) => [c.id, c.label]));
      return {
        service: (followup.data as { occupational_health_service?: string } | null)?.occupational_health_service ?? null,
        assignedAt: (followup.data as { assigned_at?: string } | null)?.assigned_at ?? null,
        visits: (visits.data ?? []) as MedicalVisitRow[],
        vaccinations: ((vaccs.data ?? []) as VaccinationRow[]).map((v) => ({ ...v, label: labels.get(v.vaccination_id) })),
      };
    },
    enabled: enabled(employeeId),
    staleTime: 60_000,
  });
}

// ── S2 Mon profil ──────────────────────────────────────────────────────

export interface ProfileData {
  family: { id: string; member_type: string; last_name: string; first_names: string; current_status: string; fiscal_dependent: boolean; health_insurance_beneficiary: boolean }[];
  addresses: { id: string; address_type: string; is_primary: boolean; line_1: string; local_references: string | null; neighborhood: string | null; city: string; country_code: string }[];
  phones: { id: string; phone_type: string; number: string; operator: string | null; has_whatsapp: boolean | null; is_primary: boolean; visibility: string }[];
  emails: { id: string; email_type: string; address: string; is_primary: boolean }[];
  bankAccounts: { id: string; bank_name: string; iban: string; account_holder_name: string; currency: string; is_primary: boolean; status: string }[];
  mobileMoney: { id: string; operator: string; phone_number: string; account_holder_name: string; is_primary: boolean; status: string }[];
  paymentMethod: { primary_mode: string; has_split: boolean } | null;
}

export function useMyProfile(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-profile', tenantId, employeeId],
    queryFn: async (): Promise<ProfileData> => {
      const empty: ProfileData = { family: [], addresses: [], phones: [], emails: [], bankAccounts: [], mobileMoney: [], paymentMethod: null };
      if (!supabase || !employeeId) return empty;
      const sb = supabase.schema('atlas_people');
      const tid = tenantId as string;
      const eid = employeeId;
      const [fam, addr, ph, em, bank, mm, pm] = await Promise.all([
        sb.from('family_members').select('id,member_type,last_name,first_names,current_status,fiscal_dependent,health_insurance_beneficiary').eq('tenant_id', tid).eq('employee_id', eid),
        sb.from('employee_addresses').select('id,address_type,is_primary,line_1,local_references,neighborhood,city,country_code').eq('tenant_id', tid).eq('employee_id', eid),
        sb.from('employee_phones').select('id,phone_type,number,operator,has_whatsapp,is_primary,visibility').eq('tenant_id', tid).eq('employee_id', eid),
        sb.from('employee_emails').select('id,email_type,address,is_primary').eq('tenant_id', tid).eq('employee_id', eid),
        sb.from('bank_accounts').select('id,bank_name,iban,account_holder_name,currency,is_primary,status').eq('tenant_id', tid).eq('employee_id', eid),
        sb.from('mobile_money_accounts').select('id,operator,phone_number,account_holder_name,is_primary,status').eq('tenant_id', tid).eq('employee_id', eid),
        sb.from('employee_payment_methods').select('primary_mode,has_split').eq('tenant_id', tid).eq('employee_id', eid),
      ]);
      return {
        family: (fam.data ?? []) as ProfileData['family'],
        addresses: (addr.data ?? []) as ProfileData['addresses'],
        phones: (ph.data ?? []) as ProfileData['phones'],
        emails: (em.data ?? []) as ProfileData['emails'],
        bankAccounts: (bank.data ?? []) as ProfileData['bankAccounts'],
        mobileMoney: (mm.data ?? []) as ProfileData['mobileMoney'],
        paymentMethod: ((pm.data ?? [])[0] as ProfileData['paymentMethod']) ?? null,
      };
    },
    enabled: enabled(employeeId),
    staleTime: 60_000,
  });
}

// ── S2 Profil — écritures directes (coordonnées) ───────────────────────
// La charte portail autorise l'édition DIRECTE des coordonnées (adresses,
// téléphones) ; les champs sensibles (versement, identité) passent par
// « demande ». Chaque écriture : identité de session, audit chaîné 'ess',
// garde NoRowsAffectedError sur update/delete.

export interface AddressInput {
  id?: string;
  address_type: string;
  line_1: string;
  city: string;
  country_code: string;
  neighborhood?: string | null;
  local_references?: string | null;
  is_primary?: boolean;
}

export function useUpsertAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: AddressInput) => {
      const ctx = await resolveSessionContext();
      const cols = {
        address_type: v.address_type,
        line_1: v.line_1,
        city: v.city,
        country_code: v.country_code,
        neighborhood: v.neighborhood ?? null,
        local_references: v.local_references ?? null,
        is_primary: v.is_primary ?? false,
      };
      let entityId: string;
      if (v.id) {
        const { data, error } = await ap().from('employee_addresses')
          .update({ ...cols, updated_at: new Date().toISOString() })
          .eq('tenant_id', ctx.tenantId).eq('employee_id', ctx.employeeId).eq('id', v.id)
          .select('id');
        if (error) throw mapSupabaseError(error);
        if (!data || data.length === 0) throw new NoRowsAffectedError('address.update');
        entityId = v.id;
      } else {
        const { data, error } = await ap().from('employee_addresses')
          .insert({ tenant_id: ctx.tenantId, employee_id: ctx.employeeId, ...cols, effective_from: new Date().toISOString().slice(0, 10) })
          .select('id').single();
        if (error) throw mapSupabaseError(error);
        entityId = data.id as string;
      }
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId,
        action: v.id ? 'profile.address_updated' : 'profile.address_added',
        entity: 'employee_addresses', entityId, payload: { city: v.city, type: v.address_type }, surface: 'ess',
      });
      return entityId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-profile'] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const ctx = await resolveSessionContext();
      const { data, error } = await ap().from('employee_addresses')
        .delete().eq('tenant_id', ctx.tenantId).eq('employee_id', ctx.employeeId).eq('id', id).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('address.delete');
      await appendAuditEntry({ tenantId: ctx.tenantId, actorId: ctx.userId, action: 'profile.address_deleted', entity: 'employee_addresses', entityId: id, payload: {}, surface: 'ess' });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-profile'] }),
  });
}

export interface PhoneInput {
  id?: string;
  phone_type: string;
  number: string;
  operator?: string | null;
  has_whatsapp?: boolean;
  is_primary?: boolean;
  visibility?: string;
}

export function useUpsertPhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: PhoneInput) => {
      const ctx = await resolveSessionContext();
      const cols = {
        phone_type: v.phone_type,
        number: v.number,
        operator: v.operator ?? null,
        has_whatsapp: v.has_whatsapp ?? false,
        is_primary: v.is_primary ?? false,
        visibility: v.visibility ?? 'manager_plus',
      };
      let entityId: string;
      if (v.id) {
        const { data, error } = await ap().from('employee_phones')
          .update(cols).eq('tenant_id', ctx.tenantId).eq('employee_id', ctx.employeeId).eq('id', v.id).select('id');
        if (error) throw mapSupabaseError(error);
        if (!data || data.length === 0) throw new NoRowsAffectedError('phone.update');
        entityId = v.id;
      } else {
        const { data, error } = await ap().from('employee_phones')
          .insert({ tenant_id: ctx.tenantId, employee_id: ctx.employeeId, ...cols })
          .select('id').single();
        if (error) throw mapSupabaseError(error);
        entityId = data.id as string;
      }
      await appendAuditEntry({ tenantId: ctx.tenantId, actorId: ctx.userId, action: v.id ? 'profile.phone_updated' : 'profile.phone_added', entity: 'employee_phones', entityId, payload: { type: v.phone_type }, surface: 'ess' });
      return entityId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-profile'] }),
  });
}

export function useDeletePhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const ctx = await resolveSessionContext();
      const { data, error } = await ap().from('employee_phones')
        .delete().eq('tenant_id', ctx.tenantId).eq('employee_id', ctx.employeeId).eq('id', id).select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('phone.delete');
      await appendAuditEntry({ tenantId: ctx.tenantId, actorId: ctx.userId, action: 'profile.phone_deleted', entity: 'employee_phones', entityId: id, payload: {}, surface: 'ess' });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-profile'] }),
  });
}

// ── S7 Mes frais ───────────────────────────────────────────────────────

export interface ExpenseClaimRow {
  id: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  receipt_url: string | null;
  created_at: string;
}

export function useMyExpenseClaims(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-expenses', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('expense_claims')
        .select('id,amount,currency,category,status,receipt_url,created_at')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExpenseClaimRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 30_000,
  });
}

/** Soumet une note de frais (bigint XOF), audit chaîné. */
export function useSubmitExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { amount: number; category: string; currency?: string; receiptUrl?: string }) => {
      const ctx = await resolveSessionContext();
      const { data, error } = await ap()
        .from('expense_claims')
        .insert({
          tenant_id: ctx.tenantId,
          employee_id: ctx.employeeId,
          amount: Math.round(vars.amount),
          currency: vars.currency ?? 'XOF',
          category: vars.category,
          status: 'submitted',
          receipt_url: vars.receiptUrl ?? null,
        })
        .select('id')
        .single();
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: 'expense.create',
        entity: 'expense_claims',
        entityId: data.id as string,
        payload: { category: vars.category },
        surface: 'ess',
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-expenses'] });
    },
  });
}

// ── S5 Ma performance — objectifs ──────────────────────────────────────

export interface ObjectiveRow {
  id: string;
  title: string;
  progress: number;
  due_date: string | null;
}

export function useMyObjectives(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-objectives', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('objectives')
        .select('id,title,progress,due_date')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ObjectiveRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 60_000,
  });
}

// ── S4 Mon temps ───────────────────────────────────────────────────────

export interface LeaveBalanceRow {
  counter_type: string;
  reference_period: string;
  acquired: number;
  taken: number;
  pending: number;
  available: number;
  carried_over: number;
  expiry_date: string | null;
}

export function useMyLeaveBalances(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-leave-balances', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('employee_leave_balances')
        .select('counter_type,reference_period,acquired,taken,pending,available,carried_over,expiry_date')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId);
      if (error) throw error;
      return (data ?? []) as LeaveBalanceRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 60_000,
  });
}

export interface ClockingRow {
  id: string;
  clocking_type: string;
  clocked_at: string;
  method: string;
  source: string;
  verification_status: string;
}

export function useMyClockings(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-clockings', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('time_clockings')
        .select('id,clocking_type,clocked_at,method,source,verification_status')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .order('clocked_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as ClockingRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 20_000,
  });
}

export interface OvertimeRow {
  id: string;
  work_date: string;
  hours: number;
  rate_pct: number;
  category: string;
  status: string;
}

export function useMyOvertime(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-overtime', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('overtime_records')
        .select('id,work_date,hours,rate_pct,category,status')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .order('work_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OvertimeRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 30_000,
  });
}

export interface PlanningRow {
  id: string;
  work_date: string;
  status: string;
}

export function useMyPlanning(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-planning', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('schedule_assignments')
        .select('id,work_date,status')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .order('work_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PlanningRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 30_000,
  });
}

// ── S6 Mon développement ───────────────────────────────────────────────

export interface SkillRow {
  id: string;
  skill_id: string;
  level: number;
  evidence: string | null;
  name?: string;
  domain?: string;
}

export function useMySkills(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-skills', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('employee_skills')
        .select('id,skill_id,level,evidence,skills!skill_id(name,domain)')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const sk = r['skills'] as { name?: string; domain?: string } | null;
        return {
          id: r['id'] as string,
          skill_id: r['skill_id'] as string,
          level: r['level'] as number,
          evidence: (r['evidence'] as string | null) ?? null,
          name: sk?.name,
          domain: sk?.domain,
        } as SkillRow;
      });
    },
    enabled: enabled(employeeId),
    staleTime: 60_000,
  });
}

export interface ExternalTrainingRow {
  id: string;
  training_title: string;
  training_organization: string;
  training_type: string | null;
  start_date: string | null;
  end_date: string | null;
  domain: string | null;
  obtained_certification: boolean | null;
}

export function useMyExternalTrainings(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-ext-trainings', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase || !employeeId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('employee_external_trainings')
        .select('id,training_title,training_organization,training_type,start_date,end_date,domain,obtained_certification')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExternalTrainingRow[];
    },
    enabled: enabled(employeeId),
    staleTime: 60_000,
  });
}

// ── S11 Mon onboarding ─────────────────────────────────────────────────

export interface OnboardingTaskRow {
  id: string;
  jalon_kind: string | null;
  owner: string;
  title: string;
  status: string;
  due_date: string | null;
  required: boolean;
}
export interface OnboardingJalonRow {
  id: string;
  kind: string;
  due_date: string;
  status: string;
  validated_at: string | null;
}
export interface OnboardingData {
  arrivant: {
    id: string;
    start_date: string;
    parcours_status: string;
    overall_completion_pct: number;
    fin_essai_at: string | null;
  } | null;
  tasks: OnboardingTaskRow[];
  jalons: OnboardingJalonRow[];
}

export function useMyOnboarding(tenantId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['portal-onboarding', tenantId, employeeId],
    queryFn: async (): Promise<OnboardingData> => {
      const empty: OnboardingData = { arrivant: null, tasks: [], jalons: [] };
      if (!supabase || !employeeId) return empty;
      const sb = supabase.schema('atlas_people');
      const { data: arr, error } = await sb
        .from('m6_arrivants')
        .select('id,start_date,parcours_status,overall_completion_pct,fin_essai_at')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .maybeSingle();
      if (error) throw error;
      if (!arr) return empty;
      const arrId = (arr as { id: string }).id;
      const [tasks, jalons] = await Promise.all([
        sb.from('m6_tasks').select('id,jalon_kind,owner,title,status,due_date,required').eq('tenant_id', tenantId).eq('arrivant_id', arrId).order('due_date', { ascending: true }),
        sb.from('m6_jalons').select('id,kind,due_date,status,validated_at').eq('tenant_id', tenantId).eq('arrivant_id', arrId).order('due_date', { ascending: true }),
      ]);
      return {
        arrivant: arr as OnboardingData['arrivant'],
        tasks: (tasks.data ?? []) as OnboardingTaskRow[],
        jalons: (jalons.data ?? []) as OnboardingJalonRow[],
      };
    },
    enabled: enabled(employeeId),
    staleTime: 30_000,
  });
}

/** L'employé marque une de ses tâches d'intégration comme faite. */
export function useCompleteOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const ctx = await resolveSessionContext();
      const nowIso = new Date().toISOString();
      const { data, error } = await ap()
        .from('m6_tasks')
        .update({ status: 'done', completed_at: nowIso, completed_by: ctx.employeeId })
        .eq('tenant_id', ctx.tenantId).eq('id', taskId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('onboarding_task.complete');
      await appendAuditEntry({ tenantId: ctx.tenantId, actorId: ctx.userId, action: 'onboarding.task_completed', entity: 'm6_tasks', entityId: taskId, payload: {}, surface: 'ess' });
      return taskId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-onboarding'] }),
  });
}
