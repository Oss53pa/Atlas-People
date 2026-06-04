/**
 * ProtectedRoute — garde de route.
 * Si non authentifié → redirige vers /login en préservant l'URL cible.
 * En mode démo (pas de Supabase) → accès libre.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Rôle minimum requis. Défaut : tout utilisateur authentifié. */
  requireRole?: 'employee' | 'manager' | 'hr' | 'admin' | 'super_admin';
}

const ROLE_RANK: Record<string, number> = {
  employee: 0, manager: 1, hr: 2, admin: 3, super_admin: 4,
};

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, role, isDemoMode } = useAuth();
  const location = useLocation();

  // Mode démo → accès libre
  if (isDemoMode) return <>{children}</>;

  // Chargement session initiale
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-deep/30 border-t-amber-deep" />
      </div>
    );
  }

  // Non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rôle insuffisant
  if (requireRole && (ROLE_RANK[role] ?? 0) < (ROLE_RANK[requireRole] ?? 0)) {
    return <Navigate to="/accueil" replace />;
  }

  return <>{children}</>;
}
