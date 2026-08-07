/**
 * Auth Atlas People — couche Supabase Auth.
 *
 * • useAuth() : hook React qui expose session, user, tenantId, role.
 * • signIn / signOut / sendMagicLink / resetPassword
 * • En mode démo (pas de Supabase configuré), retourne un user fictif.
 *
 * ⚠️ Ne jamais exposer le nom "Supabase" dans l'UI → "infrastructure Atlas".
 */
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isBackendConfigured } from './supabase';
import { clearSessionContextCache } from './session';
import { safeLocalStorage } from './safeStorage';
import type { TenantType } from '../store/useAppStore';
export { isBackendConfigured };

// ── Types ────────────────────────────────────────────────────────────

export type AppRole = 'super_admin' | 'admin' | 'hr' | 'manager' | 'employee';

/** Un workspace auquel l'utilisateur appartient. */
export interface Workspace {
  tenantId: string;
  name: string;
  tenantType: TenantType;
  role: AppRole;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** ID du tenant actif (UUID). Null tant que non résolu. */
  tenantId: string | null;
  role: AppRole;
  /** Mode de fonctionnement du workspace actif. */
  tenantType: TenantType;
  /**
   * Tous les workspaces du compte — un par formule souscrite. Le workspace
   * ACTIF détermine le périmètre RLS côté base (cf. migration 0068) : ce
   * n'est pas un simple confort d'affichage.
   */
  workspaces: Workspace[];
  loading: boolean;
  /**
   * True dès que la recherche d'appartenance a abouti, qu'elle en ait trouvé
   * une ou non. Distinct de `loading`, qui retombe à false avant la fin de
   * cette résolution : sans ce drapeau, l'interface conclurait à tort
   * « aucune appartenance » pendant la fenêtre intermédiaire.
   */
  tenantResolved: boolean;
  error: string | null;
}

interface AuthActions {
  _setSession: (s: Session | null) => void;
  _setLoading: (v: boolean) => void;
  _setError: (e: string | null) => void;
  _setTenantRole: (tenantId: string, role: AppRole) => void;
  _setTenantType: (type: TenantType) => void;
  _setWorkspaces: (w: Workspace[]) => void;
  _setTenantResolved: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  acceptInvitation: (token: string) => Promise<{ ok: boolean; error?: string }>;
  /** Bascule de workspace : change le périmètre RLS, puis recharge. */
  switchWorkspace: (tenantId: string) => Promise<{ error: string | null }>;
  /** Amorçage du premier administrateur d'un workspace (cf. migration 0057). */
  bootstrapTenant: (tenantId: string) => Promise<{ ok: boolean; error?: string }>;
}

// ── Store Zustand ─────────────────────────────────────────────────────

const DEMO_TENANT = '11111111-1111-1111-1111-111111111111';

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  user: null,
  tenantId: isBackendConfigured ? null : DEMO_TENANT,
  role: 'hr',
  tenantType: 'entreprise',
  workspaces: [],
  loading: isBackendConfigured, // si backend présent, on attend onAuthStateChange
  tenantResolved: !isBackendConfigured, // en démo, rien à résoudre
  error: null,

  _setSession: (s) => set({ session: s, user: s?.user ?? null }),
  _setLoading: (v) => set({ loading: v }),
  _setError: (e) => set({ error: e }),
  _setTenantRole: (tenantId, role) => set({ tenantId, role }),
  _setTenantType: (type) => set({ tenantType: type }),
  _setWorkspaces: (w) => set({ workspaces: w }),
  _setTenantResolved: (v) => set({ tenantResolved: v }),

  signIn: async (email, password) => {
    if (!supabase) return { error: null }; // demo
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) { set({ error: error.message }); return { error: error.message }; }
    return { error: null };
  },

  signOut: async () => {
    clearSessionContextCache();
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ session: null, user: null, tenantId: null, role: 'employee', tenantResolved: true });
  },

  sendMagicLink: async (email) => {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  resetPassword: async (email) => {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  acceptInvitation: async (token) => {
    if (!supabase) return { ok: false, error: 'Backend non configuré' };
    // .schema() obligatoire : le client n'a pas de schéma par défaut, donc un
    // .rpc() nu viserait public — où accept_invitation n'existe pas.
    const { data, error } = await supabase
      .schema('atlas_people')
      .rpc('accept_invitation', { p_token: token });
    if (error) return { ok: false, error: error.message };
    const res = data as { ok: boolean; error?: string; tenant_id?: string; role?: AppRole };
    if (res.ok && res.tenant_id && res.role) {
      get()._setTenantRole(res.tenant_id, res.role);
      void loadTenantType(res.tenant_id);
    }
    return res;
  },

  /**
   * Bascule de workspace.
   *
   * Le rechargement complet est délibéré : le périmètre RLS change côté
   * base, or les caches de requêtes en mémoire contiennent encore les
   * données de l'ancien workspace. Les invalider un par un serait une
   * source d'oublis silencieux — et un oubli signifierait afficher les
   * données d'un autre workspace.
   */
  switchWorkspace: async (tenantId) => {
    if (!supabase) return { error: 'Backend non configuré' };
    const target = get().workspaces.find((w) => w.tenantId === tenantId);
    const { error } = await supabase
      .schema('atlas_people')
      .rpc('set_active_tenant', { p_tenant_id: tenantId });
    if (error) return { error: humanizeWorkspaceError(error.message) };

    safeLocalStorage.set(ACTIVE_TENANT_KEY, tenantId);
    clearSessionContextCache();
    if (typeof window !== 'undefined') {
      window.location.assign(target ? PRODUCT_HOME_PATH[target.tenantType] : '/');
    }
    return { error: null };
  },

  /**
   * Amorçage du premier administrateur d'un workspace.
   * La RPC n'accepte que deux cas (cf. migration 0057) : l'appelant est le
   * propriétaire désigné, ou le workspace est vierge. Tout autre cas est
   * refusé côté base — cet appel ne peut donc pas servir à s'emparer d'un
   * workspace déjà administré.
   */
  bootstrapTenant: async (tenantId) => {
    if (!supabase) return { ok: false, error: 'Backend non configuré' };
    const { error } = await supabase
      .schema('atlas_people')
      .rpc('join_tenant_as_admin', { p_tenant_id: tenantId });
    if (error) return { ok: false, error: humanizeBootstrapError(error.message) };
    get()._setTenantRole(tenantId, 'admin');
    await loadTenantType(tenantId);
    return { ok: true };
  },
}));

// ── Amorçage : helpers ────────────────────────────────────────────────

/** Charge le mode de fonctionnement du tenant dans le store (best-effort). */
async function loadTenantType(tenantId: string): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase
    .schema('atlas_people')
    .from('tenants')
    .select('tenant_type')
    .eq('id', tenantId)
    .maybeSingle();
  if (data?.tenant_type) {
    useAuthStore.getState()._setTenantType(data.tenant_type as TenantType);
  }
}

const ACTIVE_TENANT_KEY  = 'atlas.people.active-tenant';
const PENDING_PRODUCT_KEY = 'atlas.people.pending-product';

/** Accueil propre à chaque mode — dupliqué de app/products pour éviter que
 *  la couche d'authentification dépende du catalogue commercial. */
const PRODUCT_HOME_PATH: Record<TenantType, string> = {
  entreprise: '/',
  cabinet_complet: '/clients',
  cabinet_paie: '/clients',
  cabinet_mixte: '/clients',
  cabinet_agence: '/travailleurs-places',
};

function humanizeWorkspaceError(message: string): string {
  if (message.includes('NOT_A_MEMBER')) return "Ce workspace ne vous est pas accessible.";
  if (message.includes('AUTH_REQUIRED')) return "Session expirée — reconnectez-vous.";
  if (message.includes('UNKNOWN_TENANT_TYPE')) return "Formule inconnue.";
  return message;
}

/**
 * Mémorise la formule demandée depuis la landing (`/login?produit=payroll`).
 * Consommée à la résolution du tenant : si le compte possède un workspace de
 * ce mode, c'est celui-là qui s'ouvre.
 */
export function requestProductWorkspace(tenantType: TenantType): void {
  safeLocalStorage.set(PENDING_PRODUCT_KEY, tenantType);
}

interface ResolvedMembership {
  tenantId: string;
  role: AppRole;
}

/** Liste les workspaces du compte (RPC my_workspaces, migration 0068). */
async function readWorkspaces(): Promise<Workspace[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema('atlas_people')
    .rpc('my_workspaces');
  if (error || !Array.isArray(data)) return [];
  return (data as Array<{ tenant_id: string; name: string; tenant_type: string; role: string; is_active: boolean }>)
    .map((r) => ({
      tenantId: r.tenant_id,
      name: r.name,
      tenantType: r.tenant_type as TenantType,
      role: r.role as AppRole,
      isActive: r.is_active,
    }))
    .map(({ isActive: _isActive, ...w }) => w);
}

/**
 * Choisit le workspace à ouvrir parmi ceux du compte :
 *   1. la formule demandée depuis la landing, si le compte la possède ;
 *   2. le dernier workspace ouvert ;
 *   3. le plus ancien, à défaut.
 */
/**
 * Workspace correspondant à une formule.
 *
 * Le bac à sable de démonstration passe en dernier : un compte peut posséder
 * à la fois « Atlas Démo SARL » et son vrai workspace du même mode, et c'est
 * le workspace réel qui doit s'ouvrir.
 */
export function findProductWorkspace(
  workspaces: Workspace[],
  tenantType: TenantType,
): Workspace | null {
  const matches = workspaces.filter((w) => w.tenantType === tenantType);
  if (matches.length === 0) return null;
  return matches.find((w) => w.tenantId !== DEMO_TENANT) ?? matches[0];
}

function pickWorkspace(workspaces: Workspace[]): Workspace | null {
  if (workspaces.length === 0) return null;

  const pending = safeLocalStorage.get(PENDING_PRODUCT_KEY);
  if (pending) {
    safeLocalStorage.remove(PENDING_PRODUCT_KEY);
    const wanted = findProductWorkspace(workspaces, pending as TenantType);
    if (wanted) return wanted;
  }

  const ordered = [...workspaces].sort(
    (a, b) => Number(a.tenantId === DEMO_TENANT) - Number(b.tenantId === DEMO_TENANT),
  );
  const last = safeLocalStorage.get(ACTIVE_TENANT_KEY);
  const known = last ? ordered.find((w) => w.tenantId === last) : undefined;
  return known ?? ordered[0];
}

/**
 * Crée le workspace du client courant s'il n'en a aucun (cf. migration 0065).
 * Un workspace par client : tenant neuf, appelant admin et propriétaire
 * fondateur, référentiels de paie clonés depuis le tenant modèle.
 *
 * Retourne null sans faire de bruit si la base refuse — notamment
 * INVITATION_PENDING, qui signifie que l'utilisateur est attendu dans un
 * workspace existant et doit passer par son jeton d'invitation.
 */
async function provisionWorkspace(): Promise<ResolvedMembership | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .schema('atlas_people')
    .rpc('provision_own_workspace', { p_name: null });
  if (error) return null;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { tenant_id: string; role: string }
    | undefined;
  if (!row?.tenant_id) return null;
  return { tenantId: row.tenant_id, role: row.role as AppRole };
}

/** Traduit les exceptions de la RPC d'amorçage en messages lisibles. */
function humanizeBootstrapError(message: string): string {
  if (message.includes('BOOTSTRAP_FORBIDDEN')) {
    return "Ce workspace a déjà un administrateur. Pour le rejoindre, demandez une invitation à son propriétaire.";
  }
  if (message.includes('TENANT_NOT_FOUND')) {
    return "Aucun workspace ne correspond à cet identifiant.";
  }
  if (message.includes('AUTH_REQUIRED')) {
    return "Session expirée — reconnectez-vous.";
  }
  return message;
}

export interface TenantBootstrapState {
  existsTenant: boolean;
  tenantName: string | null;
  /** Workspace vierge : aucun membre, aucun propriétaire. */
  claimable: boolean;
  /** L'utilisateur courant est le propriétaire déjà désigné. */
  isOwner: boolean;
}

/**
 * Interroge l'état d'amorçage d'un workspace donné.
 * Non listante par construction : exige l'UUID, ne renvoie jamais
 * l'inventaire des tenants (cf. tenant_bootstrap_state, migration 0057).
 */
export async function fetchTenantBootstrapState(
  tenantId: string,
): Promise<TenantBootstrapState | { error: string }> {
  if (!supabase) return { error: 'Backend non configuré' };
  const { data, error } = await supabase
    .schema('atlas_people')
    .rpc('tenant_bootstrap_state', { p_tenant_id: tenantId });
  if (error) return { error: error.message };
  const row = (Array.isArray(data) ? data[0] : data) as
    | { exists_tenant: boolean; tenant_name: string | null; claimable: boolean; is_owner: boolean }
    | undefined;
  if (!row) return { existsTenant: false, tenantName: null, claimable: false, isOwner: false };
  return {
    existsTenant: Boolean(row.exists_tenant),
    tenantName: row.tenant_name ?? null,
    claimable: Boolean(row.claimable),
    isOwner: Boolean(row.is_owner),
  };
}

// ── Initialisation Supabase auth listener ─────────────────────────────

let _initialized = false;

function initAuthListener() {
  if (_initialized || !supabase) return;
  _initialized = true;

  // Résout le tenant actif depuis tenant_memberships.
  // Positionne tenantResolved en sortie, quel que soit le résultat : c'est ce
  // drapeau — et non `loading` — qui autorise l'interface à conclure « cet
  // utilisateur n'a aucune appartenance ». `loading` passe à false avant que
  // cette résolution ait abouti.
  async function resolveTenant() {
    if (!supabase) return;
    try {
      let workspaces = await readWorkspaces();

      // Aucune appartenance : on provisionne le workspace du client.
      // Atlas People partage son projet d'authentification avec les autres
      // applications Atlas Studio ; rien ne peut donc créer l'appartenance à
      // l'inscription (cf. migration 0065). Elle se crée ici, à la première
      // ouverture de l'application — l'intention d'entrer dans Atlas People.
      // La RPC est idempotente et refuse si une invitation attend cette
      // adresse ; dans ce cas TenantBootstrapPage reprend la main.
      if (workspaces.length === 0 && isBackendConfigured) {
        const created = await provisionWorkspace();
        if (created) workspaces = await readWorkspaces();
      }

      const store = useAuthStore.getState();
      store._setWorkspaces(workspaces);

      const active = pickWorkspace(workspaces);
      if (active) {
        // Le workspace actif doit être connu de la BASE, pas seulement du
        // client : c'est lui qui borne current_tenant_ids(), donc tout ce
        // que la RLS laisse lire. Sans cet appel, un compte à plusieurs
        // workspaces verrait leurs données fusionnées.
        await supabase.schema('atlas_people')
          .rpc('set_active_tenant', { p_tenant_id: active.tenantId });
        safeLocalStorage.set(ACTIVE_TENANT_KEY, active.tenantId);
        clearSessionContextCache();

        store._setTenantRole(active.tenantId, active.role);
        store._setTenantType(active.tenantType);
      } else if (!isBackendConfigured) {
        // Demo mode uniquement — jamais sur un backend réel
        store._setTenantRole(DEMO_TENANT, 'hr');
      }
      // Backend configuré, aucun workspace et provisionnement refusé →
      // tenantId reste null, TenantBootstrapPage prend le relais.
    } finally {
      useAuthStore.getState()._setTenantResolved(true);
    }
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState()._setSession(session);
    useAuthStore.getState()._setLoading(false);
    if (session?.user) resolveTenant();
    else useAuthStore.getState()._setTenantResolved(true);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    clearSessionContextCache();
    useAuthStore.getState()._setSession(session);
    useAuthStore.getState()._setLoading(false);
    if (session?.user) {
      useAuthStore.getState()._setTenantResolved(false);
      resolveTenant();
    } else {
      if (!isBackendConfigured) {
        useAuthStore.getState()._setTenantRole(DEMO_TENANT, 'hr');
      }
      useAuthStore.getState()._setTenantResolved(true);
    }
  });
}

// Démarre l'écouteur dès l'import (singleton)
initAuthListener();

// ── Hook principal ────────────────────────────────────────────────────

export function useAuth() {
  const state = useAuthStore();

  const isAuthenticated = useMemo(
    () => !isBackendConfigured || state.session !== null,
    [state.session],
  );

  const isCabinet = state.tenantType === 'cabinet_complet' || state.tenantType === 'cabinet_paie' || state.tenantType === 'cabinet_mixte' || state.tenantType === 'cabinet_agence';

  return {
    ...state,
    isAuthenticated,
    isDemoMode: !isBackendConfigured,
    isAdmin: state.role === 'admin' || state.role === 'super_admin',
    isHR: state.role === 'hr' || state.role === 'admin' || state.role === 'super_admin',
    isManager: state.role === 'manager' || state.role === 'hr' || state.role === 'admin' || state.role === 'super_admin',
    isCabinet,
    isCabinetPaie: state.tenantType === 'cabinet_paie',
  };
}

// ── Hook d'effet pour initialiser (à appeler dans le composant root) ──

export function useAuthInit() {
  useEffect(() => {
    initAuthListener();
  }, []);
}
