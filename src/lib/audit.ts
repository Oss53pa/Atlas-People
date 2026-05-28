/**
 * Audit trail chaîné SHA-256 (cahier §2.3).
 * Chaque opération sensible (paie, disciplinaire, accès données) est chaînée :
 * hash(n) = SHA-256( hash(n-1) || payload(n) ). Toute altération rompt la chaîne.
 */

export const GENESIS_HASH = '0'.repeat(64);

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Calcule le hash chaîné d'un événement à partir du hash précédent. */
export async function chainHash(previousHash: string, payload: unknown): Promise<string> {
  const serialized = JSON.stringify(payload, Object.keys(payload as object).sort());
  return sha256Hex(`${previousHash}|${serialized}`);
}

export interface AuditEvent {
  action: string;
  actorId: string;
  entity: string;
  entityId: string;
  at: string;
  hash: string;
  previousHash: string;
}

/** Vérifie l'intégrité d'une chaîne d'événements. */
export async function verifyChain(events: AuditEvent[]): Promise<boolean> {
  let prev = GENESIS_HASH;
  for (const evt of events) {
    if (evt.previousHash !== prev) return false;
    const { hash, ...rest } = evt;
    const recomputed = await chainHash(prev, rest);
    if (recomputed !== hash) return false;
    prev = hash;
  }
  return true;
}
