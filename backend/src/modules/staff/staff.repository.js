import { prisma } from '../../lib/prisma.js';
import { notify } from '../../utils/notify.js';

const productInclude = {
  category: true,
  pictures: true,
  tags: true,
};

export async function findCategories({ skip, take, search, isActive}) {
  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive'}} : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  const categories = await prisma.category.findMany({
    where,
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { id: 'desc' },
    skip,
    take,
  });

  const parentIds = [
    ...new Set(
      categories
        .map((category) => category.parentID)
        .filter((id) => id !== null),
    ),
  ];

  const parents = parentIds.length
    ? await prisma.category.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, name: true },
      })
    : [];

  const parentNames = new Map(
    parents.map((parent) => [parent.id, parent.name]),
  );

  return categories.map((category) => ({
    ...category,
    parentName: parentNames.get(category.parentID) ?? null,
  }));
}

export function countCategories({ search, isActive}) {
  return prisma.category.count({
    where : {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    }
  });
}

export async function getCategoryStats() {
  const [totalCategories, activeCategories, totalProducts] = await Promise.all([
    prisma.category.count(),
    prisma.category.count({ where: { isActive: true } }),
    prisma.product.count(),
  ]);

  return { totalCategories, activeCategories, totalProducts };
}

export function findCategoryById(id) {
  return prisma.category.findUnique({ where: { id } });
}

export function createCategory(data) {
  return prisma.category.create({ data });
}

export function updateCategory(id, data) {
  return prisma.category.update({ where: { id }, data });
}

export async function categoryHasProducts(id) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  return count > 0;
}

export function deleteCategory(id) {
  return prisma.category.delete({ where: { id } });
}

export function findProducts({ skip, take, search, status }) {
  const where = {
    ...(search
      ? {
          OR: [
            { productName: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  return prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
}

export function countProducts({ search, status }) {
  return prisma.product.count({
    where: {
      ...(search
        ? {
            OR: [
              { productName: { contains: search, mode: 'insensitive' } },
              { category: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    },
  });
}

export function findProductById(id) {
  return prisma.product.findUnique({ where: { id } });
}

export function createProduct(data) {
  const { pictures = [], tags = [], ...productData } = data;

  return prisma.product.create({
    data: {
      ...productData,
      slug: productData.slug || slugify(productData.productName),
      pictures: {
        create: pictures.map((url) => ({ url })),
      },
      tags: {
        create: tags.map((tag) => ({ tag })),
      },
    },
    include: productInclude,
  });
}

export function updateProduct(id, data) {
  const { pictures, tags, ...productData } = data;

  return prisma.$transaction(async (tx) => {
    if (pictures !== undefined) {
      await tx.productPictures.deleteMany({ where: { productId: id } });
      productData.pictures = {
        create: pictures.map((url) => ({ url })),
      };
    }

    if (tags !== undefined) {
      await tx.product_Tags.deleteMany({ where: { productId: id } });
      productData.tags = {
        create: tags.map((tag) => ({ tag })),
      };
    }

    return tx.product.update({
      where: { id },
      data: productData,
      include: productInclude,
    });
  });
}

export async function productHasHistory(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          orderItems: true,
          inventoryTransactions: true,
          returnRequestItems: true,
          stockIssueItems: true,
          stockReceiptItems: true,
          Comment: true,
          staffManageLogs: true,
        },
      },
    },
  });

  if (!product) return false;

  return Object.values(product._count).some((count) => count > 0);
}

export async function deleteProduct(id) {
  return prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({ where: { productId: id } });
    await tx.productPictures.deleteMany({ where: { productId: id } });
    await tx.product_Tags.deleteMany({ where: { productId: id } });
    return tx.product.delete({ where: { id } });
  });
}

function buildOrderWhere({ search, status }) {
  const numericId = Number(search);
  const searchConditions = search
    ? [
        ...(Number.isInteger(numericId)
          ? [{ id: numericId }]
          : []),
        {recipient: {is: {recipientName: { contains: search, mode: 'insensitive' },},},},
        {recipient: {is: {recipientPhoneNumber: { contains: search, mode: 'insensitive',},},},},
        {customer: {is: {fullName: { contains: search, mode: 'insensitive' },},},},
      ]
    : [];

  return {
    ...(search ? { OR: searchConditions } : {}),
    ...(status ? { status } : {}),
  };
}

export function findOrders({ skip, take, search, status}) {
  return prisma.order.findMany({
    where: buildOrderWhere({ search, status }),
    include: {
      customer: { select: { id: true, fullName: true, phone: true}},
      recipient: true,
      items: { include: { product: { select: { id: true, productName: true}}},},
    },
    orderBy: { orderDate: 'desc'},
    skip,
    take,
  });
}

export function countOrders({ search, status }) {
  return prisma.order.count({
    where: buildOrderWhere({ search, status }),
  });
}

export async function getOrderStatusStats() {
  const grouped = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  return Object.fromEntries(
    grouped.map(({ status, _count }) => [status, _count._all]),
  );
}

export function findOrderById(id) {
  return prisma.order.findUnique({ where: { id } });
}

export function updateOrderStatus(id, status, expectedStatus, actorId) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id, status: expectedStatus },
      data: { status, ...(status === 'CONFIRMED' ? { confirmedById: actorId } : {}),
        ...(status === 'SHIPPING' ? { shippedAt: new Date() } : {}) },
    });
    if (!updated.count) return false;
    const recipient = await tx.order.findUnique({ where: { id }, select: { customerId: true } });
    await notify({ userId: recipient?.customerId, role: 'CUSTOMER', type: 'ORDER_STATUS', message: `Đơn hàng #${id} đã chuyển sang trạng thái ${status}.`, url: '/account/orders', payload: { orderId: id, status } }, tx);
    await tx.auditLog.create({
      data: { actorId, action: status === 'CONFIRMED' ? 'APPROVE' : 'UPDATE', entityType: 'Order', entityId: id, details: { from: expectedStatus, to: status } },
    });
    return true;
  });
}

export function cancelOrderAndRestock(id, expectedStatus, actorId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return false;

    const updated = await tx.order.updateMany({
      where: { id, status: expectedStatus },
      data: { status: 'CANCELLED' },
    });

    if (updated.count === 0) return false;

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          sold: { decrement: item.quantity },
        },
      });
      await tx.inventoryTransaction.create({
        data: { type: 'RECEIPT', productId: item.productId, quantity: item.quantity, unitCost: item.price },
      });
    }

    await tx.auditLog.create({
      data: { actorId, action: 'REJECT', entityType: 'Order', entityId: id, details: { from: expectedStatus, to: 'CANCELLED' } },
    });
    await notify({ userId: order.customerId, role: 'CUSTOMER', type: 'ORDER_STATUS', message: `Đơn hàng #${id} đã bị hủy.`, url: '/account/orders', payload: { orderId: id, status: 'CANCELLED' } }, tx);

    return true;
  });
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
