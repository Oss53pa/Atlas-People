/**
 * Noyau Performance — couche live Supabase (RPC SECURITY DEFINER §11.2).
 *
 * Appelle le moteur de calcul figé côté base (réplique du noyau TS
 * `src/engine/performance`). Aucun calcul ici : on délègue aux RPC pour que la
 * couche validée (R4) reste l'unique autorité. Mode démo si backend non
 * configuré (retourne null → l'appelant retombe sur ses mocks).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isBackendConfigured, supabase } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
import { chainHash, GENESIS_HASH } from '../audit';
import { mockIdToUuid } from '../m1/supabaseLive';
import type { Couche, PeriodeType } from '../../engine/performance';

const SCHEMA = 'atlas_people';

/** §6.2 — % de réalisation d'une action sur un mois, pour une couche. */
export async function rpcRealisationAction(
  actionId: string,
  mois: string,
  couche: Couche,
): Promise<number | null> {
  if (!isBackendConfigured || !supabase) return null;
  const { data, error } = await supabase
    .schema(SCHEMA)
    .rpc('rpc_calcul_realisation_action', {
      p_action_id: actionId,
      p_mois: mois,
      p_couche: couche,
    });
  if (error) return null;
  return typeof data === 'number' ? data : Number(data);
}

/** §6.4 — % d'atteinte d'un objectif sur une période et une couche. */
export async function rpcAtteinteObjectif(
  objectifId: string,
  periodeType: PeriodeType,
  ref: string,
  couche: Couche,
): Promise<number | null> {
  if (!isBackendConfigured || !supabase) return null;
  const { data, error } = await supabase
    .schema(SCHEMA)
    .rpc('rpc_calcul_atteinte_objectif', {
      p_objectif_id: objectifId,
      p_periode_type: periodeType,
      p_ref: ref,
      p_couche: couche,
    });
  if (error) return null;
  return typeof data === 'number' ? data : Number(data);
}

/** §6.5 — score employé consolidé pour une campagne et une couche. */
export async function rpcScoreEmploye(
  employeId: string,
  campagneId: string,
  couche: Couche,
): Promise<number | null> {
  if (!isBackendConfigured || !supabase) return null;
  const { data, error } = await supabase.schema(SCHEMA).rpc('rpc_calcul_score_employe', {
    p_employe_id: employeId,
    p_campagne_id: campagneId,
    p_couche: couche,
  });
  if (error) return null;
  return typeof data === 'number' ? data : Number(data);
}

/** §8 — fige le snapshot mensuel auto + hash chaîné. Retourne le nb d'employés figés. */
export async function rpcConsolideMensuel(tenantId: string, mois: string): Promise<number | null> {
  if (!isBackendConfigured || !supabase) return null;
  const { data, error } = await supabase
    .schema(SCHEMA)
    .rpc('rpc_consolide_mensuel', { p_tenant_id: tenantId, p_mois: mois });
  if (error) return null;
  return typeof data === 'number' ? data : Number(data);
}

/** §7.4/§9 — fige + signe l'évaluation et émet evaluation.validee (accroche bonus M3). */
export async function rpcValideEvaluation(
  campagneId: string,
  employeId: string,
  validateurId: string,
): Promise<number | null> {
  if (!isBackendConfigured || !supabase) return null;
  const { data, error } = await supabase.schema(SCHEMA).rpc('rpc_valide_evaluation', {
    p_campagne_id: campagneId,
    p_employe_id: employeId,
    p_validateur_id: validateurId,
  });
  if (error) return null;
  return typeof data === 'number' ? data : Number(data);
}

/** §8 — pose la signature ADVIST sur l'évaluation annuelle figée. */
export async function rpcSigneEvaluationAdvist(
  scoreId: string,
  advistId: string,
  signataireId: string,
): Promise<boolean> {
  if (!isBackendConfigured || !supabase) return false;
  const { error } = await supabase.schema(SCHEMA).rpc('rpc_signe_evaluation_advist', {
    p_score_id: scoreId,
    p_advist_id: advistId,
    p_signataire_id: signataireId,
  });
  return !error;
}

/** Score final validé exposé en lecture seule à M3 (§9, scope=employe annee final). */
export interface ScoreFinalValide {
  employeId: string;
  campagneId: string;
  pctValide: number;
  validatedAt: string | null;
  hash: string | null;
}

export async function fetchScoreFinalValide(
  campagneId: string,
  employeId: string,
): Promise<ScoreFinalValide | null> {
  if (!isBackendConfigured || !supabase) return null;
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('perf_scores')
    .select('scope_id, campagne_id, pct_valide, validated_at, hash')
    .eq('scope', 'employe')
    .eq('campagne_id', campagneId)
    .eq('scope_id', employeId)
    .eq('periode_type', 'annee')
    .eq('periode_ref', 'final')
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    scope_id: string;
    campagne_id: string;
    pct_valide: number | null;
    validated_at: string | null;
    hash: string | null;
  };
  return {
    employeId: row.scope_id,
    campagneId: row.campagne_id,
    pctValide: row.pct_valide ?? 0,
    validatedAt: row.validated_at,
    hash: row.hash,
  };
}

// ── Persistance des scores (CDC Lot 3 §7.1) ───────────────────────────
// Les RPC de calcul côté base n'existent pas : on persiste directement les
// scores calculés par le moteur TS (src/engine/performance) dans perf_scores,
// avec la chaîne de hash intégrée de la table. Écritures HR-gated (RLS).

export interface PerfScoreInput {
  employeeId: string;   // id roster mock (eN) ou uuid
  scoreAuto: number;    // pct auto (0-100+)
  scoreValide: number;  // pct validé
}

export interface PersistPerfInput {
  annee: number;
  periodeType?: string; // 'annee' | 'semestre' | 'mois'
  periodeRef?: string;  // ex 'final', 'S1', '2026-06'
  scores: PerfScoreInput[];
}

export interface PersistPerfResult { campaignId: string; count: number; }

/** Récupère (ou crée) la campagne perf de l'année → id. */
async function ensurePerfCampaign(sb: SupabaseClient, tenantId: string, annee: number): Promise<string> {
  const ap = sb.schema(SCHEMA);
  const { data: existing, error: selErr } = await ap
    .from('perf_campagnes').select('id')
    .eq('tenant_id', tenantId).eq('annee', annee).limit(1).maybeSingle();
  if (selErr) throw mapSupabaseError(selErr);
  if (existing?.id) return existing.id as string;
  const id = crypto.randomUUID();
  const { error } = await ap.from('perf_campagnes')
    .insert({ id, tenant_id: tenantId, annee, statut: 'en_cours' }).select('id').single();
  if (error) throw mapSupabaseError(error);
  return id;
}

/** Fige un snapshot de scores employés (idempotent : remplace le snapshot de la période). */
export async function persistPerfSnapshot(input: PersistPerfInput): Promise<PersistPerfResult> {
  const sb = getSupabaseOrThrow();
  const ctx = await resolveSessionContext();
  const ap = sb.schema(SCHEMA);
  const periodeType = input.periodeType ?? 'annee';
  const periodeRef = input.periodeRef ?? 'final';

  const campaignId = await ensurePerfCampaign(sb, ctx.tenantId, input.annee);

  // Idempotence : on efface le snapshot employé précédent de cette période (non figé).
  const { error: delErr } = await ap.from('perf_scores')
    .delete()
    .eq('tenant_id', ctx.tenantId).eq('campagne_id', campaignId)
    .eq('scope', 'employe').eq('periode_type', periodeType).eq('periode_ref', periodeRef)
    .eq('fige', false);
  if (delErr) throw mapSupabaseError(delErr);

  let prev = GENESIS_HASH;
  const rows: Record<string, unknown>[] = [];
  for (const s of input.scores) {
    const scopeId = mockIdToUuid(s.employeeId);
    const core = { scope_id: scopeId, pct_auto: s.scoreAuto, pct_valide: s.scoreValide, periode_ref: periodeRef };
    const hash = await chainHash(prev, core);
    rows.push({
      id: crypto.randomUUID(), tenant_id: ctx.tenantId, scope: 'employe', scope_id: scopeId,
      campagne_id: campaignId, periode_type: periodeType, periode_ref: periodeRef,
      pct_auto: s.scoreAuto, pct_valide: s.scoreValide, fige: false, prev_hash: prev, hash,
    });
    prev = hash;
  }
  const { error } = await ap.from('perf_scores').insert(rows);
  if (error) throw mapSupabaseError(error);

  await appendAuditEntry({
    tenantId: ctx.tenantId, actorId: ctx.userId, action: 'perf.snapshot',
    entity: 'perf_scores', entityId: campaignId,
    payload: { count: rows.length, periodeType, periodeRef }, surface: 'backoffice',
  });
  return { campaignId, count: rows.length };
}

/** Fige/valide le snapshot (fige=true + validateur + date). Retourne le nb figé. */
export async function validatePerfSnapshot(campaignId: string, periodeRef = 'final', periodeType = 'annee'): Promise<number> {
  const sb = getSupabaseOrThrow();
  const ctx = await resolveSessionContext();
  const { data, error } = await sb.schema(SCHEMA).from('perf_scores')
    .update({ fige: true, validateur_id: ctx.userId, validated_at: new Date().toISOString() })
    .eq('tenant_id', ctx.tenantId).eq('campagne_id', campaignId)
    .eq('scope', 'employe').eq('periode_type', periodeType).eq('periode_ref', periodeRef)
    .select('id');
  if (error) throw mapSupabaseError(error);
  if (!data || data.length === 0) throw new NoRowsAffectedError('validatePerfSnapshot');
  await appendAuditEntry({
    tenantId: ctx.tenantId, actorId: ctx.userId, action: 'perf.validate',
    entity: 'perf_scores', entityId: campaignId, payload: { count: data.length, periodeRef }, surface: 'backoffice',
  });
  return data.length;
}

export function usePersistPerfSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: persistPerfSnapshot,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perf-scores'] }),
  });
}

export function useValidatePerfSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, periodeRef, periodeType }: { campaignId: string; periodeRef?: string; periodeType?: string }) =>
      validatePerfSnapshot(campaignId, periodeRef, periodeType),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perf-scores'] }),
  });
}
