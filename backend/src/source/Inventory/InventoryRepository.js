import { prisma } from '../../lib/prisma.js';
import { notify } from '../../utils/notify.js';

const userBrief = {
  select: { id: true, fullName: true },
};

const receiptInclude = {
  supplier: { select: { id: true, name: true } },
  createdBy: userBrief,
  handledBy: userBrief,
  items: {
    include: {
      product: { select: { id: true, productName: true, slug: true, stock: true } },
    },
  },
};

const issueInclude = {
  supplier: { select: { id: true, name: true } },
  createdBy: userBrief,
  handledBy: userBrief,
  items: {
    include: {
      product: { select: { id: true, productName: true, slug: true, stock: true } },
    },
  },
};

async function notifyStaffOfDecision(tx, document, kind) {
  const creator = await tx.user.findFirst({
    where: { id: document.createdById, role: { code: 'STAFF' } },
    select: { id: true },
  });
  if (!creator) return;

  const approved = document.status === 'APPROVED';
  const label = kind === 'receipt' ? 'nhập' : 'xuất';
  const type = `STOCK_${kind === 'receipt' ? 'RECEIPT' : 'ISSUE'}_${approved ? 'APPROVED' : 'DENIED'}`;
  await notify({
    userId: creator.id,
    role: 'STAFF',
    type,
    message: `Phiếu ${label} kho ${document.code} của bạn đã ${approved ? 'được duyệt' : 'bị từ chối'}.`,
    url: `/inventory?view=processed&status=${document.status}`,
    payload: { [kind === 'receipt' ? 'receiptId' : 'issueId']: document.id, status: document.status },
  }, tx);
}

const paging = ({ page, pageSize }) => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

const paged = (items, total, { page, pageSize }) => ({
  items,
  total,
  page,
  pageSize,
});

function dateFilter(from, to) {
  if (!from && !to) return {};

  const endDate = to ? new Date(`${to}T00:00:00.000Z`) : undefined;
  if (endDate) endDate.setUTCDate(endDate.getUTCDate() + 1);

  return {
    createdAt: {
      ...(from && { gte: new Date(`${from}T00:00:00.000Z`) }),
      ...(endDate && { lt: endDate }),
    },
  };
}

const productInventorySelect = {
  id: true,
  productName: true,
  slug: true,
  stock: true,
  newPrice: true,
  status: true,
  category: { select: { id: true, name: true } },
  pictures: { select: { url: true }, take: 1 },
  inventoryTransactions: {
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
};

export async function findInventoryProducts({ lowStock, search, page, pageSize }) {
  const where = {
    ...(lowStock && { stock: { lte: 3 } }),
    ...(search && {
      OR: [
        { productName: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productInventorySelect,
      orderBy: [{ stock: 'asc' }, { id: 'asc' }],
      ...paging({ page, pageSize }),
    }),
    prisma.product.count({ where }),
  ]);

  return paged(items, total, { page, pageSize });
}

export async function findProductsByIds(ids) {
  return prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, productName: true, newPrice: true },
  });
}

export async function findActiveSupplier(id) {
  return prisma.supplier.findFirst({
    where: { id, isActive: true },
    select: { id: true },
  });
}

export async function findActiveSuppliers() {
  return prisma.supplier.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

const supplierSelect = {
  id: true,
  name: true,
  businessRegistNum: true,
  address: true,
  phoneNumber: true,
  email: true,
  contactPerson: true,
  bankNumber: true,
  bankName: true,
  createdAt: true,
};

export async function findSuppliers({ search, searchBy, page, pageSize }) {
  const searchFields = searchBy === 'all'
    ? ['name', 'businessRegistNum', 'phoneNumber']
    : [searchBy];
  const where = {
    isActive: true,
    ...(search && {
      OR: searchFields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      })),
    }),
  };
  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      select: supplierSelect,
      orderBy: { name: 'asc' },
      ...paging({ page, pageSize }),
    }),
    prisma.supplier.count({ where }),
  ]);
  return paged(items, total, { page, pageSize });
}

export function findSupplierById(id) {
  return prisma.supplier.findFirst({
    where: { id, isActive: true },
    select: supplierSelect,
  });
}

export function createSupplier(data) {
  return prisma.supplier.create({
    data,
    select: supplierSelect,
  });
}

export function updateSupplier(id, data) {
  return prisma.supplier.update({
    where: { id },
    data,
    select: supplierSelect,
  });
}

export function deactivateSupplier(id) {
  return prisma.supplier.update({
    where: { id },
    data: { isActive: false },
    select: { id: true },
  });
}

export async function getReceiptById(id) {
  return prisma.stockReceipt.findUnique({
    where: { id },
    include: receiptInclude,
  });
}

export async function getIssueById(id) {
  return prisma.stockIssue.findUnique({
    where: { id },
    include: issueInclude,
  });
}

export async function findReceipts({ status, supplierId, from, to, page, pageSize }) {
  const where = {
    ...(status && { status }),
    ...(supplierId && { supplierId }),
    ...dateFilter(from, to),
  };

  const [items, total] = await Promise.all([
    prisma.stockReceipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...paging({ page, pageSize }),
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: userBrief,
        _count: { select: { items: true } },
      },
    }),
    prisma.stockReceipt.count({ where }),
  ]);

  return paged(items, total, { page, pageSize });
}

export async function findIssues({ status, supplierId, from, to, page, pageSize }) {
  const where = {
    ...(status && { status }),
    ...(supplierId && { supplierId }),
    ...dateFilter(from, to),
  };

  const [items, total] = await Promise.all([
    prisma.stockIssue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...paging({ page, pageSize }),
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: userBrief,
        _count: { select: { items: true } },
      },
    }),
    prisma.stockIssue.count({ where }),
  ]);

  return paged(items, total, { page, pageSize });
}

export async function createReceipt({ supplierId, createdById, content, items }) {
  return prisma.$transaction(async (tx) => {
    const receipt = await tx.stockReceipt.create({
      data: {
        code: '',
        status: 'PENDING_HANDLE',
        content,
        supplierId,
        createdById,
        items: { create: items },
      },
      select: { id: true },
    });
    const owners = await tx.user.findMany({ where: { role: { code: 'SHOP_OWNER' }, isActive: true }, select: { id: true } });
    for (const owner of owners) await notify({ userId: owner.id, role: 'SHOP_OWNER', type: 'STOCK_RECEIPT_REQUEST', message: `Có phiếu nhập kho mới #${receipt.id}.`, url: '/inventory?view=pending', payload: { receiptId: receipt.id } }, tx);

    return tx.stockReceipt.update({
      where: { id: receipt.id },
      data: { code: `PN-${String(receipt.id).padStart(6, '0')}` },
      include: receiptInclude,
    });
  });
}

export async function createIssue({ supplierId, createdById, content, type, items }) {
  return prisma.$transaction(async (tx) => {
    const issue = await tx.stockIssue.create({
      data: {
        code: '',
        status: 'PENDING_HANDLE',
        content,
        type,
        supplierId,
        createdById,
        items: { create: items },
      },
      select: { id: true },
    });
    const owners = await tx.user.findMany({ where: { role: { code: 'SHOP_OWNER' }, isActive: true }, select: { id: true } });
    for (const owner of owners) await notify({ userId: owner.id, role: 'SHOP_OWNER', type: 'STOCK_ISSUE_REQUEST', message: `Có phiếu xuất kho mới #${issue.id}.`, url: '/inventory?view=pending', payload: { issueId: issue.id } }, tx);

    return tx.stockIssue.update({
      where: { id: issue.id },
      data: { code: `PX-${String(issue.id).padStart(6, '0')}` },
      include: issueInclude,
    });
  });
}

export async function approveReceipt(id, handledById) {
  return prisma.$transaction((tx) => approveReceiptInTransaction(tx, id, handledById));
}

export async function approveReceiptInTransaction(tx, id, handledById) {
  const changed = await tx.stockReceipt.updateMany({
    where: { id, status: 'PENDING_HANDLE' },
    data: { status: 'APPROVED', handledById, handledAt: new Date(), rejectReason: null },
  });
  if (changed.count === 0) return null;

  const items = await tx.stockReceiptItem.findMany({
    where: { receiptId: id },
    orderBy: { productId: 'asc' },
  });
  const totalCost = items.reduce((sum, item) => sum + BigInt(item.quantity) * BigInt(item.unitCost), 0n);
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }

  await tx.inventoryTransaction.createMany({
    data: items.map((item) => ({
      type: 'RECEIPT',
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      receiptItemId: item.id,
    })),
  });

  const finance = await tx.finance.upsert({
    where: { id: 1 },
    create: { id: 1, cashBalance: -totalCost, totalExpense: totalCost },
    update: {
      cashBalance: { decrement: totalCost },
      totalExpense: { increment: totalCost },
    },
  });
  await tx.auditLog.create({
    data: {
      actorId: handledById,
      action: 'UPDATE',
      entityType: 'Finance',
      entityId: finance.id,
      details: {
        receiptId: id,
        amount: totalCost.toString(),
        cashBalance: finance.cashBalance.toString(),
        totalExpense: finance.totalExpense.toString(),
      },
    },
  });

  const receipt = await tx.stockReceipt.findUnique({ where: { id }, include: receiptInclude });
  await notifyStaffOfDecision(tx, receipt, 'receipt');
  return receipt;
}

export class InsufficientStockError extends Error {
  constructor(productId) {
    super(`Insufficient stock for product ${productId}`);
    this.productId = productId;
  }
}

export async function approveIssue(id, handledById) {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.stockIssue.updateMany({
      where: { id, status: 'PENDING_HANDLE' },
      data: { status: 'APPROVED', handledById, handledAt: new Date(), rejectReason: null },
    });
    if (changed.count === 0) return null;

    const items = await tx.stockIssueItem.findMany({
      where: { issueId: id },
      orderBy: { productId: 'asc' },
    });
    for (const item of items) {
      const changedStock = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (changedStock.count === 0) {
        throw new InsufficientStockError(item.productId);
      }
    }

    await tx.inventoryTransaction.createMany({
      data: items.map((item) => ({
        type: 'ISSUE',
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        issueItemId: item.id,
      })),
    });

    const issue = await tx.stockIssue.findUnique({ where: { id }, include: issueInclude });
    await notifyStaffOfDecision(tx, issue, 'issue');
    return issue;
  });
}

export async function rejectReceipt(id, handledById, rejectReason) {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.stockReceipt.updateMany({
      where: { id, status: 'PENDING_HANDLE' },
      data: { status: 'DENIED', rejectReason, handledById, handledAt: new Date() },
    });
    if (!changed.count) return null;
    const receipt = await tx.stockReceipt.findUnique({ where: { id }, include: receiptInclude });
    await notifyStaffOfDecision(tx, receipt, 'receipt');
    return receipt;
  });
}

export async function rejectIssue(id, handledById, rejectReason) {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.stockIssue.updateMany({
      where: { id, status: 'PENDING_HANDLE' },
      data: { status: 'DENIED', rejectReason, handledById, handledAt: new Date() },
    });
    if (!changed.count) return null;
    const issue = await tx.stockIssue.findUnique({ where: { id }, include: issueInclude });
    await notifyStaffOfDecision(tx, issue, 'issue');
    return issue;
  });
}
