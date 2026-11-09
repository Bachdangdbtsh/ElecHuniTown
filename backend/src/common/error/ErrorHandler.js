import { AppError } from './AppError.js';

/**
 * Global error handler.
 * - AppError: trả đúng status + code + message (không lộ stack).
 * - Lỗi khác: log server-side, trả 500 chung.
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
    });
  }

  // Zod / validation-like errors that slipped through
  if (err?.name === 'ZodError' && Array.isArray(err.issues)) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: err.issues[0]?.message ?? 'Dữ liệu không hợp lệ',
    });
  }

  console.error('[ErrorHandler]', err);
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Lỗi hệ thống',
  });
}
