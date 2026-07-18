/**
 * ProtectedRoute — garde de route.
 * Non authentifié / mode démo → portail Atlas Studio (seul point d'entrée autorisé).
 * Rôle insuffisant → /accueil.
 */
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'employee' | 'manager' | 'hr' | 'admin' | 'super_admin';
}

const ROLE_RANK: Record<string, number> = {
  employee: 0, manager: 1, hr: 2, admin: 3, super_admin: 4,
};

const PORTAL_URL = 'https://atlas-studio.org/portal';

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, role, isDemoMode } = useAuth();
  const shouldRedirect = !loading && (isDemoMode || !isAuthenticated);

  useEffect(() => {
    if (shouldRedirect) window.location.replace(PORTAL_URL);
  }, [shouldRedirect]);

  if (loading || shouldRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-deep/30 border-t-amber-deep" />
      </div>
    );
  }

  if (requireRole && (ROLE_RANK[role] ?? 0) < (ROLE_RANK[requireRole] ?? 0)) {
    return <Navigate to="/accueil" replace />;
  }

  return <>{children}</>;
}
