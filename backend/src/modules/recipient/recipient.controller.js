import { AppError } from '../../common/error/AppError.js';
import * as service from './recipient.service.js';
import { createRecipientSchema, updateRecipientSchema } from './recipient.schema.js';

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
  }
  return result.data;
}

const ok = (res, data, statusCode = 200) => res.status(statusCode).json({ code: 'success', data });

export async function list(req, res) {
  const data = await service.getAddresses(req.user.id);
  ok(res, data);
}

export async function create(req, res) {
  console.log(req.body);
  const payload = parse(createRecipientSchema, req.body);
  const data = await service.addAddress(req.user.id, payload);
  ok(res, data, 201);
}

export async function update(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Mã địa chỉ không hợp lệ');
  }
  const payload = parse(updateRecipientSchema, req.body);
  const data = await service.editAddress(id, req.user.id, payload);
  ok(res, data);
}

export async function setDefault(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Mã địa chỉ không hợp lệ');
  }
  const data = await service.setAsDefault(id, req.user.id);
  ok(res, data);
}

export async function remove(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Mã địa chỉ không hợp lệ');
  }
  const data = await service.removeAddress(id, req.user.id);
  ok(res, data);
}