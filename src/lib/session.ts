/**
 * Socle de session & mutation (CDC §3.4).
 *
 * Résout l'identité de la session (tenant / user / employee) depuis Supabase,
 * garantit qu'aucune écriture ne part en mode démo local (backend absent), et
 * normalise les erreurs Postgres en erreurs métier lisibles.
 *
 * RÈGLE CARDINALE : aucune constante `DEMO_*` sur un chemin d'écriture.
 * L'identité employé se résout via `auth.uid()` → `employees.user_id`
 * (fonctions SECURITY DEFINER `current_tenant_ids()` / `current_employee_ids()`).
 */
import { supabase } from './supabase';

// ── Erreurs typées ────────────────────────────────────────────────────

export class BackendNotConfiguredError extends Error {
  constructor() {
    super('Backend non configuré — aucune écriture réelle possible (mode démo local).');
    this.name = 'BackendNotConfiguredError';
  }
}

/** Levée quand un UPDATE/DELETE affecte 0 ligne (règle 1 : jamais d'écriture fantôme). */
export class NoRowsAffectedError extends Error {
  constructor(op: string) {
    super(`Aucune ligne affectée (${op}) — enregistrement introuvable ou accès refusé.`);
    this.name = 'NoRowsAffectedError';
  }
}

export class IdentityUnresolvedError extends Error {
  constructor() {
    super("Identité employé introuvable pour la session courante (aucun employee.user_id lié).");
    this.name = 'IdentityUnresolvedError';
  }
}

export class SupabaseWriteError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SupabaseWriteError';
    this.code = code;
  }
}

/** PG 23505 — contrainte UNIQUE violée. */
export class UniquenessError extends SupabaseWriteError {
  constructor() {
    super('Doublon : cet enregistrement existe déjà.', '23505');
    this.name = 'UniquenessError';
  }
}

/** PG 23503 — clé étrangère invalide. */
export class ForeignKeyError extends SupabaseWriteError {
  constructor() {
    super('Référence invalide : un élément lié est introuvable.', '23503');
    this.name = 'ForeignKeyError';
  }
}

/** PG 23514 — contrainte CHECK violée. */
export class ValidationError extends SupabaseWriteError {
  constructor(message?: string) {
    super(message ?? 'Valeur non conforme aux règles métier.', '23514');
    this.name = 'ValidationError';
  }
}

/** PG 42501 — RLS a refusé l'accès. */
export class RlsDeniedError extends SupabaseWriteError {
  constructor(op?: string) {
    super(
      `Accès refusé par RLS${op ? ` (${op})` : ''} — périmètre non autorisé.`,
      '42501',
    );
    this.name = 'RlsDeniedError';
  }
}

/** Traduit une erreur Supabase/Postgres en erreur métier typée. */
export function mapSupabaseError(error: { code?: string; message?: string } | null): Error {
  const code = error?.code;
  const msg = error?.message ?? 'Erreur base de données.';
  switch (code) {
    case '23505': return new UniquenessError();
    case '23503': return new ForeignKeyError();
    case '23514': return new ValidationError(msg);
    case '42501': return new RlsDeniedError(msg);
    default:      return new SupabaseWriteError(msg, code);
  }
}

/** Renvoie le client Supabase ou lève — interdit tout fallback mock silencieux en écriture. */
export function getSupabaseOrThrow() {
  if (!supabase) throw new BackendNotConfiguredError();
  return supabase;
}

// ── Contexte de session ───────────────────────────────────────────────

export interface SessionContext {
  tenantId: string;
  userId: string;
  employeeId: string;
}

let _cache: { userId: string; ctx: SessionContext } | null = null;

/** Vide le cache d'identité (à appeler sur changement d'auth / signOut). */
export function clearSessionContextCache() {
  _cache = null;
}

/**
 * Résout `{ tenantId, userId, employeeId }` depuis la session active.
 * Lève `BackendNotConfiguredError` (pas de backend), `IdentityUnresolvedError`
 * (pas de session ou pas d'employé lié). Résultat mis en cache par userId.
 */
export async function resolveSessionContext(): Promise<SessionContext> {
  const sb = getSupabaseOrThrow();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new IdentityUnresolvedError();
  if (_cache && _cache.userId === user.id) return _cache.ctx;

  const ap = sb.schema('atlas_people');
  const [{ data: tids, error: tErr }, { data: eids, error: eErr }] = await Promise.all([
    ap.rpc('current_tenant_ids'),
    ap.rpc('current_employee_ids'),
  ]);
  if (tErr) throw mapSupabaseError(tErr);
  if (eErr) throw mapSupabaseError(eErr);

  const tenantId = Array.isArray(tids) ? (tids[0] as string) : (tids as string | null);
  const employeeId = Array.isArray(eids) ? (eids[0] as string) : (eids as string | null);
  if (!tenantId || !employeeId) throw new IdentityUnresolvedError();

  const ctx: SessionContext = { tenantId, userId: user.id, employeeId };
  _cache = { userId: user.id, ctx };
  return ctx;
}
