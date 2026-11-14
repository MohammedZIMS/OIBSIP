import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { Spinner } from '../components/ui/States.jsx';

// Guards are UX only: the server re-checks every request.
export function UserGuard() {
  const { who, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Spinner label="Checking your session" />;
  if (!who) return <Navigate to={`/login?returnTo=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (!who.isVerified) return <Navigate to="/verify-email" state={{ email: who.email }} replace />;
  return <Outlet />;
}

export function PublicOnly() {
  const { who, ready } = useAuth();
  if (!ready) return <Spinner />;
  return who?.isVerified ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export function AdminGuard() {
  const { who, ready } = useAdminAuth();
  if (!ready) return <div data-theme="dark" className="min-h-screen bg-pan"><Spinner label="Checking your session" /></div>;
  return who ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
