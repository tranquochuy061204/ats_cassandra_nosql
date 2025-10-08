import { z } from 'zod';

// ====== Validation schemas ======
export const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Tên quá ngắn').nonempty('Họ tên là bắt buộc'),

  email: z.email('Email không hợp lệ').nonempty('Email là bắt buộc'),

  password: z.string().min(6, 'Mật khẩu ≥ 6 ký tự').nonempty('Mật khẩu là bắt buộc'),

  role: z
    .enum(['candidate', 'recruiter', 'coordinator', 'admin'], {
      errorMap: () => ({ message: 'Role không hợp lệ' }),
    })
    .default('candidate'),

  gender: z
    .enum(['male', 'female', 'other'], {
      errorMap: () => ({ message: 'Giới tính không hợp lệ' }),
    })
    .default('other'),

  // address không bắt buộc
  address: z.string().optional(),

  // province_code: cho phép trống, nếu nhập thì phải là chuỗi số (1–2 ký tự cho tỉnh/thành)
  province_code: z
    .string()
    .regex(/^\d{1,2}$/, 'Mã tỉnh/thành phải là số (1-2 chữ số)')
    .optional(),

  // district_code: cho phép trống, nếu nhập thì phải là chuỗi số (1–3 ký tự cho quận/huyện)
  district_code: z
    .string()
    .regex(/^\d{1,3}$/, 'Mã quận/huyện phải là số (1-3 chữ số)')
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ').nonempty('Email là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});
  