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

  return repo.updateRolePermissions({
    adminId,
    roleId,
    permissionIds: payload.permissionIds,
  });
}