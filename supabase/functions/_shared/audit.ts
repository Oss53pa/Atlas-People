// Port Deno de src/lib/audit.ts — chaîne d'audit SHA-256 (hash(n) = SHA-256(hash(n-1) || payload)).
export const GENESIS_HASH = '0'.repeat(64);

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function chainHash(previousHash: string, payload: unknown): Promise<string> {
  const serialized = JSON.stringify(payload, Object.keys(payload as object).sort());
  return sha256Hex(`${previousHash}|${serialized}`);
}
