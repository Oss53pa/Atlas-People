/**
 * M6 Onboarding — agrégat live Supabase (cockpit + Pulse 30/60/90).
 */
import { isBackendConfigured, supabase } from '../supabase';



export interface M6LiveKpis {
  arrivantsTotal: number;
  arrivantsEnCours: number;
  jalonsCompleted: number;
  jalonsOverdue: number;
  pulsesAvgScore: number; // 0-10
  pulsesCount: number;
  tasksOpen: number;
  fetchedAt: string;
}

export async function fetchM6Live(tenantId = '11111111-1111-1111-1111-111111111111'): Promise<M6LiveKpis | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema('atlas_people');
    const [arrivants, jalons, pulses, tasks] = await Promise.all([
      sb.from('m6_arrivants').select('status').eq('tenant_id', tenantId),
      sb.from('m6_jalons').select('status, due_date').eq('tenant_id', tenantId),
      sb.from('m6_pulses').select('score').eq('tenant_id', tenantId),
      sb.from('m6_tasks').select('status').eq('tenant_id', tenantId),
    ]);
    if (arrivants.error || jalons.error || pulses.error || tasks.error) return null;

    type ArrivantRow = { status: string };
    type JalonRow = { status: string; due_date: string | null };
    type PulseRow = { score: number | null };
    type TaskRow = { status: string };

    const arrArr = (arrivants.data ?? []) as ArrivantRow[];
    const jalArr = (jalons.data ?? []) as JalonRow[];
    const pulseArr = (pulses.data ?? []) as PulseRow[];
    const taskArr = (tasks.data ?? []) as TaskRow[];

    const today = new Date().toISOString().slice(0, 10);
    const validScores = pulseArr.map((p) => p.score).filter((s): s is number => Number.isFinite(s as number));
    const avg = validScores.length === 0 ? 0 : validScores.reduce((a, b) => a + b, 0) / validScores.length;

    return {
      arrivantsTotal: arrArr.length,
      arrivantsEnCours: arrArr.filter((a) => a.status === 'active' || a.status === 'in_progress').length,
      jalonsCompleted: jalArr.filter((j) => j.status === 'completed').length,
      jalonsOverdue: jalArr.filter((j) => j.status !== 'completed' && j.due_date && j.due_date < today).length,
      pulsesAvgScore: Math.round(avg * 10) / 10,
      pulsesCount: pulseArr.length,
      tasksOpen: taskArr.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
