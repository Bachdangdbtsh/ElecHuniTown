import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../common/error/AppError.js';
import { invalidateUserSessions } from '../../common/sessionInvalidation.js';
import * as repo from './auth.repository.js';

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function sanitizeUser(user) {
  const permissions = user.role?.permissions?.map((rp) => rp.permission.code) || [];
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    isActive: user.isActive,
    role: user.role?.code,
    roleName: user.role?.name,
    permissions,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export async function registerCustomer(payload) {
  const existingEmail = await repo.findUserByEmail(payload.email);
  if (existingEmail) {
    throw new AppError(409, 'EMAIL_EXISTS', 'Email này đã được sử dụng cho một tài khoản khác');
  }

  if (payload.phone) {
    const existingPhone = await repo.findUserByPhone(payload.phone);
    if (existingPhone) {
      throw new AppError(409, 'PHONE_EXISTS', 'Số điện thoại này đã được sử dụng cho một tài khoản khác');
    }
  }

  const role = await repo.findRoleByCode('CUSTOMER');
  if (!role) {
    throw new AppError(500, 'ROLE_NOT_CONFIGURED', 'Hệ thống chưa thiết lập vai trò Khách hàng');
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const newUser = await repo.createCustomerUser({
    email: payload.email,
    passwordHash,
    fullName: payload.fullName,
    phone: payload.phone,
    roleId: role.id,
  });

  return {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.fullName,
  };
}

export async function login(payload, clientMeta = {}) {
  const user = await repo.findUserByEmail(payload.email);

  if (!user) {
    await repo.createLoginHistory({
      userId: null,
      email: payload.email,
      ip: clientMeta.ip,
      userAgent: clientMeta.userAgent,
      success: false,
    });
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác');
  }

  const isMatch = await bcrypt.compare(payload.password, user.passwordHash);
  if (!isMatch) {
    await repo.createLoginHistory({
      userId: user.id,
      email: payload.email,
      ip: clientMeta.ip,
      userAgent: clientMeta.userAgent,
      success: false,
    });
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác');
  }

  if (!user.isActive) {
    await repo.createLoginHistory({
      userId: user.id,
      email: payload.email,
      ip: clientMeta.ip,
      userAgent: clientMeta.userAgent,
      success: false,
    });
    throw new AppError(403, 'ACCOUNT_LOCKED', 'Tài khoản của bạn đã bị khóa hoặc tạm ngừng hoạt động');
  }

  await repo.createLoginHistory({
    userId: user.id,
    email: payload.email,
    ip: clientMeta.ip,
    userAgent: clientMeta.userAgent,
    success: true,
  });

  await repo.updateLastLogin(user.id);

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role.code,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    },
  );

  return {
    token,
    user: sanitizeUser(user),
  };
}

export async function forgotPassword(payload) {
  const user = await repo.findUserByEmail(payload.email);
  // Always return the same generic message to avoid email enumeration.
  const genericMessage =
    'Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục mật khẩu đã được gửi';

  if (!user) {
    return { message: genericMessage };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await repo.createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  // Only expose the raw token in development so the UI can be tested without email.
  // In production the token must be delivered out-of-band (email/SMS).
  const result = { message: genericMessage };
  if (env.nodeEnv === 'development') {
    result.resetToken = rawToken;
  }
  return result;
}

export async function resetPassword(payload) {
  const user = await repo.findUserByEmail(payload.email);
  if (!user) {
    throw new AppError(400, 'INVALID_RESET_REQUEST', 'Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  const tokenHash = hashToken(payload.token);
  const resetRecord = await repo.findValidResetToken({
    userId: user.id,
    tokenHash,
  });

  if (!resetRecord) {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'Mã xác thực không hợp lệ hoặc đã hết hạn sử dụng');
  }

  const passwordHash = await bcrypt.hash(payload.newPassword, 10);

  await repo.updateUserPassword(user.id, passwordHash);
  await repo.markResetTokenUsed(resetRecord.id);
  // Thu hồi mọi phiên JWT cũ — bắt buộc đăng nhập lại bằng mật khẩu mới
  invalidateUserSessions(user.id);

  return {
    message: 'Đặt lại mật khẩu thành công, bạn có thể đăng nhập bằng mật khẩu mới',
  };
}

export async function changePassword(userId, payload) {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
  }

  const isMatch = await bcrypt.compare(payload.currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError(400, 'INCORRECT_PASSWORD', 'Mật khẩu hiện tại không chính xác');
  }

  const passwordHash = await bcrypt.hash(payload.newPassword, 10);
  await repo.updateUserPassword(userId, passwordHash);
  invalidateUserSessions(userId);

  return {
    message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
  };
}

export async function getCurrentUser(userId) {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy thông tin tài khoản');
  }
  return sanitizeUser(user);
}