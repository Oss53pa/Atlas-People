/**
 * Noyau Performance — couche live Supabase (RPC SECURITY DEFINER §11.2).
 *
 * Appelle le moteur de calcul figé côté base (réplique du noyau TS
 * `src/engine/performance`). Aucun calcul ici : on délègue aux RPC pour que la
 * couche validée (R4) reste l'unique autorité. Mode démo si backend non
 * configuré (retourne null → l'appelant retombe sur ses mocks).
 */
import { isBackendConfigured, supabase } from '../supabase';
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
