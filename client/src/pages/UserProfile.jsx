import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.jsx';
import { useAuth } from '../store/useAuth.jsx';
import Profile from '../components/Profile.jsx';
import {
  User,
  Briefcase,
  MapPin,
  Save,
  Calendar,
  DollarSign,
  Building2,
  Mail,
  Phone,
  Home as HomeIcon,
  Loader2,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function UserProfile() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [provinces, setProvinces] = useState([]);

  const [form, setForm] = useState({
    full_name: '',
    gender: '',
    address: '',
    province_code: '',
    district_code: '',
    cv_url: '',
  });
  const [districts, setDistricts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const navigate = useNavigate();

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
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!form.province_code) return setDistricts([]);
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

  useEffect(() => {
    if (activeTab !== 'applied' || !user) return;
    (async () => {
      try {
        setLoadingApps(true);
        const res = await api.get('/api/applications', {
          params: { candidate_id: user.user_id },
        });
        const apps = res.data;

        const appsWithJob = await Promise.all(
          apps.map(async (app) => {
            try {
              const jobRes = await api.get(`/api/jobs/${app.job_id}`);
              return { ...app, job: jobRes.data };
            } catch {
              return { ...app, job: null };
            }
          })
        );

        setApplications(appsWithJob);
      } catch (err) {
        console.error('❌ Lỗi khi tải danh sách ứng tuyển:', err);
        toast.error('Không thể tải danh sách ứng tuyển');
      } finally {
        setLoadingApps(false);
      }
    })();
  }, [activeTab, user]);

  const getProvinceName = (code) => {
    const found = provinces.find((p) => p.code === code);
    return found ? found.name : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.patch(`/api/users/${user.user_id}`, form);
      setUser({ ...user, ...res.data });
      setForm(res.data);
      toast.success('Cập nhật thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật');
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        label: 'Đang xử lý',
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: 'Đã từ chối',
      },
      pending: {
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        label: 'Chờ xử lý',
      },
    };
    return configs[status] || configs.pending;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-gray-600 mb-6">Vui lòng đăng nhập để xem hồ sơ cá nhân</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
          <p className="text-gray-600 text-lg">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Hồ sơ của tôi
          </h1>
          <p className="text-gray-600">Quản lý thông tin cá nhân và theo dõi các đơn ứng tuyển</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
              {/* User Avatar */}
              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="text-white" size={40} />
                </div>
                <h3 className="font-bold text-lg text-gray-800">{user.full_name || 'Người dùng'}</h3>
                <p className="text-sm text-gray-500">{user.user_email}</p>
              </div>

              {/* Navigation */}
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    activeTab === 'personal'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <User size={20} />
                  <span>Thông tin cá nhân</span>
                </button>
                <button
                  onClick={() => setActiveTab('applied')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    activeTab === 'applied'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Briefcase size={20} />
                  <span>Đơn ứng tuyển</span>
                  {applications.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      {applications.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {activeTab === 'personal' && (
                <div>
                  {/* Section Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <User className="text-white" size={20} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Thông tin cá nhân</h2>
                        <p className="text-white/80 text-sm">Cập nhật thông tin để hoàn thiện hồ sơ</p>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      {/* Full Name */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <User size={16} />
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          value={form.full_name || ''}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                          placeholder="Nhập họ và tên"
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <User size={16} />
                          Giới tính
                        </label>
                        <select
                          value={form.gender || ''}
                          onChange={(e) => setForm({ ...form, gender: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        >
                          <option value="">-- Chọn giới tính --</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <HomeIcon size={16} />
                          Địa chỉ chi tiết
                        </label>
                        <input
                          type="text"
                          value={form.address || ''}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                          placeholder="Số nhà, tên đường..."
                        />
                      </div>

                      {/* Province */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Building2 size={16} />
                          Tỉnh / Thành phố
                        </label>
                        <select
                          value={form.province_code || ''}
                          onChange={(e) => setForm({ ...form, province_code: e.target.value, district_code: '' })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        >
                          <option value="">-- Chọn tỉnh/thành --</option>
                          {provinces.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* District */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <MapPin size={16} />
                          Quận / Huyện
                        </label>
                        <select
                          value={form.district_code || ''}
                          onChange={(e) => setForm({ ...form, district_code: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
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
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all ${
                          savingProfile
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-105'
                        }`}
                      >
                        {savingProfile ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save size={20} />
                            Lưu thay đổi
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Profile Component */}
                  <div className="px-8 pb-8">
                    <Profile />
                  </div>
                </div>
              )}

              {activeTab === 'applied' && (
                <div>
                  {/* Section Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Briefcase className="text-white" size={20} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Đơn ứng tuyển của tôi</h2>
                        <p className="text-white/80 text-sm">{applications.length} đơn ứng tuyển</p>
                      </div>
                    </div>
                  </div>

                  {/* Applications List */}
                  <div className="p-8">
                    {loadingApps ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
                        <p className="text-gray-600">Đang tải danh sách...</p>
                      </div>
                    ) : applications.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                          <Briefcase className="w-10 h-10 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có đơn ứng tuyển</h3>
                        <p className="text-gray-600 mb-6">Hãy khám phá các cơ hội việc làm tuyệt vời!</p>
                        <button
                          onClick={() => navigate('/jobs')}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                        >
                          Xem việc làm
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {applications.map((app) => {
                          const job = app.job || {};
                          const salary =
                            job.salary_vnd_min && job.salary_vnd_max
                              ? `${job.salary_vnd_min.toLocaleString()} - ${job.salary_vnd_max.toLocaleString()} ₫`
                              : 'Thỏa thuận';
                          const provinceName = getProvinceName(job.province_code);
                          const statusConfig = getStatusConfig(app.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <div
                              key={`${app.job_id}-${app.applied_at}`}
                              className="group border-2 border-gray-100 rounded-2xl p-6 hover:border-purple-200 hover:shadow-xl transition-all"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors mb-2">
                                    {job.title_vi || 'Công việc chưa xác định'}
                                  </h3>
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <MapPin size={14} />
                                      {job.address_line || 'Không rõ'}
                                    </span>
                                    {provinceName && (
                                      <span className="flex items-center gap-1">
                                        <Building2 size={14} />
                                        {provinceName}
                                      </span>
                                    )}
                                    {job.deadline && (
                                      <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        Hạn: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${statusConfig.bg} ${statusConfig.border}`}
                                >
                                  <StatusIcon size={16} className={statusConfig.color} />
                                  <span className={`text-sm font-semibold ${statusConfig.color}`}>
                                    {statusConfig.label}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Calendar size={14} />
                                    Ứng tuyển: {new Date(app.applied_at).toLocaleDateString('vi-VN')}
                                  </p>
                                  <p className="text-lg font-bold text-green-600 flex items-center gap-2">
                                    <DollarSign size={18} />
                                    {salary}
                                  </p>
                                </div>
                                <button
                                  onClick={() => navigate(`/jobs/${app.job_id}`)}
                                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105"
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
