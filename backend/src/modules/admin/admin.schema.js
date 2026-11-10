import { z } from 'zod';

export const createStaffUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().trim().email('Email công việc không đúng định dạng'),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  roleCode: z.enum(['STAFF', 'SHOP_OWNER'], {
    errorMap: () => ({ message: 'Vai trò chỉ có thể là Nhân viên hoặc Chủ ứng dụng' }),
  }),
  temporaryPassword: z
    .string()
    .min(8, 'Mật khẩu tạm thời phải có ít nhất 8 ký tự')
    .regex(/[a-z]/, 'Mật khẩu phải có chữ thường')
    .regex(/[A-Z]/, 'Mật khẩu phải có chữ hoa')
    .regex(/[0-9]/, 'Mật khẩu phải có chữ số'),
});

export const userQuerySchema = z.object({
  role: z.string().optional(),
  status: z.enum(['active', 'locked', 'all']).optional().default('all'),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const toggleLockUserSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().trim().min(3, 'Lý do khóa hoặc mở khóa phải có ít nhất 3 ký tự').optional(),
});

export const reviewChangeRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Trạng thái xử lý chỉ có thể là APPROVED hoặc REJECTED' }),
  }),
  // Ghi chú admin (tuỳ chọn). Chưa có cột DB — chấp nhận để FE gửi, không persist.
  note: z.string().trim().max(500).optional(),
});

export const accessAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(90),
  userId: z.coerce.number().int().optional(),
});