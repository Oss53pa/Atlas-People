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
export { isBackendConfigured };

// ── Types ────────────────────────────────────────────────────────────

export type AppRole = 'super_admin' | 'admin' | 'hr' | 'manager' | 'employee';

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** ID du tenant actif (UUID). Null tant que non résolu. */
  tenantId: string | null;
  role: AppRole;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  _setSession: (s: Session | null) => void;
  _setLoading: (v: boolean) => void;
  _setError: (e: string | null) => void;
  _setTenantRole: (tenantId: string, role: AppRole) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  acceptInvitation: (token: string) => Promise<{ ok: boolean; error?: string }>;
}

// ── Store Zustand ─────────────────────────────────────────────────────

const DEMO_TENANT = '11111111-1111-1111-1111-111111111111';

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  user: null,
  tenantId: isBackendConfigured ? null : DEMO_TENANT,
  role: 'hr',
  loading: isBackendConfigured, // si backend présent, on attend onAuthStateChange
  error: null,

  _setSession: (s) => set({ session: s, user: s?.user ?? null }),
  _setLoading: (v) => set({ loading: v }),
  _setError: (e) => set({ error: e }),
  _setTenantRole: (tenantId, role) => set({ tenantId, role }),

  signIn: async (email, password) => {
    if (!supabase) return { error: null }; // demo
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) { set({ error: error.message }); return { error: error.message }; }
    return { error: null };
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ session: null, user: null, tenantId: null, role: 'employee' });
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
    const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
    if (error) return { ok: false, error: error.message };
    const res = data as { ok: boolean; error?: string; tenant_id?: string; role?: AppRole };
    if (res.ok && res.tenant_id && res.role) {
      get()._setTenantRole(res.tenant_id, res.role);
    }
    return res;
  },
}));

// ── Initialisation Supabase auth listener ─────────────────────────────

let _initialized = false;

function initAuthListener() {
  if (_initialized || !supabase) return;
  _initialized = true;

  // Résout le tenant actif depuis tenant_memberships
  async function resolveTenant(userId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .schema('atlas_people')
      .from('tenant_memberships')
      .select('tenant_id, role')
      .eq('user_id', userId)
      .order('added_at', { ascending: true })
      .limit(1)
      .single();

    if (data) {
      useAuthStore.getState()._setTenantRole(data.tenant_id as string, data.role as AppRole);
    } else {
      // Pas d'appartenance → fallback démo
      useAuthStore.getState()._setTenantRole(DEMO_TENANT, 'hr');
    }
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState()._setSession(session);
    useAuthStore.getState()._setLoading(false);
    if (session?.user) resolveTenant(session.user.id);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState()._setSession(session);
    useAuthStore.getState()._setLoading(false);
    if (session?.user) {
      resolveTenant(session.user.id);
    } else {
      useAuthStore.getState()._setTenantRole(DEMO_TENANT, 'hr');
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

  return {
    ...state,
    isAuthenticated,
    isDemoMode: !isBackendConfigured,
    isAdmin: state.role === 'admin' || state.role === 'super_admin',
    isHR: state.role === 'hr' || state.role === 'admin' || state.role === 'super_admin',
    isManager: state.role === 'manager' || state.role === 'hr' || state.role === 'admin' || state.role === 'super_admin',
  };
}

// ── Hook d'effet pour initialiser (à appeler dans le composant root) ──

export function useAuthInit() {
  useEffect(() => {
    initAuthListener();
  }, []);
}
