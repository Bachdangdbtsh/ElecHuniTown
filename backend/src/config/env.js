import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_ORIGIN'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Thieu bien moi truong: ${missing.join(', ')}`);
}

/** Parse JWT_EXPIRES_IN (e.g. "30m", "1h", "7d") to milliseconds for cookie maxAge. */
function parseExpiresToMs(value) {
  if (!value || typeof value !== 'string') return 30 * 60 * 1000;
  const match = value.trim().match(/^(\d+)([smhd])$/i);
  if (!match) return 30 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (mult[unit] ?? 60_000);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN,
  serverOrigin: process.env.SERVER_ORIGIN ?? `http://localhost:${process.env.PORT ?? 4000}`,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
  jwtCookieMaxAgeMs: parseExpiresToMs(process.env.JWT_EXPIRES_IN ?? '30m'),
  vnpayTmnCode: process.env.VNPAY_TMN_CODE ?? '',
  vnpaySecureSecret: process.env.VNPAY_SECURE_SECRET ?? '',
};
