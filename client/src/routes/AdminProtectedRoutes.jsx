import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../store/useAdminAuth.jsx';

export default function AdminProtectedRoute() {
  const { admin } = useAdminAuth();

  if (!admin) return <Navigate to="/admin/login" />;
  if (!['admin', 'recruiter', 'coordinator'].includes(admin.role)) {
    return <Navigate to="/admin/login" />;
  }

  return <Outlet />;
}
