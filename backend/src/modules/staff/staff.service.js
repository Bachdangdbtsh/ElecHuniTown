import * as repository from './staff.repository.js';
import { AppError } from '../../common/error/AppError.js';
import { createSlug } from '../../source/Category/CategoryUtils.js';

const productStatuses = ['ACTIVE', 'HIDDEN'];
const allowedPageSizes = [5, 10, 20, 50];
const orderStatuses = [
  'PENDING',
  'CONFIRMED',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
];
const orderTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

function ensurePositiveId(id, label) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'INVALID_ID', `${label} không hợp lệ.`);
  }
}

function getPagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const requestedSize = Number(query.pageSize) || 10;

  if (!allowedPageSizes.includes(requestedSize)) {
    throw new AppError(400, 'INVALID_PAGE_SIZE', 'Số dòng mỗi trang phải là 5, 10, 20 hoặc 50.');
  }

  return {
    page,
    pageSize: requestedSize,
    skip: (page - 1) * requestedSize,
    take: requestedSize,
    search: String(query.search || '').trim(),
  };
}

async function getPageResult(findItems, countItems, options) {
  const whereOptions = {
    search: options.search,
    ...(options.status ? { status: options.status } : {}),
    ...(options.isActive !== undefined ? { isActive: options.isActive } : {}),
  };

  const [items, total] = await Promise.all([
    findItems({ ...whereOptions, skip: options.skip, take: options.take }),
    countItems(whereOptions),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / options.pageSize));

  return {
    items,
    total,
    page: Math.min(options.page, totalPages),
    pageSize: options.pageSize,
    totalPages,
  };
}

export async function listCategories(query = {}) {
  const options = getPagination(query);

  if (query.isActive !== undefined) {
    if (!['true', 'false'].includes(query.isActive)) {
      throw new AppError(400, 'INVALID_STATUS', 'Trạng thái danh mục không hợp lệ.');
    }
    options.isActive = query.isActive === 'true';
  }

  const result = await getPageResult(
    repository.findCategories,
    repository.countCategories,
    options,
  );

  return {
    ...result,
    stats: await repository.getCategoryStats(),
  };
}

export async function createCategory(data) {
  const parentID = data.parentID ?? null;

  if (parentID !== null) {
    const parent = await repository.findCategoryById(parentID);
    if (!parent) {
      throw new AppError(404, 'PARENT_NOT_FOUND', 'Không tìm thấy danh mục cha.');
    }
  }

  return repository.createCategory({
    name: data.name,
    description: data.description || null,
    parentID,
    imageUrl: data.imageUrl || null,
    slug: createSlug(data.name.trim()),
  });
}

export async function updateCategory(id, data) {
  ensurePositiveId(id, 'ID danh mục');

  const category = await repository.findCategoryById(id);
  if (!category) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.');
  }

  const parentID = data.parentID === undefined ? category.parentID : data.parentID;

  if (parentID === id) {
    throw new AppError(400, 'INVALID_PARENT', 'Danh mục không thể là cha của chính nó.');
  }

  if (parentID != null && !(await repository.findCategoryById(parentID))) {
    throw new AppError(404, 'PARENT_NOT_FOUND', 'Không tìm thấy danh mục cha.');
  }

  return repository.updateCategory(id, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description || null }),
    ...(data.parentID !== undefined && { parentID }),
    ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
  });
}

export async function updateCategoryStatus(id, isActive) {
  ensurePositiveId(id, 'ID danh mục');

  if (typeof isActive !== 'boolean') {
    throw new AppError(400, 'INVALID_STATUS', 'isActive phải là true hoặc false.');
  }

  if (!(await repository.findCategoryById(id))) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.');
  }

  return repository.updateCategory(id, { isActive });
}

export async function deleteCategory(id) {
  ensurePositiveId(id, 'ID danh mục');

  const category = await repository.findCategoryById(id);
  if (!category) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.');
  }

  if (await repository.categoryHasProducts(id)) {
    throw new AppError(409, 'CATEGORY_HAS_PRODUCTS', 'Danh mục vẫn còn sản phẩm, hãy ẩn danh mục thay vì xóa.');
  }

  return repository.deleteCategory(id);
}

export async function listProducts(query = {}) {
  const options = getPagination(query);

  if (query.status && !productStatuses.includes(query.status)) {
    throw new AppError(400, 'INVALID_STATUS', 'Trạng thái sản phẩm không hợp lệ.');
  }

  options.status = query.status || '';

  return getPageResult(
    repository.findProducts,
    repository.countProducts,
    options,
  );
}

export async function createProduct(data) {
  const categoryId = Number(data.categoryId);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new AppError(400, 'INVALID_CATEGORY', 'Danh mục sản phẩm không hợp lệ.');
  }

  const category = await repository.findCategoryById(categoryId);
  if (!category || !category.isActive) {
    throw new AppError(400, 'CATEGORY_UNAVAILABLE', 'Danh mục không tồn tại hoặc đang bị ẩn.');
  }

  return repository.createProduct({
    categoryId,
    productName: data.productName,
    oldPrice: Number(data.oldPrice),
    newPrice: Number(data.newPrice),
    description: data.description,
    slug: data.slug,
    stock: Number(data.stock),
    isFeature: Boolean(data.isFeature),
    pictures: data.imageUrl?.trim() ? [data.imageUrl.trim()] : [],
    tags: data.tags || [],
  });
}

export async function updateProduct(id, data) {
  ensurePositiveId(id, 'ID sản phẩm');

  if (!(await repository.findProductById(id))) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
  }

  if (data.categoryId !== undefined) {
    const category = await repository.findCategoryById(Number(data.categoryId));
    if (!category || !category.isActive) {
      throw new AppError(400, 'CATEGORY_UNAVAILABLE', 'Danh mục không tồn tại hoặc đang bị ẩn.');
    }
  }

  const pictures = data.imageUrl !== undefined
    ? (data.imageUrl.trim() ? [data.imageUrl.trim()] : [])
    : data.pictures;

  return repository.updateProduct(id, {
    ...(data.categoryId !== undefined && { categoryId: Number(data.categoryId) }),
    ...(data.productName !== undefined && { productName: data.productName }),
    ...(data.oldPrice !== undefined && { oldPrice: Number(data.oldPrice) }),
    ...(data.newPrice !== undefined && { newPrice: Number(data.newPrice) }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.slug !== undefined && { slug: data.slug }),
    ...(data.stock !== undefined && { stock: Number(data.stock) }),
    ...(data.isFeature !== undefined && { isFeature: Boolean(data.isFeature) }),
    ...(pictures !== undefined && { pictures }),
    ...(data.tags !== undefined && { tags: data.tags }),
  });
}

export async function updateProductStatus(id, status) {
  ensurePositiveId(id, 'ID sản phẩm');

  if (!productStatuses.includes(status)) {
    throw new AppError(400, 'INVALID_STATUS', 'Trạng thái sản phẩm không hợp lệ.');
  }

  if (!(await repository.findProductById(id))) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
  }

  return repository.updateProduct(id, { status });
}

export async function deleteProduct(id) {
  ensurePositiveId(id, 'ID sản phẩm');

  if (!(await repository.findProductById(id))) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
  }

  if (await repository.productHasHistory(id)) {
    throw new AppError(409, 'PRODUCT_HAS_HISTORY', 'Sản phẩm đã có lịch sử đơn hàng hoặc kho; hãy ẩn thay vì xóa.');
  }

  return repository.deleteProduct(id);
}

export async function listOrders(query = {}) {
  const options = getPagination(query);

  if (query.status && !orderStatuses.includes(query.status)) {
    throw new AppError(400, 'INVALID_STATUS', 'Trạng thái đơn hàng không hợp lệ.');
  }

  options.status = query.status || '';

  const result = await getPageResult(
    repository.findOrders,
    repository.countOrders,
    options,
  );

  return {
    ...result,
    statusCounts: await repository.getOrderStatusStats(),
  };
}

export async function updateOrderStatus(id, nextStatus, staffId) {
  ensurePositiveId(id, 'ID đơn hàng');

  const order = await repository.findOrderById(id);
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
  }

  if (!orderTransitions[order.status]?.includes(nextStatus)) {
    throw new AppError(409, 'INVALID_TRANSITION', 'Trạng thái chuyển không hợp lệ.');
  }

  if (nextStatus === 'CANCELLED') {
    const cancelled = await repository.cancelOrderAndRestock(id, order.status, staffId);
    if (!cancelled) {
      throw new AppError(409, 'ORDER_CHANGED', 'Đơn hàng vừa được cập nhật ở nơi khác. Hãy tải lại rồi thử lại.');
    }
    return repository.findOrderById(id);
  }

  const updated = await repository.updateOrderStatus(id, nextStatus, order.status, staffId);
  if (!updated) {
    throw new AppError(409, 'ORDER_CHANGED', 'Đơn hàng vừa được cập nhật ở nơi khác. Hãy tải lại rồi thử lại.');
  }
  return repository.findOrderById(id);
}
