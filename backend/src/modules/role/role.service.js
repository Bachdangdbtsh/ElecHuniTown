import { AppError } from '../../common/error/AppError.js';
import * as repo from './role.repository.js';

export async function getRolesMatrix() {
  const [roles, groups] = await Promise.all([
    repo.findAllRoles(),
    repo.findAllPermissionGroups(),
  ]);

  const formattedRoles = roles.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    userCount: r._count.users,
    assignedPermissionIds: r.permissions.map((rp) => rp.permissionId),
  }));

  return {
    roles: formattedRoles,
    permissionGroups: groups,
  };
}

export async function updatePermissions(roleId, adminId, payload) {
  const role = await repo.findRoleById(roleId);
  if (!role) {
    throw new AppError(404, 'ROLE_NOT_FOUND', 'Vai trò không tồn tại');
  }

  // Không cho gỡ quyền cốt lõi khỏi ADMIN (tránh tự khóa hệ thống)
  if (role.code === 'ADMIN') {
    const essential = ['USER_VIEW', 'ROLE_MANAGE', 'CHANGE_REQUEST_REVIEW'];
    const codes = await repo.findPermissionCodesByIds(payload.permissionIds || []);
    const missing = essential.filter((c) => !codes.includes(c));
    if (missing.length) {
      throw new AppError(
        400,
        'ADMIN_ESSENTIAL_PERMISSIONS',
        `Không thể gỡ các quyền bắt buộc của Admin: ${missing.join(', ')}`,
      );
    }
  }

  return repo.updateRolePermissions({
    adminId,
    roleId,
    permissionIds: payload.permissionIds,
  });
}