import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

// Requires a signed-in user. Remembers the intended page so login can send the user back.
// Session restore (GET /auth/me) is wired in phase 1. Until then, status stays 'guest'.
export default function ProtectedRoute({ children }) {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <div className="p-10 text-center text-cocoa">Memuat…</div>;
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children ?? <Outlet />;
}
