import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  productId: z.coerce.number().int().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  // 'true' = đã phản hồi, 'false' = chưa phản hồi, bỏ trống = tất cả.
  answered: z.enum(['true', 'false']).optional(),
});

export const replySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Nội dung phản hồi không được để trống')
    .max(1000, 'Phản hồi tối đa 1000 ký tự'),
});
