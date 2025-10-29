import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar cố định */}
      <AdminSidebar />

      {/* Khu vực nội dung chính */}
      <main className="flex-1 ml-64 h-screen overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
