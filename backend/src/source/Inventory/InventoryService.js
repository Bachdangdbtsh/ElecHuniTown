import * as inventoryRepository from './InventoryRepository.js';
import { AppError } from '../../common/error/AppError.js';

const notFound = (message) => new AppError(404, 'NOT_FOUND', message);

function assertUniqueProducts(products, productIds) {
  const foundIds = new Set(products.map((product) => product.id));
  const missingIds = productIds.filter((id) => !foundIds.has(id));
  if (missingIds.length > 0) {
    throw new AppError(
      404,
      'PRODUCT_NOT_FOUND',
      `Không tìm thấy sản phẩm có mã: ${missingIds.join(', ')}`,
    );
  }
}

async function validateSupplier(supplierId) {
  if (!supplierId) return;
  const supplier = await inventoryRepository.findActiveSupplier(supplierId);
  if (!supplier) {
    throw new AppError(
      404,
      'SUPPLIER_NOT_FOUND',
      'Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động',
    );
  }
}

async function ensurePendingDocument(id, getDocument, documentName) {
  const document = await getDocument(id);
  if (!document) {
    throw notFound(`${documentName} không tồn tại`);
  }
  throw new AppError(
    409,
    'INVALID_DOCUMENT_STATUS',
    'Chỉ có thể xử lý phiếu đang chờ duyệt',
  );
}

export function getInventory(query) {
  return inventoryRepository.findInventoryProducts({ ...query, lowStock: false });
}

export function getLowStockInventory(query) {
  return inventoryRepository.findInventoryProducts({ ...query, lowStock: true });
}

export function listSuppliers() {
  return inventoryRepository.findActiveSuppliers();
}

export function searchSuppliers(query) {
  return inventoryRepository.findSuppliers(query);
}

async function ensureSupplier(id) {
  const supplier = await inventoryRepository.findSupplierById(id);
  if (!supplier) throw notFound('Nhà cung cấp không tồn tại');
  return supplier;
}

function throwSupplierConflict(error) {
  if (error?.code !== 'P2002') throw error;
  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.join(',')
    : String(error.meta?.target || '');
  if (target.includes('businessRegistNum')) {
    throw new AppError(409, 'SUPPLIER_REGISTRATION_EXISTS', 'Mã doanh nghiệp đã được sử dụng');
  }
  if (target.includes('email')) {
    throw new AppError(409, 'SUPPLIER_EMAIL_EXISTS', 'Email liên hệ đã được sử dụng');
  }
  throw new AppError(409, 'SUPPLIER_DUPLICATE_DATA', 'Mã doanh nghiệp hoặc email đã được sử dụng');
}

export async function getSupplier(id) {
  return ensureSupplier(id);
}

export async function createSupplier(payload) {
  try {
    return await inventoryRepository.createSupplier(payload);
  } catch (error) {
    throwSupplierConflict(error);
  }
}

export async function updateSupplier(id, payload) {
  await ensureSupplier(id);
  try {
    return await inventoryRepository.updateSupplier(id, payload);
  } catch (error) {
    throwSupplierConflict(error);
  }
}

export async function deleteSupplier(id) {
  await ensureSupplier(id);
  await inventoryRepository.deactivateSupplier(id);
  return { id };
}

export function listReceipts(query) {
  return inventoryRepository.findReceipts(query);
}

export async function getReceipt(id) {
  const receipt = await inventoryRepository.getReceiptById(id);
  if (!receipt) throw notFound('Phiếu nhập kho không tồn tại');
  return receipt;
}

export async function createReceipt(createdById, payload) {
  await validateSupplier(payload.supplierId);
  const productIds = payload.items.map((item) => item.productId);
  const products = await inventoryRepository.findProductsByIds(productIds);
  assertUniqueProducts(products, productIds);

  return inventoryRepository.createReceipt({
    supplierId: payload.supplierId,
    createdById,
    content: payload.content,
    items: payload.items.map(({ productId, quantity, unitCost }) => ({
      productId,
      quantity,
      unitCost,
    })),
  });
}

export async function approveReceipt(id, handledById) {
  const receipt = await inventoryRepository.approveReceipt(id, handledById);
  if (!receipt) {
    await ensurePendingDocument(id, inventoryRepository.getReceiptById, 'Phiếu nhập kho');
  }
  return receipt;
}

export async function rejectReceipt(id, handledById, rejectReason) {
  const receipt = await inventoryRepository.rejectReceipt(id, handledById, rejectReason);
  if (!receipt) {
    await ensurePendingDocument(id, inventoryRepository.getReceiptById, 'Phiếu nhập kho');
  }
  return receipt;
}

export function listIssues(query) {
  return inventoryRepository.findIssues(query);
}

export async function getIssue(id) {
  const issue = await inventoryRepository.getIssueById(id);
  if (!issue) throw notFound('Phiếu xuất kho không tồn tại');
  return issue;
}

export async function createIssue(createdById, payload) {
  await validateSupplier(payload.supplierId);
  const productIds = payload.items.map((item) => item.productId);
  const products = await inventoryRepository.findProductsByIds(productIds);
  assertUniqueProducts(products, productIds);

  const productsById = new Map(products.map((product) => [product.id, product]));
  return inventoryRepository.createIssue({
    supplierId: payload.supplierId,
    createdById,
    content: payload.content,
    type: payload.type,
    items: payload.items.map(({ productId, quantity }) => ({
      productId,
      quantity,
      unitCost: productsById.get(productId).newPrice,
    })),
  });
}

export async function approveIssue(id, handledById) {
  try {
    const issue = await inventoryRepository.approveIssue(id, handledById);
    if (!issue) {
      await ensurePendingDocument(id, inventoryRepository.getIssueById, 'Phiếu xuất kho');
    }
    return issue;
  } catch (error) {
    if (error instanceof inventoryRepository.InsufficientStockError) {
      const [product] = await inventoryRepository.findProductsByIds([error.productId]);
      throw new AppError(
        409,
        'INSUFFICIENT_STOCK',
        `Tồn kho sản phẩm "${product?.productName ?? error.productId}" không đủ để duyệt phiếu xuất`,
      );
    }
    throw error;
  }
}

export async function rejectIssue(id, handledById, rejectReason) {
  const issue = await inventoryRepository.rejectIssue(id, handledById, rejectReason);
  if (!issue) {
    await ensurePendingDocument(id, inventoryRepository.getIssueById, 'Phiếu xuất kho');
  }
  return issue;
}
