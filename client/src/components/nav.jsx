import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../store/useAuth.jsx';
import { api } from '../utils/api.jsx';
import toast from 'react-hot-toast';

export default function Nav() {
  const { user, logout } = useAuth();

  console.log('User in Nav:', user);

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
      logout();
      toast.success('Đã đăng xuất');
    } catch (err) {
      console.error(err);
      toast.error('Đăng xuất thất bại');
    }
  };

  return (
    <nav className="flex justify-between items-center bg-gray-900 text-white p-4 shadow-md">
      <div className="text-xl font-bold">
        <Link to="/">NoSQL App</Link>
      </div>

      <div className="flex gap-6 items-center">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'text-blue-400 font-semibold' : 'text-gray-300')}>
          Home
        </NavLink>
        <NavLink to="/jobs" className={({ isActive }) => (isActive ? 'text-blue-400 font-semibold' : 'text-gray-300')}>
          Jobs
        </NavLink>
        <NavLink
          to="/applications"
          className={({ isActive }) => (isActive ? 'text-blue-400 font-semibold' : 'text-gray-300')}
        >
          Applications
        </NavLink>

        {/* ✅ Nếu đã đăng nhập */}
        {user ? (
          <>
            <Link to="/profile" className="text-blue-400 hover:underline text-sm font-medium transition">
              Xin chào, {user.full_name || user.user_email}
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
            >
              Logout
            </button>
          </>
        ) : (
          // ❌ Nếu chưa đăng nhập
          <>
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? 'text-blue-400 font-semibold' : 'text-gray-300')}
            >
              Login
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
