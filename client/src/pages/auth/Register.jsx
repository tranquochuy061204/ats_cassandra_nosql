import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../utils/api.jsx';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader2, UserPlus, ArrowRight, Briefcase, AlertCircle, Users } from 'lucide-react';

const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Tên quá ngắn'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ≥ 6 ký tự'),
  role: z.enum(['candidate', 'recruiter']).default('candidate'),
  gender: z.enum(['male', 'female', 'other']).default('other'),
});

export default function Register() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/api/register', data);
      toast.success('🎉 Đăng ký thành công!');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg mb-4">
            <Briefcase className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Tạo tài khoản mới
          </h1>
          <p className="text-gray-600">Bắt đầu hành trình sự nghiệp của bạn ngay hôm nay</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User size={16} />
                Họ và tên
              </label>
              <div className="relative">
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className={`w-full px-4 py-3 pl-11 border-2 rounded-xl transition-all outline-none ${
                    errors.fullName
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                  }`}
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              {errors.fullName && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle size={14} />
                  <span>{errors.fullName.message}</span>
                </div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail size={16} />
                Email
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  placeholder="your.email@example.com"
                  className={`w-full px-4 py-3 pl-11 border-2 rounded-xl transition-all outline-none ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                  }`}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle size={14} />
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Lock size={16} />
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pl-11 border-2 rounded-xl transition-all outline-none ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                  }`}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              {errors.password && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle size={14} />
                  <span>{errors.password.message}</span>
                </div>
              )}
            </div>

            {/* Gender Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users size={16} />
                Giới tính
              </label>
              <div className="relative">
                <select
                  {...register('gender')}
                  className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                <Users
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={18}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Hidden Role Field (default: candidate) */}
            <input {...register('role')} type="hidden" value="candidate" />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all mt-6 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Đăng ký
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">hoặc</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-3">Đã có tài khoản?</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all"
            >
              Đăng nhập ngay
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Bằng việc đăng ký, bạn đồng ý với{' '}
            <Link to="/terms" className="text-purple-600 hover:underline">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link to="/privacy" className="text-purple-600 hover:underline">
              Chính sách bảo mật
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
