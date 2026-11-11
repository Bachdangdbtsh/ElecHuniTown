import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục không được để trống'),
  description: z.string().trim().optional(),
  parentID: z.number().int().positive().nullable().optional(),
  imageUrl: z.string().trim().optional(),
});