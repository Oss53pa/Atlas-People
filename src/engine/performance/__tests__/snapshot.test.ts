/**
 * Tests de l'audit chaîné des snapshots Performance (CDC §8, §13 / R7).
 * Toute altération d'un maillon doit rompre la chaîne.
 */
import { describe, it, expect } from 'vitest';
import {
  GENESIS_HASH,
  PerfScoreRecord,
  buildPerfChain,
  hashPerfScore,
  verifyPerfChain,
} from '../index';

const rec = (over: Partial<PerfScoreRecord> = {}): PerfScoreRecord => ({
  scope: 'employe',
  scopeId: 'emp-1',
  campagneId: 'camp-2026',
  periodeType: 'mois',
  periodeRef: '2026-01',
  couche: 'auto',
  pct: 80,
  ...over,
});

describe('hashPerfScore', () => {
  it('est déterministe', async () => {
    const h1 = await hashPerfScore(GENESIS_HASH, rec());
    const h2 = await hashPerfScore(GENESIS_HASH, rec());
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });
  it('change si le pct change', async () => {
    const h1 = await hashPerfScore(GENESIS_HASH, rec({ pct: 80 }));
    const h2 = await hashPerfScore(GENESIS_HASH, rec({ pct: 81 }));
    expect(h1).not.toBe(h2);
  });
  it('change si le hash précédent change (chaînage)', async () => {
    const h1 = await hashPerfScore(GENESIS_HASH, rec());
    const h2 = await hashPerfScore('a'.repeat(64), rec());
    expect(h1).not.toBe(h2);
  });
});

describe('buildPerfChain / verifyPerfChain', () => {
  const records: PerfScoreRecord[] = [
    rec({ periodeRef: '2026-01', pct: 60 }),
    rec({ periodeRef: '2026-02', pct: 72 }),
    rec({ periodeRef: '2026-03', pct: 88 }),
  ];

  it('le premier maillon part de la genèse', async () => {
    const chain = await buildPerfChain(records);
    expect(chain[0].prevHash).toBe(GENESIS_HASH);
    expect(chain[1].prevHash).toBe(chain[0].hash);
    expect(chain[2].prevHash).toBe(chain[1].hash);
  });

  it('valide une chaîne intègre', async () => {
    const chain = await buildPerfChain(records);
    expect(await verifyPerfChain(chain)).toBe(true);
  });

  it('détecte la falsification d’un pct figé', async () => {
    const chain = await buildPerfChain(records);
    const tampered = chain.map((s, i) => (i === 1 ? { ...s, pct: 99 } : s));
    expect(await verifyPerfChain(tampered)).toBe(false);
  });

  it('détecte la réécriture d’un maillon de hash', async () => {
    const chain = await buildPerfChain(records);
    const tampered = chain.map((s, i) => (i === 0 ? { ...s, hash: 'b'.repeat(64) } : s));
    expect(await verifyPerfChain(tampered)).toBe(false);
  });

  it('supporte une genèse personnalisée (reprise de chaîne)', async () => {
    const genesis = 'c'.repeat(64);
    const chain = await buildPerfChain(records, genesis);
    expect(chain[0].prevHash).toBe(genesis);
    expect(await verifyPerfChain(chain, genesis)).toBe(true);
    // une mauvaise genèse invalide la chaîne
    expect(await verifyPerfChain(chain)).toBe(false);
  });
});
