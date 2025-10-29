import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '../../utils/api.jsx';
import { useAuth } from '../../store/useAuth.jsx';
import { Mail, Lock, LogIn, Loader2, Briefcase, ArrowRight, AlertCircle } from 'lucide-react';

const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/login', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast.success('Đăng nhập thành công 🎉');
      navigate('/');
    },
    onError: (error) => {
      const msg = error.response?.data?.error || 'Đăng nhập thất bại';
      toast.error(msg);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg mb-4">
            <Briefcase className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-gray-600">Đăng nhập để tiếp tục khám phá cơ hội nghề nghiệp</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
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

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`group w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all ${
                mutation.isPending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Đăng nhập
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

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-3">Chưa có tài khoản?</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all"
            >
              Đăng ký ngay
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Bằng việc đăng nhập, bạn đồng ý với{' '}
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
