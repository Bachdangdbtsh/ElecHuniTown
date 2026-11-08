import { AppError } from '../../common/error/AppError.js';
import * as service from './role.service.js';
import { updateRolePermissionsSchema } from './role.schema.js';

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
  }
  return result.data;
}

const ok = (res, data, statusCode = 200) => res.status(statusCode).json({ code: 'success', data });

export async function getMatrix(req, res) {
  const data = await service.getRolesMatrix();
  ok(res, data);
}

export async function setPermissions(req, res) {
  const roleId = Number(req.params.id);
  if (Number.isNaN(roleId)) {
    throw new AppError(400, 'INVALID_ID', 'Mã vai trò không hợp lệ');
  }
  const payload = parse(updateRolePermissionsSchema, req.body);
  const data = await service.updatePermissions(roleId, req.user.id, payload);
  ok(res, data);
}