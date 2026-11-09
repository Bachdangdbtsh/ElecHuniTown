import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.js';
import { rateLimit, clientIp } from '../../common/middleware/rateLimit.js';
import * as c from './auth.controller.js';

const router = Router();

// Login: 10 lần / 15 phút theo IP+email
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `login:${clientIp(req)}:${email}`;
  },
  message: 'Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  code: 'LOGIN_RATE_LIMITED',
});

// Register: 5 tài khoản / giờ / IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyFn: (req) => `register:${clientIp(req)}`,
  message: 'Bạn đã đăng ký quá nhiều lần từ địa chỉ này. Vui lòng thử lại sau.',
  code: 'REGISTER_RATE_LIMITED',
});

// Forgot / reset: 5 lần / 15 phút / IP+email
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `reset:${clientIp(req)}:${email}`;
  },
  message: 'Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau.',
  code: 'RESET_RATE_LIMITED',
});

router.post('/register', registerLimiter, c.register);
router.post('/login', loginLimiter, c.login);
router.post('/logout', c.logout);
router.post('/forgot-password', resetLimiter, c.forgotPassword);
router.post('/reset-password', resetLimiter, c.resetPassword);

router.get('/me', authenticate, c.getMe);
router.post('/change-password', authenticate, c.changePassword);

export default router;