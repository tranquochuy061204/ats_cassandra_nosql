import { api } from './api.jsx';
import { useAuth } from '../store/useAuth.jsx';
import { useAdminAuth } from '../store/useAdminAuth.jsx';
import toast from 'react-hot-toast';

export async function verifySession() {
  const { user, setUser, logout } = useAuth.getState();
  const { admin, setUser: setAdmin, logout: adminLogout } = useAdminAuth.getState();

  try {
    const res = await api.get('/me');
    const userData = res.data.user;

    // ✅ Nếu user hợp lệ → kiểm tra role để xác định loại
    if (['admin', 'recruiter', 'coordinator'].includes(userData.role)) {
      setAdmin(userData);
    } else {
      setUser(userData);
    }
  } catch (err) {
    // ❌ Session hết hạn → clear localStorage
    if (user) logout();
    if (admin) adminLogout();

    console.warn('Session expired, logging out...');
    console.log(err);
    toast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
}
