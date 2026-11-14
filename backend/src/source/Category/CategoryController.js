import * as categoryService from './CategoryService.js';
import { AppError } from '../../common/error/AppError.js';

function parseId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError(400, 'INVALID_ID', 'ID danh mục không hợp lệ.');
  }

  return id;
}

export async function list(req, res) {
  let isActive;

  if (req.query.isActive !== undefined) {
    if (!['true', 'false'].includes(req.query.isActive)) {
      throw new AppError(
        400,
        'INVALID_STATUS',
        'isActive phải là true hoặc false.',
      );
    }

    isActive = req.query.isActive === 'true';
  }

  const categories = await categoryService.listCategories(isActive);
  res.json({ data: categories });
}

export async function getById(req, res) {
  const category = await categoryService.getCategory(
    parseId(req.params.id),
  );

  res.json({ data: category });
}

export async function create(req, res) {
  const category = await categoryService.createCategory(req.body ?? {});

  res.status(201).json({ data: category });
}

export async function update(req, res) {
  const category = await categoryService.updateCategory(
    parseId(req.params.id),
    req.body ?? {},
  );

  res.json({ data: category });
}

export async function updateStatus(req, res) {
  const category = await categoryService.setCategoryStatus(
    parseId(req.params.id),
    req.body?.isActive,
  );

  res.json({ data: category });
}

export async function remove(req, res) {
  await categoryService.deleteCategory(parseId(req.params.id));

  res.status(204).end();
}