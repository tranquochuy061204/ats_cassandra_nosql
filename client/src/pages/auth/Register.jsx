import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../utils/api.jsx';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

// ✅ Schema validate bằng zod
const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Tên quá ngắn'),
  email: z.email('Email không hợp lệ'),
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
    <div className="max-w-sm mx-auto mt-20 bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-4 text-center">Đăng ký tài khoản</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <input {...register('fullName')} type="text" placeholder="Họ và tên" className="border rounded px-3 py-2" />
        {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}

        <input {...register('email')} type="email" placeholder="Email" className="border rounded px-3 py-2" />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

        <input {...register('password')} type="password" placeholder="Mật khẩu" className="border rounded px-3 py-2" />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

        <select {...register('gender')} className="border rounded px-3 py-2">
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </form>

      <p className="text-sm text-center mt-4 text-gray-600">
        Đã có tài khoản ? &nbsp;
        <Link to="/login" className="text-blue-600 hover:underline font-medium">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
