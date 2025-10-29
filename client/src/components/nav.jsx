import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../store/useAuth.jsx';
import { api } from '../utils/api.jsx';
import toast from 'react-hot-toast';
import { Briefcase, Home, User, LogOut, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Nav() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  console.log('User in Nav:', user);

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
      logout();
      toast.success('Đã đăng xuất');
      setMobileMenuOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Đăng xuất thất bại');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Briefcase className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              JobPortal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Home size={18} />
              <span>Trang chủ</span>
            </NavLink>

            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Briefcase size={18} />
              <span>Việc làm</span>
            </NavLink>
          </div>

          {/* User Section - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* User Profile Link */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <User className="text-white" size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Xin chào,</p>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                      {user.full_name || user.user_email}
                    </p>
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-all hover:shadow-md"
                >
                  <LogOut size={18} />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                {/* Login Button */}
                <NavLink
                  to="/login"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105"
                >
                  <LogIn size={18} />
                  <span>Đăng nhập</span>
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-slide-down">
            <div className="flex flex-col gap-2">
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Home size={20} />
                <span>Trang chủ</span>
              </NavLink>

              <NavLink
                to="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Briefcase size={20} />
                <span>Việc làm</span>
              </NavLink>

              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <User className="text-white" size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Xin chào,</p>
                      <p className="text-sm font-semibold text-gray-800">{user.full_name || user.user_email}</p>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-all"
                  >
                    <LogOut size={20} />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold justify-center"
                >
                  <LogIn size={20} />
                  <span>Đăng nhập</span>
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
}
