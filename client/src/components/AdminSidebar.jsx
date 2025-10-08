import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Briefcase, Users, FileText, BarChart2, Settings, Calendar } from 'lucide-react';

import { useAdminAuth } from '../store/useAdminAuth.jsx';
import toast from 'react-hot-toast';

export default function AdminSidebar() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/admin/login');
  };

  const menuItems = [
    { to: '/admin/dashboard', icon: <BarChart2 size={18} />, label: 'Tổng quan' },
    { to: '/admin/jobs', icon: <Briefcase size={18} />, label: 'Việc làm' },
    { to: '/admin/applications', icon: <FileText size={18} />, label: 'Ứng tuyển' },
    { to: '/admin/users', icon: <Users size={18} />, label: 'Người dùng' },
    { to: '/admin/interviews', icon: <Calendar size={18} />, label: 'Phỏng vấn' },
    { to: '/admin/analytics', icon: <BarChart2 size={18} />, label: 'Phân tích' },
    { to: '/admin/settings', icon: <Settings size={18} />, label: 'Cài đặt' },
  ];

  return (
    <aside className="w-64 h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 text-lg font-bold border-b border-gray-700">ATS Admin</div>

      {/* Menu */}
      <nav className="flex-1 mt-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-gray-800 transition ${
                isActive ? 'bg-gray-800 text-blue-400 font-medium' : 'text-gray-300'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{admin?.full_name || 'Admin'}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 transition text-sm"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
