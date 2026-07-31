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
import type { TenantType } from '../store/useAppStore';
export { isBackendConfigured };

// ── Types ────────────────────────────────────────────────────────────

export type AppRole = 'super_admin' | 'admin' | 'hr' | 'manager' | 'employee';

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** ID du tenant actif (UUID). Null tant que non résolu. */
  tenantId: string | null;
  role: AppRole;
  /** Mode de fonctionnement du workspace. */
  tenantType: TenantType;
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
  _setTenantResolved: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  acceptInvitation: (token: string) => Promise<{ ok: boolean; error?: string }>;
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
  loading: isBackendConfigured, // si backend présent, on attend onAuthStateChange
  tenantResolved: !isBackendConfigured, // en démo, rien à résoudre
  error: null,

  _setSession: (s) => set({ session: s, user: s?.user ?? null }),
  _setLoading: (v) => set({ loading: v }),
  _setError: (e) => set({ error: e }),
  _setTenantRole: (tenantId, role) => set({ tenantId, role }),
  _setTenantType: (type) => set({ tenantType: type }),
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
  async function resolveTenant(userId: string) {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .schema('atlas_people')
        .from('tenant_memberships')
        .select('tenant_id, role')
        .eq('user_id', userId)
        .order('added_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        useAuthStore.getState()._setTenantRole(data.tenant_id as string, data.role as AppRole);
        // Charge le mode de fonctionnement du tenant
        const { data: tenantRow } = await supabase
          .schema('atlas_people')
          .from('tenants')
          .select('tenant_type')
          .eq('id', data.tenant_id)
          .maybeSingle();
        if (tenantRow?.tenant_type) {
          useAuthStore.getState()._setTenantType(tenantRow.tenant_type as TenantType);
        }
      } else if (!isBackendConfigured) {
        // Demo mode uniquement — jamais sur un backend réel
        useAuthStore.getState()._setTenantRole(DEMO_TENANT, 'hr');
      }
      // Backend configuré + pas de membership → tenantId reste null, et
      // TenantBootstrapPage prend le relais (invitation ou amorçage).
    } finally {
      useAuthStore.getState()._setTenantResolved(true);
    }
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState()._setSession(session);
    useAuthStore.getState()._setLoading(false);
    if (session?.user) resolveTenant(session.user.id);
    else useAuthStore.getState()._setTenantResolved(true);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    clearSessionContextCache();
    useAuthStore.getState()._setSession(session);
    useAuthStore.getState()._setLoading(false);
    if (session?.user) {
      useAuthStore.getState()._setTenantResolved(false);
      resolveTenant(session.user.id);
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
