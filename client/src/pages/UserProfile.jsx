import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { api } from '../utils/api.jsx';
import { useAuth } from '../store/useAuth.jsx';
import Profile from '../components/Profile.jsx';

export default function UserProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    gender: '',
    address: '',
    province_code: '',
    district_code: '',
    cv_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);

  // 🧠 Load thông tin user + danh sách tỉnh
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [resUser, resProv] = await Promise.all([
          api.get(`/api/users/${user.user_id}`),
          api.get('/api/provinces'),
        ]);
        setForm(resUser.data);
        setProvinces(resProv.data);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải hồ sơ hoặc danh sách tỉnh');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // 🧠 Khi chọn tỉnh → load quận/huyện tương ứng
  useEffect(() => {
    if (!form.province_code) {
      setDistricts([]);
      return;
    }
    (async () => {
      try {
        const res = await api.get('/api/districts', {
          params: { province_code: form.province_code },
        });
        setDistricts(res.data);
      } catch (err) {
        toast.error('Không thể tải danh sách quận/huyện', err);
      }
    })();
  }, [form.province_code]);

  if (!user) return <div className="text-center mt-10">Vui lòng đăng nhập để xem hồ sơ</div>;
  if (loading) return <div className="text-center mt-10">Đang tải hồ sơ...</div>;

  // 🧠 Cập nhật thông tin
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/api/users/${user.user_id}`, form);
      setUser({ ...user, ...res.data });
      toast.success('Cập nhật thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật');
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-6 rounded mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-center">Hồ sơ cá nhân</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Tên */}
        <div>
          <label className="block text-sm font-medium mb-1">Họ và tên</label>
          <input
            type="text"
            value={form.full_name || ''}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="border px-3 py-2 w-full rounded"
          />
        </div>

        {/* Giới tính */}
        <div>
          <label className="block text-sm font-medium mb-1">Giới tính</label>
          <select
            value={form.gender || ''}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="border px-3 py-2 w-full rounded"
          >
            <option value="">-- Chọn --</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        {/* Địa chỉ chi tiết */}
        <div>
          <label className="block text-sm font-medium mb-1">Địa chỉ chi tiết</label>
          <input
            type="text"
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="border px-3 py-2 w-full rounded"
          />
        </div>

        {/* Tỉnh / Thành phố */}
        <div>
          <label className="block text-sm font-medium mb-1">Tỉnh / Thành phố</label>
          <select
            value={form.province_code || ''}
            onChange={(e) => setForm({ ...form, province_code: e.target.value, district_code: '' })}
            className="border px-3 py-2 w-full rounded"
          >
            <option value="">-- Chọn tỉnh/thành --</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quận / Huyện */}
        <div>
          <label className="block text-sm font-medium mb-1">Quận / Huyện</label>
          <select
            value={form.district_code || ''}
            onChange={(e) => setForm({ ...form, district_code: e.target.value })}
            className="border px-3 py-2 w-full rounded"
            disabled={!form.province_code}
          >
            <option value="">-- Chọn quận/huyện --</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <Profile />

        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
}
