import { AppError } from '../../common/error/AppError.js';
import * as service from './change-request.service.js';
import { createChangeRequestSchema, updateProfileDirectSchema } from './change-request.schema.js';

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
  }
  return result.data;
}

const ok = (res, data, statusCode = 200) => res.status(statusCode).json({ code: 'success', data });

export async function create(req, res) {
  const payload = parse(createChangeRequestSchema, req.body);
  const data = await service.requestAccountChange(req.user.id, payload);
  ok(res, data, 201);
}

export async function listMine(req, res) {
  const data = await service.getMyChangeRequests(req.user.id);
  ok(res, data);
}

export async function updateProfile(req, res) {
  const payload = parse(updateProfileDirectSchema, req.body);
  const data = await service.updateProfileDirect(req.user.id, payload);
  ok(res, data);
}