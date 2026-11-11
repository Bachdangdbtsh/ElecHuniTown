import * as service from './staff.service.js';

export async function listCategories(req, res) {
  const data = await service.listCategories(req.query);
  res.json({ data });
}

export async function createCategory(req, res) {
  const data = await service.createCategory(req.body);
  res.status(201).json({ data });
}

export async function updateCategory(req, res) {
  const data = await service.updateCategory(Number(req.params.id), req.body);
  res.json({ data });
}

export async function updateCategoryStatus(req, res) {
  const data = await service.updateCategoryStatus(
    Number(req.params.id),
    req.body.isActive,
  );
  res.json({ data });
}

export async function deleteCategory(req, res) {
  await service.deleteCategory(Number(req.params.id));
  res.json({ data: null });
}

export async function listProducts(req, res) {
  const data = await service.listProducts(req.query);
  res.json({ data });
}

export async function createProduct(req, res) {
  const data = await service.createProduct(req.body);
  res.status(201).json({ data });
}

export async function updateProduct(req, res) {
  const data = await service.updateProduct(Number(req.params.id), req.body);
  res.json({ data });
}

export async function updateProductStatus(req, res) {
  const data = await service.updateProductStatus(
    Number(req.params.id),
    req.body.status,
  );
  res.json({ data });
}

export async function deleteProduct(req, res) {
  await service.deleteProduct(Number(req.params.id));
  res.json({ data: null });
}

export async function listOrders(req, res) {
  const data = await service.listOrders(req.query);
  res.json({ data });
}

export async function updateOrderStatus(req, res) {
  const data = await service.updateOrderStatus(
    Number(req.params.id),
    req.body.status,
    req.user.id,
  );
  res.json({ data });
}