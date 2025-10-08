import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '../../utils/api.jsx';
import { useAdminAuth } from '../../store/useAdminAuth.jsx';

const AdminLoginSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setUser } = useAdminAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(AdminLoginSchema) });

  const onSubmit = async (values) => {
    try {
      const res = await api.post('/api/admin/login', values);
      setUser(res.data.user);
      toast.success('Đăng nhập thành công');
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Đăng nhập thất bại';
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24 bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-4 text-center">Đăng nhập quản trị</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <input
            {...register('email')}
            type="email"
            placeholder="Email quản trị"
            className="border rounded px-3 py-2 w-full"
          />
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

        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
