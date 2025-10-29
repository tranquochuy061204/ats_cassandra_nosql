import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.jsx';
import { toast } from 'react-hot-toast';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: '',
    user_email: '',
    password: '',
    role: 'candidate',
  });

  /* ==================== Fetch Users ==================== */
  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/api/admin/users');
      return res.data;
    },
  });

  /* ==================== Create User ==================== */
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/admin/users', form);
      return res.data;
    },
    onSuccess: () => {
      toast.success('✅ Thêm user thành công');
      setForm({ full_name: '', user_email: '', password: '', role: 'candidate' });
      queryClient.invalidateQueries(['adminUsers']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo user');
    },
  });

  /* ==================== Delete User ==================== */
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/api/admin/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('🗑️ Xoá user thành công');
      queryClient.invalidateQueries(['adminUsers']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Không thể xoá user');
    },
  });

  /* ==================== UI ==================== */
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">👤 Quản lý Users</h2>

      {/* Form thêm user */}
      <div className="bg-white border p-4 rounded-lg shadow-sm space-y-3">
        <input
          placeholder="Họ và tên"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="border rounded-md p-2 w-full text-sm"
        />
        <input
          placeholder="Email"
          type="email"
          value={form.user_email}
          onChange={(e) => setForm({ ...form, user_email: e.target.value })}
          className="border rounded-md p-2 w-full text-sm"
        />
        <input
          placeholder="Mật khẩu"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border rounded-md p-2 w-full text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border rounded-md p-2 w-full text-sm"
        >
          <option value="candidate">Ứng viên</option>
          <option value="recruiter">Nhà tuyển dụng</option>
          <option value="coordinator">Điều phối viên</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
          Thêm User
        </button>
      </div>

      {/* Danh sách Users */}
      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Tên</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Vai trò</th>
              <th className="p-2 border">Ngày tạo</th>
              <th className="p-2 border w-20">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center p-3">
                  <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                </td>
              </tr>
            ) : users?.length ? (
              users.map((u) => (
                <tr key={u.user_id} className="hover:bg-gray-50">
                  <td className="border p-2">{u.full_name}</td>
                  <td className="border p-2">{u.user_email}</td>
                  <td className="border p-2">{u.role}</td>
                  <td className="border p-2">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`Xóa ${u.full_name}?`)) deleteMutation.mutate(u.user_id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-3 text-gray-500 italic">
                  Không có người dùng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
