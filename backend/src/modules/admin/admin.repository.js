import { prisma } from '../../lib/prisma.js';

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserByPhone(phone) {
  if (!phone) return null;
  return prisma.user.findUnique({
    where: { phone },
  });
}

export async function findRoleByCode(code) {
  return prisma.role.findUnique({
    where: { code },
  });
}

export async function createInternalUser({ email, passwordHash, fullName, phone, roleId, roleCode }) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone: phone || null,
        roleId,
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    if (roleCode === 'STAFF') {
      await tx.staff.create({ data: { userId: user.id } });
    } else if (roleCode === 'SHOP_OWNER') {
      await tx.shopOwner.create({ data: { userId: user.id } });
    }

    return user;
  });
}

export async function findUsersWithPagination({ where, skip, take }) {
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take,
      include: {
        role: true,
      },
      orderBy: { id: 'asc' },
    }),
  ]);

  return { total, users };
}

export async function getUserKpiCounts() {
  const [total, customers, staffAndAdmin, locked] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        role: { code: 'CUSTOMER' },
      },
    }),
    prisma.user.count({
      where: {
        role: { code: { in: ['STAFF', 'ADMIN', 'SHOP_OWNER'] } },
      },
    }),
    prisma.user.count({
      where: { isActive: false },
    }),
  ]);

  return {
    totalUsers: total,
    customerCount: customers,
    staffAndAdminCount: staffAndAdmin,
    lockedCount: locked,
  };
}

export async function findUserDetailById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      customer: {
        include: {
          orders: {
            select: { id: true },
          },
        },
      },
      staff: true,
      shopOwner: true,
      admin: true,
      loginHistory: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function updateUserActiveStatus(id, isActive) {
  return prisma.user.update({
    where: { id },
    data: { isActive },
    include: { role: true },
  });
}

export async function findPendingChangeRequests() {
  return prisma.accountChangeRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      requestedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findChangeRequestById(id) {
  return prisma.accountChangeRequest.findUnique({
    where: { id },
    include: {
      requestedBy: true,
    },
  });
}

export async function resolveChangeRequest({ requestId, reviewedById, status, changes, requestedUserId }) {
  return prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.accountChangeRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedById,
        reviewedAt: new Date(),
      },
    });

    if (status === 'APPROVED') {
      const updateData = {};
      if (changes.fullName) updateData.fullName = changes.fullName;
      if (changes.email) updateData.email = changes.email;
      if (changes.phone) updateData.phone = changes.phone;

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: requestedUserId },
          data: updateData,
        });
      }
    }

    return updatedRequest;
  });
}

export async function getLoginLogs(startDate, userId) {
  const where = {
    createdAt: { gte: startDate },
  };
  if (userId) {
    where.userId = userId;
  }

  return prisma.loginHistory.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}