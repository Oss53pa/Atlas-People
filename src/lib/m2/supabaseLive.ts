/**
 * M2 Temps & absences — couche live Supabase (lecture + décision).
 *
 * Aucune création de schéma : les tables existent déjà côté DB
 *   leave_requests · time_clockings · overtime_records · absences · clocking_anomalies
 * On lit/écrit en live quand le backend est configuré, sinon les écrans
 * retombent sur les stores Zustand (mode démo). Le décompte déterministe
 * reste porté par src/lib/m2/timesheet.ts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';

export interface M2LeaveRow {
  id: string;
  employee_id: string;
  leave_type_code: string;
  start_date: string;
  end_date: string;
  counted_days: number;
  status: string;
  submitted_at: string;
  decided_at?: string | null;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_department?: string;
}

/** Toutes les demandes de congé du tenant (file de validation RH live). */
export function useM2LeaveRequests(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m2-leaves', tenantId],
    queryFn: async (): Promise<M2LeaveRow[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('leave_requests')
        .select(`
          id, employee_id, leave_type_code, start_date, end_date,
          counted_days, status, submitted_at, decided_at,
          employees!employee_id(first_name, last_name, department)
        `)
        .eq('tenant_id', tenantId)
        .order('submitted_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return {
          ...r,
          employee_first_name: emp?.first_name,
          employee_last_name: emp?.last_name,
          employee_department: emp?.department,
        } as M2LeaveRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

export interface M2TimeStats {
  pendingLeaves: number;
  totalLeaves: number;
  clockings: number;
  pendingOvertime: number;
  absences: number;
  anomalies: number;
}

/** Compteurs live du module (badges « en DB » + synthèse). Robuste : chaque
 *  sous-compte échoue silencieusement à 0 si la table est absente/vide. */
export function useM2TimeStats(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m2-time-stats', tenantId],
    queryFn: async (): Promise<M2TimeStats> => {
      if (!supabase) return { pendingLeaves: 0, totalLeaves: 0, clockings: 0, pendingOvertime: 0, absences: 0, anomalies: 0 };
      const ap = supabase.schema('atlas_people');
      const countOf = async (table: string, filters: Record<string, string> = {}) => {
        try {
          let q = ap.from(table).select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId);
          for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
          const { count, error } = await q;
          if (error) return 0;
          return count ?? 0;
        } catch {
          return 0;
        }
      };
      const [pendingLeaves, totalLeaves, clockings, pendingOvertime, absences, anomalies] = await Promise.all([
        countOf('leave_requests', { status: 'pending' }),
        countOf('leave_requests'),
        countOf('time_clockings'),
        countOf('overtime_records', { status: 'pending' }),
        countOf('absences'),
        countOf('clocking_anomalies'),
      ]);
      return { pendingLeaves, totalLeaves, clockings, pendingOvertime, absences, anomalies };
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Décision RH sur une demande de congé (persistée en DB). */
export function useM2DecideLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, decision, tenantId }: { requestId: string; decision: 'approved' | 'rejected'; tenantId: string }) => {
      if (!supabase) throw new Error('Backend non configuré');
      const { error } = await supabase.schema('atlas_people').from('leave_requests')
        .update({ status: decision, decided_at: new Date().toISOString() })
        .eq('id', requestId).eq('tenant_id', tenantId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['m2-leaves', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['m2-time-stats', vars.tenantId] });
    },
  });
}
