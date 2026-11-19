import { prisma } from '../../lib/prisma.js';

const include = {
  Product: { select: { id: true, productName: true } },
  User: { select: { id: true, fullName: true, avatar: true } },
  RepliedBy: { select: { id: true, fullName: true } },
};

export function findMany({ where, skip, take }) {
  return prisma.comment.findMany({
    where,
    include,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take,
  });
}

export function count(where) {
  return prisma.comment.count({ where });
}

export function findById(id) {
  return prisma.comment.findUnique({ where: { id }, include });
}

export function updateReply(id, data) {
  return prisma.comment.update({ where: { id }, data, include });
}
