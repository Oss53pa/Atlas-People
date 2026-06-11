/**
 * M4 Admin RH — couche live Supabase.
 * Tables : m4_contracts, m4_departures, m4_disciplinary_cases
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
export { isBackendConfigured };

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
