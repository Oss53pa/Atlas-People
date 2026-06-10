/**
 * Snapshots figés & audit chaîné SHA-256 (CDC §8, §13 / note de cadrage §4.7, R7).
 *
 * Chaque clôture (mensuelle auto, semestrielle/annuelle validée, arbitrage,
 * version d'objectif) fige un enregistrement et le chaîne :
 *   hash(n) = SHA-256( hash(n-1) || canonical_json(record) )
 * On réutilise la chaîne d'audit transverse `chainHash` (src/lib/audit.ts) pour
 * garantir une sérialisation canonique identique côté client et côté vérif.
 */

import { GENESIS_HASH, chainHash } from '../../lib/audit';
import { Couche, PeriodeType } from './types';

export { GENESIS_HASH };

/** Charge utile canonique d'un score consolidé figé (`perf_scores`). */
export interface PerfScoreRecord {
  scope: 'employe' | 'departement' | 'global';
  scopeId: string;
  campagneId: string;
  periodeType: PeriodeType;
  periodeRef: string;
  couche: Couche;
  /** Pourcentage figé pour la couche concernée (0 → cap_depassement). */
  pct: number;
}

/** Un maillon de la chaîne d'audit Performance. */
export interface PerfSnapshot extends PerfScoreRecord {
  prevHash: string;
  hash: string;
}

/**
 * Calcule le hash chaîné d'un score figé à partir du hash précédent.
 * Le tout premier maillon part de `GENESIS_HASH`.
 */
export async function hashPerfScore(prevHash: string, record: PerfScoreRecord): Promise<string> {
  return chainHash(prevHash, record);
}

/**
 * Construit une chaîne de snapshots à partir de records ordonnés (ordre de
 * clôture). Chaque maillon chaîne le précédent — toute altération rompt la
 * chaîne (vérifiable via `verifyPerfChain`).
 */
export async function buildPerfChain(
  records: ReadonlyArray<PerfScoreRecord>,
  genesis: string = GENESIS_HASH,
): Promise<PerfSnapshot[]> {
  const chain: PerfSnapshot[] = [];
  let prev = genesis;
  for (const record of records) {
    const hash = await hashPerfScore(prev, record);
    chain.push({ ...record, prevHash: prev, hash });
    prev = hash;
  }
  return chain;
}

/** Vérifie l'intégrité d'une chaîne de snapshots Performance (§13). */
export async function verifyPerfChain(
  chain: ReadonlyArray<PerfSnapshot>,
  genesis: string = GENESIS_HASH,
): Promise<boolean> {
  let prev = genesis;
  for (const snap of chain) {
    if (snap.prevHash !== prev) return false;
    const recomputed = await hashPerfScore(prev, {
      scope: snap.scope,
      scopeId: snap.scopeId,
      campagneId: snap.campagneId,
      periodeType: snap.periodeType,
      periodeRef: snap.periodeRef,
      couche: snap.couche,
      pct: snap.pct,
    });
    if (recomputed !== snap.hash) return false;
    prev = snap.hash;
  }
  return true;
}
