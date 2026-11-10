import { AppError } from '../error/AppError.js';

/**
 * In-memory sliding-window rate limiter (đủ cho dev / MVP single-instance).
 * Production scale lớn nên chuyển Redis — ghi chú Chặng 6.
 *
 * keyFn: (req) => string  — thường IP + email để chống brute-force theo cả hai.
 */
export function rateLimit({
  windowMs = 15 * 60 * 1000,
  max = 20,
  keyFn = (req) => req.ip || req.socket?.remoteAddress || 'unknown',
  message = 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau.',
  code = 'RATE_LIMITED',
} = {}) {
  /** @type {Map<string, number[]>} */
  const hits = new Map();

  // Dọn entry cũ định kỳ, tránh memory leak nhẹ trên process dài ngày.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => now - t < windowMs);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }, Math.min(windowMs, 60_000));
  if (typeof sweep.unref === 'function') sweep.unref();

  return (req, res, next) => {
    try {
      const key = keyFn(req);
      const now = Date.now();
      const times = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (times.length >= max) {
        const retryAfterSec = Math.ceil((times[0] + windowMs - now) / 1000);
        res.setHeader('Retry-After', String(Math.max(retryAfterSec, 1)));
        throw new AppError(429, code, message);
      }
      times.push(now);
      hits.set(key, times);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Lấy IP client (hỗ trợ proxy nếu sau này bật trust proxy). */
export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
