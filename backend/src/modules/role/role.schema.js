import { z } from 'zod';

export const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.number().int()).min(0, 'Danh sách quyền không hợp lệ'),
});