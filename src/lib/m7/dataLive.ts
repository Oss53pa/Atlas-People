/**
 * M7 OKR — lecture live mappée sur les types métier du module.
 *
 * Tables seedées à parité du mock (supabase/seeds/m7_okr_seed.sql) :
 * m7_objectives (cascade 4 niveaux, parent_id) + m7_key_results. `useM7Data()`
 * est live-first avec fallback mock et expose les helpers LIÉS
 * (objectiveById, krsByObjective, childObjectives, checkinsByObjective…).
 *
 * Les ids live sont REMAPPÉS sur les ids mock (obj-N / kr-N via le ref) afin que
 * les check-ins (gardés mock — modèle DB par-KR divergent) et le graphe
 * d'alignement (dérivé de parent_id) restent cohérents. Progression et
 * confidence sont recalculées depuis les KR live.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { useAuth } from '../auth';
import { mockEmpId } from '../m1/roster';
import { confidenceFromProgress } from './referentiels';
import {
  OBJECTIVES, KEY_RESULTS, CHECKINS, ALIGNMENTS, OKR_CYCLES, activeCycle,
} from './mock';
import type {
  Objective, KeyResult, CheckIn, OkrCycle, AlignmentEdge, OkrKPI,
  OkrLevel, ObjectiveStatus, KrType, ConfidenceLevel,
} from './types';

const DEMO = '11111111-1111-1111-1111-111111111111';
// Jour du cycle Q2 (≈ 60/91) — sert au calcul de confidence comme dans le mock.
const CYCLE_PROGRESS = 0.66;

const LEVEL_REV: Record<string, OkrLevel> = {
  entreprise: 'company', direction: 'department', equipe: 'team', individuel: 'individual',
};
const STATUS_REV = (s: string): ObjectiveStatus =>
  s === 'completed' ? 'completed' : s === 'abandoned' ? 'abandoned' : s === 'draft' ? 'draft' : 'active';
const KRTYPE_REV = (t: string): KrType => (t === 'percentage' ? 'percent' : (t as KrType));
const confFromInt = (n: number | null | undefined): ConfidenceLevel =>
  (n ?? 0) >= 5 ? 'green' : (n ?? 0) >= 3 ? 'amber' : 'red';
const day = (v: unknown) => (v == null ? undefined : String(v).slice(0, 10));
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Maps de remap ref → id mock (pour préserver le lien check-ins / alignement).
const objMockIdByRef = new Map(OBJECTIVES.map((o) => [o.ref, o.id]));
const krMockIdByRef = new Map(KEY_RESULTS.map((k) => [k.ref, k.id]));
const mockKrByRef = new Map(KEY_RESULTS.map((k) => [k.ref, k]));

interface M7Raw {
  objectives: Objective[];
  keyResults: KeyResult[];
}

function useM7Raw(tenantId?: string) {
  const tid = tenantId ?? DEMO;
  return useQuery({
    queryKey: ['m7-raw', tid],
    queryFn: async (): Promise<M7Raw | null> => {
      if (!supabase) return null;
      const ap = supabase.schema('atlas_people');
      const [objs, krs] = await Promise.all([
        ap.from('m7_objectives').select('*').eq('tenant_id', tid).order('ref'),
        ap.from('m7_key_results').select('*').eq('tenant_id', tid).order('ref'),
      ]);
      for (const r of [objs, krs]) if (r.error) throw r.error;

      const objRows = (objs.data ?? []) as Record<string, unknown>[];
      const krRows = (krs.data ?? []) as Record<string, unknown>[];

      // uuid → ref pour résoudre parent_id et objective_id en ids mock.
      const refByUuid = new Map(objRows.map((o) => [o.id as string, o.ref as string]));
      const mockIdByUuid = (uuid: string | null | undefined): string | undefined =>
        uuid == null ? undefined : objMockIdByRef.get(refByUuid.get(uuid) ?? '');

      // KR mappés d'abord (servent au calcul de progression des objectifs).
      const keyResults: KeyResult[] = krRows.map((k): KeyResult => {
        const ref = (k.ref as string) ?? '';
        const mockKr = mockKrByRef.get(ref);
        const baseline = Number(k.baseline ?? 0);
        const target = Number(k.target ?? 0);
        const current = Number(k.current_value ?? 0);
        return {
          id: krMockIdByRef.get(ref) ?? (k.id as string),
          ref,
          objectiveId: mockIdByUuid(k.objective_id as string) ?? (k.objective_id as string),
          title: (k.title as string) ?? '',
          type: KRTYPE_REV((k.type as string) ?? 'numeric'),
          startValue: baseline,
          targetValue: target,
          currentValue: current,
          unit: (k.unit as string) ?? undefined,
          ownerEmployeeId: mockKr?.ownerEmployeeId,
          weight: Number(k.weight_pct ?? mockKr?.weight ?? 1),
          confidence: confFromInt(k.confidence as number),
          lastUpdatedAt: day(k.updated_at) ?? '2026-05-26',
        };
      });

      const krsByObj = new Map<string, KeyResult[]>();
      for (const k of keyResults) {
        const arr = krsByObj.get(k.objectiveId) ?? [];
        arr.push(k);
        krsByObj.set(k.objectiveId, arr);
      }

      const objectives: Objective[] = objRows.map((o): Objective => {
        const mockId = objMockIdByRef.get(o.ref as string) ?? (o.id as string);
        const krList = krsByObj.get(mockId) ?? [];
        const wsum = krList.reduce((s, k) => s + (k.weight || 0), 0);
        const progress = wsum
          ? krList.reduce((s, k) => s + (k.weight || 0) * clamp01((k.currentValue - k.startValue) / Math.max(0.0001, k.targetValue - k.startValue)), 0) / wsum
          : 0;
        const dbStatus = (o.status as string) ?? 'in_progress';
        const confidence = dbStatus === 'at_risk' ? 'red' : confidenceFromProgress(progress, CYCLE_PROGRESS);
        return {
          id: mockId,
          ref: (o.ref as string) ?? '',
          cycleId: activeCycle.id,
          level: LEVEL_REV[(o.level as string) ?? 'entreprise'] ?? 'company',
          title: (o.title as string) ?? '',
          description: (o.description as string) ?? undefined,
          ownerEmployeeId: o.owner_id ? mockEmpId(o.owner_id as string) : undefined,
          ownerTeam: (o.team_label as string) ?? undefined,
          parentObjectiveId: mockIdByUuid(o.parent_id as string),
          status: STATUS_REV(dbStatus),
          progress,
          confidence,
          startedAt: day(o.created_at) ?? '2026-04-01',
          finalScore: o.final_score == null ? undefined : Number(o.final_score),
        };
      });

      return { objectives, keyResults };
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}

export interface M7Data {
  live: boolean;
  objectives: Objective[];
  keyResults: KeyResult[];
  checkins: CheckIn[];
  cycles: OkrCycle[];
  activeCycle: OkrCycle;
  alignments: AlignmentEdge[];
  objectiveById: (id: string) => Objective | undefined;
  krsByObjective: (id: string) => KeyResult[];
  childObjectives: (parentId: string) => Objective[];
  checkinsByObjective: (id: string) => CheckIn[];
  cycleById: (id: string) => OkrCycle | undefined;
  kpis: () => OkrKPI;
}

/** Source de données M7 : live Supabase si dispo, sinon datasets mock. */
export function useM7Data(): M7Data {
  const { tenantId } = useAuth();
  const { data: raw } = useM7Raw(tenantId ?? undefined);
  const live = isBackendConfigured && !!raw && raw.objectives.length > 0 && raw.keyResults.length > 0;

  const objectives = live && raw ? raw.objectives : OBJECTIVES;
  const keyResults = live && raw ? raw.keyResults : KEY_RESULTS;
  // Alignement dérivé des parent_id live (sinon mock).
  const alignments: AlignmentEdge[] = live
    ? objectives
        .filter((o) => o.parentObjectiveId)
        .map((o) => ({ childObjectiveId: o.id, parentObjectiveId: o.parentObjectiveId!, contribution: 'primary' as const }))
    : ALIGNMENTS;
  // Compteur d'objectifs par cycle recalculé (le cycle actif porte tout le live).
  const cycles: OkrCycle[] = OKR_CYCLES.map((c) =>
    c.id === activeCycle.id ? { ...c, objectivesCount: objectives.filter((o) => o.cycleId === c.id).length } : c,
  );

  const objectiveById = (id: string) => objectives.find((o) => o.id === id);

  const kpis = (): OkrKPI => {
    const active = objectives.filter((o) => o.status === 'active');
    const krActive = keyResults.filter((k) => objectiveById(k.objectiveId)?.status === 'active');
    const avgProg = active.length ? active.reduce((s, o) => s + o.progress, 0) / active.length : 0;
    const greenPct = active.length ? Math.round((active.filter((o) => o.confidence === 'green').length / active.length) * 100) : 0;
    const expectedCheckIns = active.filter((o) => o.level !== 'company').length;
    const submittedThisWeek = CHECKINS.filter((c) => c.weekOf === '2026-W21').length;
    const late = Math.max(0, expectedCheckIns - submittedThisWeek);
    const aligned = objectives.filter((o) => o.level !== 'company' && o.parentObjectiveId).length;
    const denomAlign = objectives.filter((o) => o.level !== 'company').length;
    const alignPct = denomAlign ? Math.round((aligned / denomAlign) * 100) : 0;
    return {
      cyclesActifs: cycles.filter((c) => c.status === 'active').length,
      objectifsActifs: active.length,
      krsActifs: krActive.length,
      progressionMoyenne: avgProg,
      confidenceGreenPct: greenPct,
      checkInsEnRetard: late,
      alignementCoveragePct: alignPct,
      scoreMoyenCloture: 0.72,
    };
  };

  return {
    live,
    objectives,
    keyResults,
    checkins: CHECKINS,
    cycles,
    activeCycle: cycles.find((c) => c.id === activeCycle.id) ?? activeCycle,
    alignments,
    objectiveById,
    krsByObjective: (id) => keyResults.filter((k) => k.objectiveId === id),
    childObjectives: (parentId) => objectives.filter((o) => o.parentObjectiveId === parentId),
    checkinsByObjective: (id) => CHECKINS.filter((c) => c.objectiveId === id),
    cycleById: (id) => cycles.find((c) => c.id === id),
    kpis,
  };
}
