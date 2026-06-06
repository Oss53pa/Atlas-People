/**
 * M3 Paie — saisie variables live Supabase.
 * Table : atlas_people.payroll_inputs (et sous-tables bonus, absences, overtime…)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';

export interface PayrollInputRow {
  id: string;
  cycle_id: string;
  employee_id: string;
  status: string;
  notes: string | null;
  locked_at: string | null;
  locked_by: string | null;
  updated_at: string;
}

export function usePayrollInputs(tenantId = DEMO, cycleId?: string) {
  return useQuery({
    queryKey: ['payroll-inputs', tenantId, cycleId],
    queryFn: async () => {
      if (!supabase || !cycleId) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('payroll_inputs')
        .select('id,cycle_id,employee_id,status,notes,locked_at,locked_by,updated_at')
        .eq('tenant_id', tenantId)
        .eq('cycle_id', cycleId);
      if (error) throw error;
      return (data ?? []) as PayrollInputRow[];
    },
    enabled: isBackendConfigured && Boolean(cycleId),
    staleTime: 30_000,
  });
}

export function useUpsertPayrollInput() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      tenantId: string; cycleId: string; employeeId: string;
      status: 'draft' | 'ready' | 'locked';
      notes?: string;
      bonuses?: Array<{ code: string; label: string; amount: number }>;
      overtime?: Array<{ date: string; hours: number; rate: number }>;
    }) => {
      if (!supabase) throw new Error('Backend non configuré');

      // Upsert l'enregistrement principal
      const { data: inp, error: e1 } = await supabase.schema('atlas_people')
        .from('payroll_inputs')
        .upsert({
          tenant_id: payload.tenantId,
          cycle_id: payload.cycleId,
          employee_id: payload.employeeId,
          status: payload.status,
          notes: payload.notes ?? null,
          locked_at: payload.status === 'locked' ? new Date().toISOString() : null,
        }, { onConflict: 'cycle_id,employee_id' })
        .select('id').single();
      if (e1 || !inp) throw e1 ?? new Error('Upsert payroll_inputs échoué');

      const inputId = (inp as { id: string }).id;

      // Primes ponctuelles si présentes
      if (payload.bonuses && payload.bonuses.length > 0) {
        await supabase.schema('atlas_people').from('payroll_inputs_bonuses')
          .delete().eq('input_id', inputId);
        await supabase.schema('atlas_people').from('payroll_inputs_bonuses').insert(
          payload.bonuses.map((b) => ({
            input_id: inputId, tenant_id: payload.tenantId,
            cycle_id: payload.cycleId, employee_id: payload.employeeId,
            code: b.code, label: b.label, amount: b.amount,
          })),
        );
      }

      return inputId;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['payroll-inputs', vars.tenantId, vars.cycleId] });
      qc.invalidateQueries({ queryKey: ['m3-live', vars.tenantId] });
    },
  });
}

/** Lock toutes les saisies d'un cycle (vers statut 'ready' en masse). */
export function useLockAllInputs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenantId, cycleId, employeeIds }: { tenantId: string; cycleId: string; employeeIds: string[] }) => {
      if (!supabase) return;
      // Upsert batch
      const now = new Date().toISOString();
      const rows = employeeIds.map((eid) => ({
        tenant_id: tenantId, cycle_id: cycleId, employee_id: eid,
        status: 'locked', locked_at: now,
      }));
      for (let i = 0; i < rows.length; i += 10) {
        await supabase.schema('atlas_people').from('payroll_inputs')
          .upsert(rows.slice(i, i + 10), { onConflict: 'cycle_id,employee_id' });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['payroll-inputs', vars.tenantId, vars.cycleId] });
    },
  });
}
