import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../error/AppError.js';
import { isSessionInvalidated } from '../sessionInvalidation.js';

/**
 * Xác thực JWT từ Authorization Bearer hoặc cookie httpOnly `token`.
 * Gắn req.user = { id, email, fullName, phone, role, roleId, permissions[] }.
 * Luôn gọi next(err) để ErrorHandler nhận được lỗi từ async middleware.
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError(401, 'TOKEN_EXPIRED', 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại');
      }
      throw new AppError(401, 'INVALID_TOKEN', 'Token xác thực không hợp lệ');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(401, 'USER_NOT_FOUND', 'Tài khoản không tồn tại trên hệ thống');
    }

    if (!user.isActive) {
      throw new AppError(403, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khóa');
    }

    if (decoded.userId && decoded.iat && isSessionInvalidated(decoded.userId, decoded.iat)) {
      throw new AppError(401, 'SESSION_REVOKED', 'Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại');
    }

    if (!user.role) {
      throw new AppError(403, 'ROLE_MISSING', 'Tài khoản chưa được gán vai trò');
    }

    const permissions = (user.role.permissions || []).map((rp) => rp.permission.code);

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role.code,
      roleId: user.role.id,
      permissions,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(permissionCode) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHENTICATED', 'Bạn chưa đăng nhập');
      }

      if (!req.user.permissions || !req.user.permissions.includes(permissionCode)) {
        throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện chức năng này');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requirePermissionOrRole(permissionCode, ...roleCodes) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Bạn chưa đăng nhập');
    }

    if (
      !req.user.permissions?.includes(permissionCode)
      && !roleCodes.includes(req.user.role)
    ) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện chức năng này');
    }

    next();
  };
}

export function requireRole(...roleCodes) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHENTICATED', 'Bạn chưa đăng nhập');
      }

      if (!roleCodes.includes(req.user.role)) {
        throw new AppError(403, 'FORBIDDEN', 'Vai trò của bạn không được phép truy cập chức năng này');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
