import * as categoryRepository from './CategoryRepository.js';
import { createSlug } from './CategoryUtils.js';
import { AppError } from '../../common/error/AppError.js';

function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new AppError(
      400,
      'INVALID_NAME',
      'Tên danh mục không được để trống.',
    );
  }
}

function validateDescription(description) {
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    throw new AppError(
      400,
      'INVALID_DESCRIPTION',
      'Mô tả danh mục phải là chuỗi.',
    );
  }
}

function handleDatabaseError(error) {
  if (error.code === 'P2002') {
    throw new AppError(
      409,
      'CATEGORY_DUPLICATE',
      'Tên hoặc slug danh mục đã tồn tại.',
    );
  }

  throw error;
}

export async function listCategories(isActive) {
  return categoryRepository.findAll({ isActive });
}

export async function getCategory(id) {
  const category = await categoryRepository.findById(id);

  if (!category) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy danh mục.');
  }

  return category;
}

export async function createCategory(data) {
  validateName(data.name);
  validateDescription(data.description);

  const name = data.name.trim();

  try {
    return await categoryRepository.create({
      name,
      slug: createSlug(name),
      description: data.description?.trim() || null,
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function updateCategory(id, data) {
  if (data.name === undefined && data.description === undefined) {
    throw new AppError(
      400,
      'EMPTY_UPDATE',
      'Hãy cung cấp tên hoặc mô tả cần cập nhật.',
    );
  }

  const category = await categoryRepository.findById(id);

  if (!category) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy danh mục.');
  }

  const updateData = {};

  if (data.name !== undefined) {
    validateName(data.name);

    const name = data.name.trim();
    updateData.name = name;
    updateData.slug = createSlug(name);
  }

  if (data.description !== undefined) {
    validateDescription(data.description);
    updateData.description = data.description?.trim() || null;
  }

  try {
    return await categoryRepository.update(id, updateData);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function setCategoryStatus(id, isActive) {
  if (typeof isActive !== 'boolean') {
    throw new AppError(
      400,
      'INVALID_STATUS',
      'isActive phải là true hoặc false.',
    );
  }

  const category = await categoryRepository.findById(id);

  if (!category) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy danh mục.');
  }

  return categoryRepository.update(id, { isActive });
}

export async function deleteCategory(id) {
  const category = await categoryRepository.findById(id);

  if (!category) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy danh mục.');
  }

  const productCount = await categoryRepository.countProducts(id);

  if (productCount > 0) {
    throw new AppError(
      409,
      'CATEGORY_HAS_PRODUCTS',
      'Không thể xóa danh mục đang có sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước.',
    );
  }

  return categoryRepository.deleteById(id);
}