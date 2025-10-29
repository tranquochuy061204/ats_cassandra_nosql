import { api } from './api.jsx';
import { useAuth } from '../store/useAuth.jsx';
import { useAdminAuth } from '../store/useAdminAuth.jsx';

export async function verifySession() {
  const { setUser, logout } = useAuth.getState();
  const { setAdmin, logout: adminLogout } = useAdminAuth.getState();

  try {
    // thử /me (user)
    const res = await api.get('/me');
    const u = res.data.user;
    if (u.role === 'admin' || u.role === 'recruiter' || u.role === 'coordinator') {
      return;
    }
    setUser(u);
  } catch {
    logout();
  }

  try {
    // thử /api/admin/me
    const res = await api.get('/api/admin/me');
    setAdmin(res.data.user);
  } catch {
    adminLogout();
  }
}
