import { prisma } from '../../lib/prisma.js';

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
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
      customer: true,
      staff: true,
      shopOwner: true,
      admin: true,
    },
  });
}

export async function findUserByPhone(phone) {
  if (!phone) return null;
  return prisma.user.findUnique({
    where: { phone },
  });
}

export async function findUserById(id) {
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
      customer: true,
      staff: true,
      shopOwner: true,
      admin: true,
    },
  });
}

export async function findRoleByCode(code) {
  return prisma.role.findUnique({
    where: { code },
  });
}

export async function createCustomerUser({ email, passwordHash, fullName, phone, roleId }) {
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
    });

    await tx.customer.create({
      data: {
        userId: user.id,
      },
    });

    return user;
  });
}

export async function updateLastLogin(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function createLoginHistory({ userId, email, ip, userAgent, success }) {
  return prisma.loginHistory.create({
    data: {
      userId: userId || null,
      email,
      ip: ip || null,
      userAgent: userAgent || null,
      success,
    },
  });
}

export async function createPasswordResetToken({ userId, tokenHash, expiresAt }) {
  return prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
}

export async function findValidResetToken({ userId, tokenHash }) {
  return prisma.passwordResetToken.findFirst({
    where: {
      userId,
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function markResetTokenUsed(id) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export async function updateUserPassword(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}