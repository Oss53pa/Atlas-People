/**
 * M4 Admin RH — couche live Supabase.
 * Tables : m4_contracts, m4_departures, m4_disciplinary_cases
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, SupabaseWriteError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };

// DB enum uses CDD_CHANT; UI code uses CDD_CHANTIER
function toDbContractType(uiCode: string): string {
  return uiCode === 'CDD_CHANTIER' ? 'CDD_CHANT' : uiCode;
}

const DEMO = '11111111-1111-1111-1111-111111111111';

export interface M4ContractRow {
  id: string;
  tenant_id: string;
  employee_id: string;
  ref: string | null;
  type: string;
  fonction: string | null;
  service: string | null;
  classification: string | null;
  workplace: string | null;
  status?: string;
  // jointure employee
  employee_first_name?: string;
  employee_last_name?: string;
}

export interface M4DepartureRow {
  id: string;
  tenant_id: string;
  employee_id: string;
  ref: string | null;
  type: string | null;            // enum m4_departure_type (DEMISSION, LICEN_*, FIN_CDD…)
  initiative: string | null;      // salarie | employeur | mutuelle | force_majeure
  notified_at: string | null;
  notice_end: string | null;
  end_date: string | null;
  reason: string | null;
  status: string | null;          // draft | in_progress | closed | cancelled
  employee_first_name?: string;
  employee_last_name?: string;
}

export interface M4DisciplinaryRow {
  id: string;
  tenant_id: string;
  employee_id: string;
  case_number: string | null;
  opened_at: string | null;
  facts_date: string | null;
  facts_description: string | null;
  envisaged_sanction: string | null;
  final_sanction: string | null;
  status: string | null;          // enum m4_discipline_status (opened, under_investigation, …, closed)
  employee_first_name?: string;
  employee_last_name?: string;
}

export interface M4LiveKpis {
  contractsTotal: number;
  contractsExpiringSoon: number;
  departuresPending: number;
  disciplinaryCasesOpen: number;
  fetchedAt: string;
}

export async function fetchM4Live(tenantId = DEMO): Promise<M4LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  const sb = supabase.schema('atlas_people');
  const [ctrRes, depRes, discRes] = await Promise.all([
    sb.from('m4_contracts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    sb.from('m4_departures').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'in_progress'),
    // « ouvert » = tout sauf clos/annulé (l'enum m4_discipline_status n'a pas de valeur 'open')
    sb.from('m4_disciplinary_cases').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).neq('status', 'closed').neq('status', 'cancelled'),
  ]);
  return {
    contractsTotal: ctrRes.count ?? 0,
    contractsExpiringSoon: 0, // à implémenter avec deadline_date
    departuresPending: depRes.count ?? 0,
    disciplinaryCasesOpen: discRes.count ?? 0,
    fetchedAt: new Date().toISOString(),
  };
}

export function useM4Live(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m4-live', tenantId],
    queryFn: () => fetchM4Live(tenantId),
    enabled: isBackendConfigured,
    staleTime: 120_000,
  });
}

export function useM4Contracts(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m4-contracts', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('m4_contracts')
        .select(`id, tenant_id, employee_id, ref, type, fonction, service, classification, workplace, status,
          employees!employee_id(first_name, last_name)`)
        .eq('tenant_id', tenantId)
        .order('ref', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((c: Record<string, unknown>) => {
        const emp = c['employees'] as Record<string, string> | null;
        return { ...c, employee_first_name: emp?.first_name, employee_last_name: emp?.last_name } as M4ContractRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export function useM4Departures(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m4-departures', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('m4_departures')
        .select(`id, tenant_id, employee_id, ref, type, initiative, notified_at, notice_end, end_date, reason, status,
          employees!employee_id(first_name, last_name)`)
        .eq('tenant_id', tenantId)
        .order('notified_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((d: Record<string, unknown>) => {
        const emp = d['employees'] as Record<string, string> | null;
        return { ...d, employee_first_name: emp?.first_name, employee_last_name: emp?.last_name } as M4DepartureRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export function useM4Disciplinary(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m4-disciplinary', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('m4_disciplinary_cases')
        .select(`id, tenant_id, employee_id, case_number, opened_at, facts_date, facts_description, envisaged_sanction, final_sanction, status,
          employees!employee_id(first_name, last_name)`)
        .eq('tenant_id', tenantId)
        .order('opened_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((d: Record<string, unknown>) => {
        const emp = d['employees'] as Record<string, string> | null;
        return { ...d, employee_first_name: emp?.first_name, employee_last_name: emp?.last_name } as M4DisciplinaryRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      type,
      effectiveDate,
    }: {
      employeeId: string;
      type: string;
      effectiveDate?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const ref = `CTR-${new Date().toISOString().slice(2, 7).replace('-', '')}-${id.slice(0, 8).toUpperCase()}`;
      const { error } = await sb.schema('atlas_people').from('m4_contracts').insert({
        id,
        tenant_id: ctx.tenantId,
        employee_id: employeeId,
        ref,
        type: toDbContractType(type),
        status: 'draft',
        initiated_by: ctx.userId,
        effective_date: effectiveDate ?? null,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'contract.create',
        entity: 'm4_contracts', entityId: id,
        payload: { type: toDbContractType(type), ref, effectiveDate: effectiveDate ?? null },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-contracts'] });
      qc.invalidateQueries({ queryKey: ['m4-live'] });
    },
  });
}

export function useCreateDisciplinaryCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      factsDate,
      factsDescription,
    }: {
      employeeId: string;
      factsDate: string;
      factsDescription: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const today = new Date().toISOString().slice(0, 10);
      const caseNumber = `DISC-${new Date().getFullYear()}-${id.slice(0, 6).toUpperCase()}`;
      // R6 : délai de prescription = 2 mois après les faits
      const fd = new Date(factsDate);
      fd.setMonth(fd.getMonth() + 2);
      const prescriptionDeadline = fd.toISOString().slice(0, 10);
      const { error } = await sb.schema('atlas_people').from('m4_disciplinary_cases').insert({
        id,
        tenant_id: ctx.tenantId,
        employee_id: employeeId,
        case_number: caseNumber,
        opened_at: today,
        opened_by: ctx.userId,
        facts_date: factsDate,
        facts_description: factsDescription,
        prescription_deadline: prescriptionDeadline,
        status: 'opened',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'disciplinary.create',
        entity: 'm4_disciplinary_cases', entityId: id,
        payload: { caseNumber, employeeId, factsDate },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-disciplinary'] });
      qc.invalidateQueries({ queryKey: ['m4-live'] });
    },
  });
}

/** Enregistre la décision finale de période d'essai via Edge Function. */
export function useEvaluateProbation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      probationId,
      decision,
      rationale,
    }: {
      probationId: string;
      decision: 'confirmed' | 'extended' | 'terminated';
      rationale?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      await resolveSessionContext();
      const idempotencyKey = crypto.randomUUID();
      const { data, error } = await sb.functions.invoke('evaluate-probation-decision', {
        body: { probationId, decision, rationale, idempotencyKey },
      });
      if (error) throw new SupabaseWriteError(error.message, 'EDGE_FUNCTION_ERROR');
      const res = data as { error?: { message?: string; code?: string } } | null;
      if (res?.error) throw new SupabaseWriteError(res.error.message ?? res.error.code ?? 'Erreur EF', res.error.code);
      return data as { probationId: string; decision: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-admin2-raw'] });
      qc.invalidateQueries({ queryKey: ['m4-live'] });
    },
  });
}

/** Crée un dossier de départ dans m4_departures. */
export function useCreateDeparture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      type,
      initiative,
      reason,
      notifiedAt,
    }: {
      employeeId: string;
      type: string;
      initiative?: string;
      reason?: string;
      notifiedAt?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const today = new Date().toISOString().slice(0, 10);
      const ref = `DEP-${new Date().toISOString().slice(2, 7).replace('-', '')}-${id.slice(0, 8).toUpperCase()}`;
      const { error } = await sb.schema('atlas_people').from('m4_departures').insert({
        id,
        tenant_id: ctx.tenantId,
        employee_id: employeeId,
        ref,
        type,
        initiative: initiative ?? null,
        reason: reason ?? null,
        notified_at: notifiedAt ?? today,
        status: 'draft',
        initiated_by: ctx.userId,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'departure.create',
        entity: 'm4_departures', entityId: id,
        payload: { type, ref, employeeId },
        surface: 'backoffice',
      });
      return { id, ref };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-departures'] });
      qc.invalidateQueries({ queryKey: ['m4-live'] });
    },
  });
}

/** Crée un avenant dans m4_contract_amendments. */
export function useCreateAmendment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      categoryCode,
      typeLabel,
      objet,
      effectiveDate,
      payrollDeltaCents,
    }: {
      employeeId: string;
      categoryCode: string;
      typeLabel: string;
      objet?: string;
      effectiveDate?: string;
      payrollDeltaCents?: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const ref = `AVN-${new Date().toISOString().slice(2, 7).replace('-', '')}-${id.slice(0, 8).toUpperCase()}`;
      const { error } = await sb.schema('atlas_people').from('m4_contract_amendments').insert({
        id,
        tenant_id: ctx.tenantId,
        employee_id: employeeId,
        ref,
        category_code: categoryCode,
        type_label: typeLabel,
        objet: objet ?? null,
        effective_date: effectiveDate ?? null,
        payroll_delta: payrollDeltaCents ?? null,
        status: 'draft',
        initiated_by: ctx.userId,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'amendment.create',
        entity: 'm4_contract_amendments', entityId: id,
        payload: { categoryCode, typeLabel, ref, employeeId },
        surface: 'backoffice',
      });
      return { id, ref };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-admin2-raw'] });
    },
  });
}

/** Crée un dossier expatrié dans m4_expat_files. */
export function useCreateExpatFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      category,
      originCountry,
      hostCountry,
      missionType,
      missionStart,
      missionEnd,
    }: {
      employeeId: string;
      category: string;
      originCountry: string;
      hostCountry: string;
      missionType: string;
      missionStart: string;
      missionEnd?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('m4_expat_files').insert({
        id,
        tenant_id: ctx.tenantId,
        employee_id: employeeId,
        category,
        origin_country: originCountry,
        host_country: hostCountry,
        mission_type: missionType,
        mission_start: missionStart,
        mission_end: missionEnd ?? null,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'expat.create',
        entity: 'm4_expat_files', entityId: id,
        payload: { employeeId, category, originCountry, hostCountry, missionType },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-admin2-raw'] });
    },
  });
}

/** Déclare une DPAE (Déclaration Préalable À l'Embauche) dans m4_legal_dpae. */
export function useFileDpae() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      countryCode,
      hireDate,
      organisme,
    }: {
      employeeId: string;
      countryCode: string;
      hireDate: string;
      organisme?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('m4_legal_dpae').insert({
        id,
        tenant_id: ctx.tenantId,
        employee_id: employeeId,
        country_code: countryCode,
        organisme: organisme ?? 'CNPS',
        hire_date: hireDate,
        status: 'to_submit',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'dpae.create',
        entity: 'm4_legal_dpae', entityId: id,
        payload: { employeeId, countryCode, hireDate, organisme: organisme ?? 'CNPS' },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-admin2-raw'] });
    },
  });
}

/** Crée une période d'essai dans m4_probation_periods. */
export function useCreateProbationPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      contractType,
      category,
      durationMonths,
      startDate,
    }: {
      employeeId: string;
      contractType: string;
      category?: string;
      durationMonths: number;
      startDate: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const endDate = (() => {
        const dt = new Date(startDate);
        dt.setMonth(dt.getMonth() + durationMonths);
        return dt.toISOString().slice(0, 10);
      })();
      const { error } = await sb.schema('atlas_people').from('m4_probation_periods').insert({
        id,
        tenant_id: ctx.tenantId,
        employee_id: employeeId,
        contract_type: contractType,
        category: category ?? null,
        duration_months: durationMonths,
        start_date: startDate,
        end_date: endDate,
        decision: 'pending',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'probation.create',
        entity: 'm4_probation_periods', entityId: id,
        payload: { employeeId, contractType, durationMonths, startDate, endDate },
        surface: 'backoffice',
      });
      return { id, endDate };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-admin2-raw'] });
      qc.invalidateQueries({ queryKey: ['m4-live'] });
    },
  });
}

/** Crée un mandat de représentation du personnel dans m4_representation_mandates. */
export function useCreateRepresentationMandate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      type,
      mode,
      startDate,
      endDate,
      delegationHours,
    }: {
      employeeId: string;
      type: string;
      mode: 'elu' | 'designe';
      startDate: string;
      endDate?: string;
      delegationHours?: number;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('m4_representation_mandates').insert({
        id,
        tenant_id: ctx.tenantId,
        employee_id: employeeId,
        type,
        mode,
        start_date: startDate,
        end_date: endDate ?? null,
        delegation_hours: delegationHours ?? null,
        protected_until: endDate ?? null,
        status: 'active',
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'mandate.create',
        entity: 'm4_representation_mandates', entityId: id,
        payload: { employeeId, type, mode, startDate },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-admin2-raw'] });
    },
  });
}

/** Génère un document RH officiel via Edge Function generate-hr-document. */
export function useGenerateHrDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      docType,
      employeeId,
      purpose,
    }: {
      docType: string;
      employeeId: string;
      purpose?: string;
    }) => {
      const sb = getSupabaseOrThrow();
      await resolveSessionContext();
      const idempotencyKey = crypto.randomUUID();
      const { data, error } = await sb.functions.invoke('generate-hr-document', {
        body: { docType, employeeId, idempotencyKey, purpose },
      });
      if (error) throw new SupabaseWriteError(error.message, 'EDGE_FUNCTION_ERROR');
      const res = data as { error?: { message?: string; code?: string } } | null;
      if (res?.error) throw new SupabaseWriteError(res.error.message ?? res.error.code ?? 'Erreur EF', res.error.code);
      return data as { docId: string; docType: string; employeeId: string; generatedAt: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m4-admin2-raw'] });
    },
  });
}
