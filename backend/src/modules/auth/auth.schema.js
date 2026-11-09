import { z } from 'zod';

/**
 * Password policy (e-commerce tối thiểu):
 * - ≥ 8 ký tự
 * - Có chữ thường, chữ hoa, số
 * (Ký tự đặc biệt khuyến nghị, chưa bắt buộc để khớp UX mockup "tối thiểu 8 ký tự")
 */
const passwordPolicy = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất một chữ thường')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất một chữ hoa')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất một chữ số');

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    email: z.string().trim().email('Email không đúng định dạng'),
    phone: z
      .string()
      .trim()
      .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ')
      .optional()
      .or(z.literal('')),
    password: passwordPolicy,
    confirmPassword: z.string().min(8, 'Xác nhận mật khẩu phải có ít nhất 8 ký tự'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng'),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email('Email không đúng định dạng'),
    token: z.string().trim().min(1, 'Mã xác thực không được để trống'),
    newPassword: passwordPolicy,
    confirmPassword: z.string().min(8, 'Xác nhận mật khẩu phải có ít nhất 8 ký tự'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordPolicy,
    confirmPassword: z.string().min(8, 'Xác nhận mật khẩu phải có ít nhất 8 ký tự'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
    path: ['newPassword'],
  });
