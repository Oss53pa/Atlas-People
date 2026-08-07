/**
 * ProtectedRoute — garde de route.
 * Non authentifié → /login.
 * Authentifié sans appartenance → écran d'amorçage (invitation ou premier admin).
 * Rôle insuffisant → /accueil.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { TenantBootstrapPage } from '../../pages/TenantBootstrapPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'employee' | 'manager' | 'hr' | 'admin' | 'super_admin';
}

const ROLE_RANK: Record<string, number> = {
  employee: 0, manager: 1, hr: 2, admin: 3, super_admin: 4,
};

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-canvas">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-deep/30 border-t-amber-deep" />
  </div>
);

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, role, tenantId, tenantResolved } = useAuth();

  if (loading) return <Spinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // L'appartenance est encore en cours de résolution : `loading` retombe à
  // false avant elle, donc on attend explicitement plutôt que de conclure.
  if (!tenantResolved) return <Spinner />;

  // Authentifié, résolution faite, aucune appartenance → amorçage.
  // Sans ce garde-fou l'application se chargeait avec tenantId = null : toute
  // écriture levait IdentityUnresolvedError et les lectures retombaient sur le
  // tenant de démonstration via le repli de current_tenant_ids().
  if (!tenantId) {
    return <TenantBootstrapPage />;
  }

  if (requireRole && (ROLE_RANK[role] ?? 0) < (ROLE_RANK[requireRole] ?? 0)) {
    return <Navigate to="/accueil" replace />;
  }

  return <>{children}</>;
}
