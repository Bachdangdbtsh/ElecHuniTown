import { AppError } from '../../common/error/AppError.js';
import * as service from './admin.service.js';
import {
  createStaffUserSchema,
  userQuerySchema,
  toggleLockUserSchema,
  reviewChangeRequestSchema,
  accessAnalyticsQuerySchema,
} from './admin.schema.js';

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
  }
  return result.data;
}

const ok = (res, data, statusCode = 200) => res.status(statusCode).json({ code: 'success', data });

export async function createStaff(req, res) {
  const payload = parse(createStaffUserSchema, req.body);
  const data = await service.createInternalUser(payload);
  ok(res, data, 201);
}

export async function getUsers(req, res) {
  const query = parse(userQuerySchema, req.query);
  const data = await service.listUsers(query);
  ok(res, data);
}

export async function getUser(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Mã người dùng không hợp lệ');
  }
  const data = await service.getUserDetail(id);
  ok(res, data);
}

export async function toggleLock(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Mã người dùng không hợp lệ');
  }
  const payload = parse(toggleLockUserSchema, req.body);
  const data = await service.toggleUserStatus(id, req.user.id, payload);
  ok(res, data);
}

export async function listChangeRequests(req, res) {
  const data = await service.getPendingChangeRequests();
  ok(res, data);
}

export async function reviewRequest(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Mã yêu cầu không hợp lệ');
  }
  const payload = parse(reviewChangeRequestSchema, req.body);
  const data = await service.reviewChangeRequest(id, req.user.id, payload.status, payload.note);
  ok(res, data);
}

export async function analytics(req, res) {
  const query = parse(accessAnalyticsQuerySchema, req.query);
  const data = await service.getAccessAnalytics(query);
  ok(res, data);
}
