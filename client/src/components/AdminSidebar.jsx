import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Briefcase,
  Users,
  FileText,
  BarChart2,
  Settings,
  Calendar,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FolderKanban,
  FileClock,
} from 'lucide-react';
import { useAdminAuth } from '../store/useAdminAuth.jsx';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function AdminSidebar() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 mở sẵn cả 2 nhóm chính
  const [openMenus, setOpenMenus] = useState({ applications: true, interviews: true });

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/admin/login');
  };

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isActiveGroup = (prefix) => location.pathname.startsWith(prefix);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-gray-100 flex flex-col z-50">
      {/* Header */}
      <div className="px-5 py-4 text-lg font-bold border-b border-gray-700">ATS Admin</div>

      {/* Menu */}
      <nav className="flex-1 mt-2 overflow-y-auto">
        {/* Tổng quan */}
        <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={18} />} label="Tổng quan" />
        {/* Việc làm */}
        <NavItem to="/admin/jobs" icon={<Briefcase size={18} />} label="Việc làm" />
        {/* Nhóm Ứng tuyển */}
        {admin?.role === 'admin' && <NavItem to="/admin/shortlist" icon={<Users size={18} />} label="Shortlist" />}
        {admin?.role === 'recruiter' && (
          <div>
            <button
              onClick={() => toggleMenu('applications')}
              className={`w-full flex items-center justify-between px-5 py-2.5 text-sm hover:bg-gray-800 transition ${
                isActiveGroup('/admin/applications') ? 'bg-gray-800 text-blue-400 font-medium' : 'text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={18} />
                <span>Ứng tuyển</span>
              </div>
              {openMenus.applications ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {openMenus.applications && (
              <div className="ml-8 mt-1">
                <SubNavItem to="/admin/applications/recent" label="Đơn mới" icon={<FileClock size={16} />} />
                <SubNavItem to="/admin/applications/by-job" label="Theo công việc" icon={<FolderKanban size={16} />} />
              </div>
            )}
          </div>
        )}
        {/* Người dùng */}
        <NavItem to="/admin/users" icon={<Users size={18} />} label="Người dùng" />
        {/* Nhóm Phỏng vấn */}
        <div>
          <button
            onClick={() => toggleMenu('interviews')}
            className={`w-full flex items-center justify-between px-5 py-2.5 text-sm hover:bg-gray-800 transition ${
              isActiveGroup('/admin/interviews') || isActiveGroup('/admin/schedule')
                ? 'bg-gray-800 text-blue-400 font-medium'
                : 'text-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar size={18} />
              <span>Phỏng vấn</span>
            </div>
            {openMenus.interviews ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {openMenus.interviews && (
            <div className="ml-8 mt-1">
              <SubNavItem to="/admin/interviews" label="Danh sách lịch" icon={<FileClock size={16} />} />
              {admin?.role === 'coordinator' && (
                <SubNavItem to="/admin/schedule" label="Lên lịch" icon={<CalendarPlus size={16} />} />
              )}
            </div>
          )}
        </div>
        {/* Phân tích */}
        <NavItem to="/admin/analytics" icon={<BarChart2 size={18} />} label="Phân tích" />
        {/* Cài đặt */}
        <NavItem to="/admin/settings" icon={<Settings size={18} />} label="Cài đặt" />
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

/* ----------------------
 * Component phụ NavItem
 * -------------------- */
function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-gray-800 transition ${
          isActive ? 'bg-gray-800 text-blue-400 font-medium' : 'text-gray-300'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

/* ----------------------
 * Component phụ SubNavItem
 * -------------------- */
function SubNavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-gray-800 transition ${
          isActive ? 'bg-gray-800 text-blue-400 font-medium' : 'text-gray-300'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
