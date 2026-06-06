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
  motif: string | null;
  type_sortie: string | null;
  date_notif: string | null;
  date_sortie: string | null;
  status: string | null;
  employee_first_name?: string;
  employee_last_name?: string;
}

export interface M4DisciplinaryRow {
  id: string;
  tenant_id: string;
  employee_id: string;
  type_sanction: string | null;
  motif: string | null;
  date_faits: string | null;
  status: string | null;
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
    sb.from('m4_disciplinary_cases').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'open'),
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
        .select(`id, tenant_id, employee_id, ref, type, fonction, service, classification, workplace,
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
        .select(`id, tenant_id, employee_id, motif, type_sortie, date_notif, date_sortie, status,
          employees!employee_id(first_name, last_name)`)
        .eq('tenant_id', tenantId)
        .order('date_notif', { ascending: false })
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
        .select(`id, tenant_id, employee_id, type_sanction, motif, date_faits, status,
          employees!employee_id(first_name, last_name)`)
        .eq('tenant_id', tenantId)
        .order('date_faits', { ascending: false })
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
