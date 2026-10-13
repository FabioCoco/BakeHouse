import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import ProtectedRoute from './ProtectedRoute.jsx';

// Requires role === 'admin'. Customers who reach an admin route see a 403 page instead of a redirect.
function AdminGate() {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== 'admin') {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}

export default function AdminRoute() {
  return (
    <ProtectedRoute>
      <AdminGate />
    </ProtectedRoute>
  );
}
