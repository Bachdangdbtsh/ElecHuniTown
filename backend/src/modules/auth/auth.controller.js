import { AppError } from '../../common/error/AppError.js';
import { env } from '../../config/env.js';
import * as service from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schema.js';

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
  }
  return result.data;
}

const ok = (res, data, statusCode = 200) => res.status(statusCode).json({ code: 'success', data });

function extractClientMeta(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return { ip, userAgent };
}

export async function register(req, res) {
  const payload = parse(registerSchema, req.body);
  const data = await service.registerCustomer(payload);
  ok(res, data, 201);
}

export async function login(req, res) {
  const payload = parse(loginSchema, req.body);
  const clientMeta = extractClientMeta(req);
  const result = await service.login(payload, clientMeta);

  res.cookie('token', result.token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: env.jwtCookieMaxAgeMs,
  });

  // Không trả JWT trong body — chỉ cookie httpOnly (tránh XSS đọc token)
  ok(res, { user: result.user });
}

export async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
  });
  ok(res, { message: 'Đăng xuất thành công' });
}

export async function forgotPassword(req, res) {
  const payload = parse(forgotPasswordSchema, req.body);
  const data = await service.forgotPassword(payload);
  ok(res, data);
}

export async function resetPassword(req, res) {
  const payload = parse(resetPasswordSchema, req.body);
  const data = await service.resetPassword(payload);
  ok(res, data);
}

export async function changePassword(req, res) {
  const payload = parse(changePasswordSchema, req.body);
  const data = await service.changePassword(req.user.id, payload);
  ok(res, data);
}

export async function getMe(req, res) {
  const data = await service.getCurrentUser(req.user.id);
  ok(res, data);
}