import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api.jsx';
import { useAuth } from '../store/useAuth.jsx';
import toast from 'react-hot-toast';
import ApplicationForm from './ApplicationForm.jsx';
import DOMPurify from 'dompurify';
import {
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  TrendingUp,
  Calendar,
  FileText,
  Award,
  Gift,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Building2,
  Users,
  Target,
} from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.get(`/api/jobs/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
          <p className="text-gray-600 text-lg">Đang tải thông tin công việc...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">Không thể tải thông tin công việc</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Không tìm thấy công việc</p>
        </div>
      </div>
    );
  }

  let questions = [];
  try {
    if (typeof job.questions_json === 'string') {
      questions = JSON.parse(job.questions_json);
    } else if (Array.isArray(job.questions_json)) {
      questions = job.questions_json;
    }
  } catch (err) {
    console.warn('⚠️ Lỗi parse questions_json:', err);
  }

  const checkProfileComplete = async () => {
    try {
      const res = await api.get('/me');
      const profile = res.data.user;

      const ignoreKeys = ['user_id', 'created_at', 'password_hash', 'role', 'province_code', 'district_code', 'gender'];

      const missing = Object.entries(profile)
        .filter(([key, value]) => {
          if (ignoreKeys.includes(key)) return false;
          if (value === null || value === undefined) return true;
          if (typeof value === 'string' && value.trim() === '') return true;
          return false;
        })
        .map(([key]) => key);

      if (!profile.cv_url) {
        toast.error('Vui lòng tải CV lên hồ sơ trước khi ứng tuyển.');
        navigate('/profile');
        return false;
      }

      if (missing.length > 0) {
        toast.error('Vui lòng cập nhật đầy đủ thông tin hồ sơ trước khi ứng tuyển.');
        navigate('/profile');
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ Lỗi khi kiểm tra hồ sơ:', err);
      toast.error('Không thể xác thực tài khoản, vui lòng đăng nhập lại.');
      navigate('/login');
      return false;
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập trước khi ứng tuyển.');
      navigate('/login');
      return;
    }

    const profileOK = await checkProfileComplete();
    if (!profileOK) return;

    if (questions.length > 0) {
      setShowForm(true);
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/applications', { job_id: job.job_id, answers: [] });
      await api.post('/api/application-rounds', {
        job_id: job.job_id,
        candidate_id: user.user_id,
        round_name: 'CV Screening',
        round_order: 1,
        status: 'SCHEDULED',
        scheduled_at: null,
      });
      toast.success('Ứng tuyển thành công!');
    } catch (err) {
      console.error('❌ Lỗi khi ứng tuyển:', err);
      if (err.response?.status === 409) {
        toast.error('Bạn đã ứng tuyển công việc này rồi!');
      } else if (err.response?.status === 401) {
        toast.error('Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        toast.error('Không thể gửi ứng tuyển, vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const salary =
    job.salary_vnd_min && job.salary_vnd_max
      ? `${job.salary_vnd_min.toLocaleString()} - ${job.salary_vnd_max.toLocaleString()} VND`
      : job.salary_vnd_min
      ? `${job.salary_vnd_min.toLocaleString()}+ VND`
      : 'Thỏa thuận';

  const getWorkTypeColor = (type) => {
    const colors = {
      remote: 'bg-green-100 text-green-700 border-green-200',
      hybrid: 'bg-blue-100 text-blue-700 border-blue-200',
      onsite: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/jobs')}
          className="group flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
        >
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
          <span className="font-medium">Quay lại danh sách</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Briefcase className="text-white" size={32} />
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getWorkTypeColor(job.work_type)}`}
                >
                  {job.work_type}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">{job.title_vi}</h1>

              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  {job.employment_type}
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  {job.level}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid md:grid-cols-3 gap-6 px-8 py-8 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Địa điểm</p>
                <p className="font-semibold text-gray-800">{job.address_line}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Mức lương</p>
                <p className="font-semibold text-gray-800">{salary}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Kinh nghiệm</p>
                <p className="font-semibold text-gray-800">{job.exp_years_min || 0} năm</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Thử việc</p>
                <p className="font-semibold text-gray-800">{job.probation_months} tháng</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="text-pink-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Ngày đăng</p>
                <p className="font-semibold text-gray-800">{new Date(job.published_at).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="px-8 py-8">
            {/* Description */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Mô tả công việc</h2>
              </div>
              <div
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed pl-13"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(job.description_vi),
                }}
              />
            </section>

            {/* Requirements */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Target className="text-white" size={20} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Yêu cầu</h2>
              </div>
              <div
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed pl-13"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(job.requirements_vi),
                }}
              />
            </section>

            {/* Benefits */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Gift className="text-white" size={20} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Phúc lợi</h2>
              </div>
              <div
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed pl-13"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(job.benefits),
                }}
              />
            </section>
          </div>

          {/* Apply Button Section */}
          <div className="bg-gradient-to-br from-gray-50 to-purple-50 px-8 py-10 border-t border-gray-100">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Sẵn sàng gia nhập đội ngũ?</h3>
              <p className="text-gray-600 mb-6">
                Nếu bạn đáp ứng yêu cầu và đam mê với vị trí này, đừng ngần ngại ứng tuyển ngay!
              </p>

              <button
                onClick={handleApply}
                disabled={loading}
                className={`group inline-flex items-center gap-3 px-10 py-4 text-lg font-bold rounded-full transition-all shadow-xl ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-2xl hover:scale-105'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={24} />
                    Ứng tuyển ngay
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>

              {!user && (
                <p className="text-sm text-gray-500 mt-4">
                  Bạn cần <span className="text-purple-600 font-semibold">đăng nhập</span> để ứng tuyển
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showForm && <ApplicationForm job={job} onClose={() => setShowForm(false)} />}
    </div>
  );
}
