/**
 * M3 Paie — couche live Supabase.
 * Tables : payroll_cycles, payroll_bulletins, employees
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';

// ── Types ─────────────────────────────────────────────────────────────

export interface PayrollCycleRow {
  id: string;
  period: string;
  label: string;
  country_code: string;
  cycle_type: string;
  status: string;
  current_phase: string | null;
  pay_date: string | null;
  headcount: number;
  seized_count: number;
  total_brut: number;
  total_net: number;
  total_cotisations: number;
  total_cout_employeur: number;
  opened_at: string | null;
}

export interface PayrollBulletinRow {
  id: string;
  cycle_id: string;
  employee_id: string;
  numero: string;
  currency: string;
  brut_total: number;
  net_a_payer: number;
  cout_employeur: number;
  total_cotisations_emp: number;
  total_retenues: number;
  status: string;
  calculated_at: string | null;
  diffused_at: string | null;
  // jointure employee
  employee_first_name?: string;
  employee_last_name?: string;
  employee_department?: string;
}

export interface M3LiveKpis {
  activeEmployees: number;
  totalBrut: number;
  totalNet: number;
  totalCharges: number;
  coutEmployeur: number;
  cyclesOpen: number;
  bulletinsCount: number;
  lastPeriod: string;
  fetchedAt: string;
}

// ── KPIs cockpit ──────────────────────────────────────────────────────

export async function fetchM3Live(tenantId = DEMO): Promise<M3LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  const sb = supabase.schema('atlas_people');
  const [empRes, cycleRes, bulletinRes] = await Promise.all([
    sb.from('employees').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
    sb.from('payroll_cycles').select('status,total_brut,total_net,total_cotisations,total_cout_employeur,period').eq('tenant_id', tenantId).order('period', { ascending: false }),
    sb.from('payroll_bulletins').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ]);
  if (empRes.error || cycleRes.error) return null;
  const cycles = (cycleRes.data ?? []) as PayrollCycleRow[];
  const lastCycle = cycles[0];
  const openCycles = cycles.filter((c) => !['closed','archived'].includes(c.status));
  return {
    activeEmployees: empRes.count ?? 0,
    totalBrut: lastCycle?.total_brut ?? 0,
    totalNet: lastCycle?.total_net ?? 0,
    totalCharges: lastCycle?.total_cotisations ?? 0,
    coutEmployeur: lastCycle?.total_cout_employeur ?? 0,
    cyclesOpen: openCycles.length,
    bulletinsCount: bulletinRes.count ?? 0,
    lastPeriod: lastCycle?.label ?? '—',
    fetchedAt: new Date().toISOString(),
  };
}

// ── Hooks React Query ─────────────────────────────────────────────────

export function useM3Live(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m3-live', tenantId],
    queryFn: () => fetchM3Live(tenantId),
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export function usePayrollCycles(tenantId = DEMO) {
  return useQuery({
    queryKey: ['payroll-cycles', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('payroll_cycles').select('*')
        .eq('tenant_id', tenantId)
        .order('period', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayrollCycleRow[];
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

export function usePayrollBulletins(tenantId = DEMO, cycleId?: string) {
  return useQuery({
    queryKey: ['payroll-bulletins', tenantId, cycleId],
    queryFn: async () => {
      if (!supabase) return [];
      let q = supabase.schema('atlas_people')
        .from('payroll_bulletins').select(`
          id, cycle_id, employee_id, numero, currency,
          brut_total, net_a_payer, cout_employeur, total_cotisations_emp, total_retenues,
          status, calculated_at, diffused_at,
          employees!employee_id(first_name, last_name, department)
        `)
        .eq('tenant_id', tenantId);
      if (cycleId) q = q.eq('cycle_id', cycleId);
      const { data, error } = await q.order('numero');
      if (error) throw error;
      return (data ?? []).map((b: Record<string, unknown>) => {
        const emp = b['employees'] as Record<string, string> | null;
        return {
          ...b,
          employee_first_name: emp?.first_name,
          employee_last_name: emp?.last_name,
          employee_department: emp?.department,
        } as PayrollBulletinRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

export function useCreatePayrollCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { tenantId: string; period: string; label: string; countryCode: string }) => {
      if (!supabase) throw new Error('Backend non configuré');
      const { data, error } = await supabase.schema('atlas_people').from('payroll_cycles').insert({
        tenant_id: payload.tenantId,
        period: payload.period,
        label: payload.label,
        country_code: payload.countryCode,
        cycle_type: 'normal',
        status: 'open',
        current_phase: 'preparation',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['payroll-cycles', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['m3-live', vars.tenantId] });
    },
  });
}

export function useValidateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cycleId, tenantId }: { cycleId: string; tenantId: string }) => {
      if (!supabase) throw new Error('Backend non configuré');
      const { error } = await supabase.schema('atlas_people').from('payroll_cycles')
        .update({ status: 'diffusion', current_phase: 'diffusion' })
        .eq('id', cycleId).eq('tenant_id', tenantId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['payroll-cycles', vars.tenantId] });
    },
  });
}
