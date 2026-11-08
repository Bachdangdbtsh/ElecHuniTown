import { prisma } from '../../lib/prisma.js';

export async function createRequest({ requestedById, reason, changes, previous }) {
  return prisma.accountChangeRequest.create({
    data: {
      requestedById,
      reason,
      changes,
      previous,
      status: 'PENDING',
    },
  });
}

export async function findRequestsByUserId(userId) {
  return prisma.accountChangeRequest.findMany({
    where: { requestedById: userId },
    include: {
      reviewedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findPendingRequestByUser(userId) {
  return prisma.accountChangeRequest.findFirst({
    where: {
      requestedById: userId,
      status: 'PENDING',
    },
  });
}

export async function updateUserDirect(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      updatedAt: true,
    },
  });
}