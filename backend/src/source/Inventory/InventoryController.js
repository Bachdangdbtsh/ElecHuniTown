import { AppError } from '../../common/error/AppError.js';
import * as service from './InventoryService.js';
import {
  createIssueSchema,
  createReceiptSchema,
  documentListQuerySchema,
  emptyActionSchema,
  inventoryQuerySchema,
  rejectDocumentSchema,
  supplierListQuerySchema,
  supplierSchema,
} from './Inventory.schema.js';

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ',
    );
  }
  return result.data;
}

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AppError(400, 'INVALID_ID', `${label} không hợp lệ`);
  }
  return id;
}

const ok = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ code: 'success', data });

export async function inventory(req, res) {
  ok(res, await service.getInventory(parse(inventoryQuerySchema, req.query)));
}

export async function lowStock(req, res) {
  ok(res, await service.getLowStockInventory(parse(inventoryQuerySchema, req.query)));
}

export async function listSuppliers(req, res) {
  ok(res, await service.listSuppliers());
}

export async function searchSuppliers(req, res) {
  ok(res, await service.searchSuppliers(parse(supplierListQuerySchema, req.query)));
}

export async function getSupplier(req, res) {
  ok(res, await service.getSupplier(parseId(req.params.id, 'Mã nhà cung cấp')));
}

export async function createSupplier(req, res) {
  ok(res, await service.createSupplier(parse(supplierSchema, req.body)), 201);
}

export async function updateSupplier(req, res) {
  const id = parseId(req.params.id, 'Mã nhà cung cấp');
  ok(res, await service.updateSupplier(id, parse(supplierSchema, req.body)));
}

export async function deleteSupplier(req, res) {
  ok(res, await service.deleteSupplier(parseId(req.params.id, 'Mã nhà cung cấp')));
}

export async function listReceipts(req, res) {
  ok(res, await service.listReceipts(parse(documentListQuerySchema, req.query)));
}

export async function getReceipt(req, res) {
  ok(res, await service.getReceipt(parseId(req.params.id, 'Mã phiếu nhập')));
}

export async function createReceipt(req, res) {
  const payload = parse(createReceiptSchema, req.body);
  ok(res, await service.createReceipt(req.user.id, payload), 201);
}

export async function approveReceipt(req, res) {
  parse(emptyActionSchema, req.body ?? {});
  ok(res, await service.approveReceipt(parseId(req.params.id, 'Mã phiếu nhập'), req.user.id));
}

export async function rejectReceipt(req, res) {
  const { rejectReason } = parse(rejectDocumentSchema, req.body);
  ok(res, await service.rejectReceipt(parseId(req.params.id, 'Mã phiếu nhập'), req.user.id, rejectReason));
}

export async function listIssues(req, res) {
  ok(res, await service.listIssues(parse(documentListQuerySchema, req.query)));
}

export async function getIssue(req, res) {
  ok(res, await service.getIssue(parseId(req.params.id, 'Mã phiếu xuất')));
}

export async function createIssue(req, res) {
  const payload = parse(createIssueSchema, req.body);
  ok(res, await service.createIssue(req.user.id, payload), 201);
}

export async function approveIssue(req, res) {
  parse(emptyActionSchema, req.body ?? {});
  ok(res, await service.approveIssue(parseId(req.params.id, 'Mã phiếu xuất'), req.user.id));
}

export async function rejectIssue(req, res) {
  const { rejectReason } = parse(rejectDocumentSchema, req.body);
  ok(res, await service.rejectIssue(parseId(req.params.id, 'Mã phiếu xuất'), req.user.id, rejectReason));
}
