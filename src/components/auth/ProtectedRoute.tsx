/**
 * ProtectedRoute — garde de route.
 * Non authentifié → /login.
 * Rôle insuffisant → /accueil.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'employee' | 'manager' | 'hr' | 'admin' | 'super_admin';
}

const ROLE_RANK: Record<string, number> = {
  employee: 0, manager: 1, hr: 2, admin: 3, super_admin: 4,
};

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-deep/30 border-t-amber-deep" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && (ROLE_RANK[role] ?? 0) < (ROLE_RANK[requireRole] ?? 0)) {
    return <Navigate to="/accueil" replace />;
  }

  return <>{children}</>;
}
