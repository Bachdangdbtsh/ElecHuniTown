import { prisma } from '../../lib/prisma.js';

export async function findAll({ isActive }) {
  return prisma.category.findMany({
    where: isActive === undefined ? {} : { isActive },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { id: 'desc' },
  });
}

export async function findById(id) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function create(data) {
  return prisma.category.create({ data });
}

export async function update(id, data) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

export async function deleteById(id) {
  return prisma.category.delete({
    where: { id },
  });
}

export async function countProducts(categoryId) {
  return prisma.product.count({
    where: { categoryId },
  });
}