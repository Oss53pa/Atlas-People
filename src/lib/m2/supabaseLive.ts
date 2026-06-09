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
import { leaveTypeByCode } from './leaveTypes';
import type { Clocking } from '../../store/useClocking';
import type { OvertimeRecord } from '../../store/useOvertime';
import type { TimeOffRequest } from '../../store/useTimeOff';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';

/** Mappe l'UUID employé du tenant démo (e1000001-...-0000NN) vers l'id mock eNN
 *  utilisé par le front (roster EMPLOYEES). Renvoie l'uuid tel quel si non démo. */
function mockEmpId(uuid: string): string {
  const n = parseInt(uuid.slice(-12), 10);
  return Number.isFinite(n) && n > 0 ? `e${n}` : uuid;
}

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
        countOf('overtime_records', { status: 'detected' }),
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

/** Décision RH sur une demande de congé (persistée en DB).
 *  Statuts conformes à la contrainte leave_requests_status_check (approved/refused). */
export function useM2DecideLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, decision, tenantId }: { requestId: string; decision: 'approved' | 'refused'; tenantId: string }) => {
      if (!supabase) throw new Error('Backend non configuré');
      const { error } = await supabase.schema('atlas_people').from('leave_requests')
        .update({ status: decision, decided_at: new Date().toISOString() })
        .eq('id', requestId).eq('tenant_id', tenantId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['m2-leaves', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['m2-leaves-full', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['m2-time-stats', vars.tenantId] });
    },
  });
}

/** Décision manager/RH sur une heure supplémentaire (persistée en DB).
 *  Statuts conformes à overtime_records_status_check (validated/refused). */
export function useM2DecideOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recordId, decision, tenantId }: { recordId: string; decision: 'validated' | 'refused'; tenantId: string }) => {
      if (!supabase) throw new Error('Backend non configuré');
      const { error } = await supabase.schema('atlas_people').from('overtime_records')
        .update({ status: decision, validated_at: new Date().toISOString() })
        .eq('id', recordId).eq('tenant_id', tenantId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['m2-overtime', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['m2-time-stats', vars.tenantId] });
    },
  });
}

// ── Listes live mappées sur les shapes des stores Zustand (front inchangé) ──

/** Demandes de congé live → shape TimeOffRequest. */
export function useM2LeavesLive(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m2-leaves-full', tenantId],
    queryFn: async (): Promise<TimeOffRequest[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('leave_requests')
        .select('id, employee_id, leave_type_code, start_date, end_date, counted_days, status, submitted_at, created_at')
        .eq('tenant_id', tenantId).order('submitted_at', { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        employeeId: mockEmpId(r.employee_id as string),
        code: r.leave_type_code as string,
        label: leaveTypeByCode(r.leave_type_code as string)?.label ?? (r.leave_type_code as string),
        start: r.start_date as string,
        end: r.end_date as string,
        countedDays: Number(r.counted_days ?? 0),
        status: r.status as TimeOffRequest['status'],
        surface: 'ess',
        createdAt: (((r.submitted_at as string) ?? (r.created_at as string)) ?? '').slice(0, 10),
      }));
    },
    enabled: isBackendConfigured, staleTime: 30_000,
  });
}

/** Pointages live → shape Clocking. */
export function useM2ClockingsLive(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m2-clockings', tenantId],
    queryFn: async (): Promise<Clocking[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('time_clockings')
        .select('id, employee_id, clocking_type, clocked_at, geo_lat, geo_lng, source, verification_status')
        .eq('tenant_id', tenantId).order('clocked_at', { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        employeeId: mockEmpId(c.employee_id as string),
        type: c.clocking_type as Clocking['type'],
        at: c.clocked_at as string,
        geo: c.geo_lat != null && c.geo_lng != null ? { lat: Number(c.geo_lat), lng: Number(c.geo_lng) } : undefined,
        offline: c.source === 'offline_sync',
        verification: c.verification_status === 'ok' ? 'ok' : 'to_verify',
      }));
    },
    enabled: isBackendConfigured, staleTime: 30_000,
  });
}

/** Heures supplémentaires live → shape OvertimeRecord. */
export function useM2OvertimeLive(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m2-overtime', tenantId],
    queryFn: async (): Promise<OvertimeRecord[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('overtime_records')
        .select('id, employee_id, work_date, hours, rate_pct, category, status')
        .eq('tenant_id', tenantId).order('work_date', { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []).map((o: Record<string, unknown>) => {
        const hours = Number(o.hours);
        const raw = o.status as string;
        const status: OvertimeRecord['status'] = raw === 'validated' || raw === 'converted_to_recovery' ? 'validated' : raw === 'refused' ? 'refused' : 'pending';
        return {
          id: o.id as string,
          employeeId: mockEmpId(o.employee_id as string),
          date: o.work_date as string,
          plannedHours: 8,
          workedHours: 8 + hours,
          overtimeHours: hours,
          ratePct: Number(o.rate_pct),
          category: o.category as OvertimeRecord['category'],
          status,
          source: 'auto',
        };
      });
    },
    enabled: isBackendConfigured, staleTime: 30_000,
  });
}
