import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '../../utils/api.jsx';
import { useAuth } from '../../store/useAuth.jsx';

// Schema validate với zod
const LoginSchema = z.object({
  email: z.email('Email không hợp lệ'),
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

  // React Query mutation: gọi API login
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
    <div className="max-w-sm mx-auto mt-24 bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-4 text-center">Đăng nhập</h2>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <div>
          <input {...register('email')} type="email" placeholder="Email" className="border rounded px-3 py-2 w-full" />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <input
            {...register('password')}
            type="password"
            placeholder="Mật khẩu"
            className="border rounded px-3 py-2 w-full"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {mutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="text-sm text-center mt-4 text-gray-600">
        Chưa có tài khoản? &nbsp;
        <Link to="/register" className="text-blue-600 hover:underline font-medium">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
