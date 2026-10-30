import { z } from 'zod';

export const createChangeRequestSchema = z.object({
  reason: z.string().trim().min(5, 'Lý do thay đổi phải có ít nhất 5 ký tự'),
  changes: z
    .object({
      fullName: z.string().trim().min(2, 'Họ và tên phải có ít nhất 2 ký tự').optional(),
      email: z.string().trim().email('Email không đúng định dạng').optional(),
      phone: z
        .string()
        .trim()
        .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ')
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Bạn phải cung cấp ít nhất một thông tin cần thay đổi',
    }),
});

export const updateProfileDirectSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ và tên phải có ít nhất 2 ký tự').optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ')
    .optional(),
});