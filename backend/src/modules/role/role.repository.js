import { prisma } from '../../lib/prisma.js';

export async function findAllRoles() {
  return prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: { id: 'asc' },
  });
}

export async function findAllPermissionGroups() {
  return prisma.permissionGroup.findMany({
    include: {
      permissions: {
        orderBy: { id: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  });
}

export async function findRoleById(id) {
  return prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });
}

export async function updateRolePermissions({ adminId, roleId, permissionIds }) {
  return prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: { roleId },
    });

    if (permissionIds.length > 0) {
      const records = permissionIds.map((pId) => ({
        roleId,
        permissionId: pId,
      }));
      await tx.rolePermission.createMany({
        data: records,
      });
    }

    await tx.adminManageRole.create({
      data: {
        adminId,
        roleId,
        type: 'UPDATE_PERMISSIONS',
      },
    });

    return tx.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  });
}