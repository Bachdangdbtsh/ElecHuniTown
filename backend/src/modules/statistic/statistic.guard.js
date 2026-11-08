import { AppError } from '../../common/error/AppError.js';
import { env } from '../../config/env.js';

let warned = false;

/**
 * Kiểm tra quyền xem/xuất thống kê theo MÃ QUYỀN (không theo tên vai trò).
 *
 * Module auth (Nhật Anh) chưa có trong main, nên chưa có req.user. Khi auth gắn
 * `req.user = { id, permissions: ['STATISTIC_VIEW', ...] }`, guard này tự hoạt động.
 * - Có req.user: bắt buộc có mã quyền, thiếu thì 403.
 * - Chưa có req.user: môi trường development cho qua (kèm cảnh báo), production thì 401.
 *
 * TODO: khi auth merge, thống nhất tên field `permissions` với Nhật Anh và bỏ nhánh cho qua.
 */
export function requirePermission(code) {
  return (req, res, next) => {
    if (!req.user) {
      if (env.nodeEnv === 'production') {
        throw new AppError(401, 'UNAUTHENTICATED', 'Bạn chưa đăng nhập');
      }
      if (!warned) {
        console.warn('[statistic] CẢNH BÁO: chưa có xác thực, API thống kê đang mở (chỉ cho môi trường dev)');
        warned = true;
      }
      return next();
    }
    if (!req.user.permissions?.includes(code)) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này');
    }
    next();
  };
}
