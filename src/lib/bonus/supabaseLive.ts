/**
 * BONUS — couche live Supabase (CDC Lot 3 §7.2).
 *
 * Deux temps :
 *   1. `persistBonusSimulation` — fige une simulation direction : crée/retrouve
 *      la campagne (perf_campagnes), insère l'enveloppe (statut brouillon) et les
 *      calculs par employé (statut calcule), avec chaîne SHA-256 sur les calculs.
 *   2. `commitBonusDecision` — délègue la VALIDATION à l'Edge Function
 *      `commit-bonus-decision` (service_role, re-vérif rôle RH — règle 5) qui passe
 *      les calculs en « validé » et clôture l'enveloppe.
 *
 * Montants en unités mineures (bigint) — jamais de float (règle 4).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, SupabaseWriteError } from '../session';
import { appendAuditEntry } from '../auditLog';
import { chainHash, GENESIS_HASH } from '../audit';
import { mockIdToUuid } from '../m1/supabaseLive';

export interface BonusAllocationInput {
  employeeId: string;      // id roster mock (eN) ou uuid
  scorePct: number;
  part: number;            // unités mineures
  brut: number;            // unités mineures
  final: number;           // unités mineures
  borne?: string | null;
  formule?: string | null;
}

export interface PersistBonusInput {
  annee: number;
  montant: number;         // enveloppe, unités mineures
  mode: string;            // A_prorata | B_plafonnee | C_libre
  devise?: string;
  lignes: BonusAllocationInput[];
}

export interface BonusAllocationRef {
  employeeId: string;      // uuid DB
  enveloppeId: string;
  finalAmount: number;
  currency: string;
}

export interface PersistBonusResult {
  campaignId: string;
  enveloppeId: string;
  allocations: BonusAllocationRef[];
}

/** Récupère (ou crée) la campagne perf de l'année → id (ancre pour l'enveloppe). */
async function ensureBonusCampaign(sb: SupabaseClient, tenantId: string, annee: number): Promise<string> {
  const ap = sb.schema('atlas_people');
  const { data: existing, error: selErr } = await ap
    .from('perf_campagnes').select('id')
    .eq('tenant_id', tenantId).eq('annee', annee).limit(1).maybeSingle();
  if (selErr) throw mapSupabaseError(selErr);
  if (existing?.id) return existing.id as string;
  const id = crypto.randomUUID();
  const { error } = await ap.from('perf_campagnes')
    .insert({ id, tenant_id: tenantId, annee, statut: 'brouillon' }).select('id').single();
  if (error) throw mapSupabaseError(error);
  return id;
}

/** Fige une simulation bonus : campagne + enveloppe (brouillon) + calculs (calcule). */
export async function persistBonusSimulation(input: PersistBonusInput): Promise<PersistBonusResult> {
  const sb = getSupabaseOrThrow();
  const ctx = await resolveSessionContext();
  const ap = sb.schema('atlas_people');
  const devise = input.devise ?? 'XOF';

  const campaignId = await ensureBonusCampaign(sb, ctx.tenantId, input.annee);

  const enveloppeId = crypto.randomUUID();
  const { error: envErr } = await ap.from('bonus_enveloppes').insert({
    id: enveloppeId, tenant_id: ctx.tenantId, campagne_id: campaignId,
    periode_type: 'annuel', periode_ref: String(input.annee), scope: 'global',
    montant: Math.round(input.montant), devise, mode_bonus: input.mode, statut: 'brouillon',
  }).select('id').single();
  if (envErr) throw mapSupabaseError(envErr);

  // Calculs par employé, chaînés (hash intégré de la table bonus_calculs).
  let prev = GENESIS_HASH;
  const calculs: Record<string, unknown>[] = [];
  for (const l of input.lignes) {
    const employeUuid = mockIdToUuid(l.employeeId);
    const core = { employe_id: employeUuid, brut: Math.round(l.brut), final: Math.round(l.final), borne: l.borne ?? null };
    const hash = await chainHash(prev, core);
    calculs.push({
      id: crypto.randomUUID(), tenant_id: ctx.tenantId, enveloppe_id: enveloppeId,
      employe_id: employeUuid, campagne_id: campaignId,
      score_source: l.scorePct, part: Math.round(l.part), brut: Math.round(l.brut), final: Math.round(l.final),
      borne: l.borne ?? null, devise, statut: 'calcule', visible_employe: false,
      formule_appliquee: l.formule ?? null, prev_hash: prev, hash,
    });
    prev = hash;
  }
  const { error: calcErr } = await ap.from('bonus_calculs').insert(calculs);
  if (calcErr) throw mapSupabaseError(calcErr);

  await appendAuditEntry({
    tenantId: ctx.tenantId, actorId: ctx.userId, action: 'bonus.simulate',
    entity: 'bonus_enveloppes', entityId: enveloppeId,
    payload: { campaignId, count: calculs.length, montant: Math.round(input.montant), mode: input.mode },
    surface: 'backoffice',
  });

  return {
    campaignId, enveloppeId,
    allocations: input.lignes.map((l) => ({
      employeeId: mockIdToUuid(l.employeeId), enveloppeId,
      finalAmount: Math.round(l.final), currency: devise,
    })),
  };
}

export interface CommitBonusResult {
  campaignId: string;
  committed: string[];
  errors: { employeeId: string; message: string }[];
  total: number;
}

/** Valide la décision bonus (statut → validé, enveloppe clôturée) via Edge Function. */
export async function commitBonusDecision(campaignId: string, allocations: BonusAllocationRef[]): Promise<CommitBonusResult> {
  const sb = getSupabaseOrThrow();
  const idempotencyKey = crypto.randomUUID();
  const { data, error } = await sb.functions.invoke('commit-bonus-decision', {
    body: { campaignId, allocations, idempotencyKey },
  });
  if (error) throw new SupabaseWriteError(error.message ?? 'Validation bonus échouée');
  return data as CommitBonusResult;
}

// ── Hooks React Query ─────────────────────────────────────────────────

export function usePersistBonusSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: persistBonusSimulation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bonus-enveloppes'] }),
  });
}

export function useCommitBonusDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, allocations }: { campaignId: string; allocations: BonusAllocationRef[] }) =>
      commitBonusDecision(campaignId, allocations),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bonus-enveloppes'] }),
  });
}
