import { z } from 'zod';

export const createRecipientSchema = z.object({
  recipientName: z.string().trim().min(2, 'Tên người nhận phải có ít nhất 2 ký tự'),
  recipientPhoneNumber: z
    .string()
    .trim()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại người nhận không hợp lệ'),
  address: z.string().trim().min(5, 'Địa chỉ chi tiết phải có ít nhất 5 ký tự'),
  recipientType: z.string().trim().optional().or(z.literal('')),
  isDefault: z.boolean().optional().default(false),
});

export const updateRecipientSchema = z.object({
  recipientName: z.string().trim().min(2, 'Tên người nhận phải có ít nhất 2 ký tự').optional(),
  recipientPhoneNumber: z
    .string()
    .trim()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại người nhận không hợp lệ')
    .optional(),
  address: z.string().trim().min(5, 'Địa chỉ chi tiết phải có ít nhất 5 ký tự').optional(),
  recipientType: z.string().trim().optional().or(z.literal('')),
  isDefault: z.boolean().optional(),
});