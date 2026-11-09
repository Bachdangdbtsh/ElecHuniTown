import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler } from './common/error/ErrorHandler.js';
import router from './router/index.router.js';
import statisticRoutes from './modules/statistic/statistic.routes.js';
import authRoutes from './modules/auth/auth.route.js';
import recipientRoutes from './modules/recipient/recipient.route.js';
import changeRequestRoutes from './modules/account-change-request/change-request.route.js';
import adminRoutes from './modules/admin/admin.route.js';
import roleRoutes from './modules/role/role.route.js';
export const app = express();

// CORS must allow credentials for httpOnly cookie auth
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Security headers tối thiểu (không thêm dependency helmet)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', env: env.nodeEnv });
  } catch (err) {
    next(err);
  }
});

// Shopping / catalog / cart / order (module của thành viên khác)
app.use('/', router);

// Account / Auth / Phân quyền
app.use('/auth', authRoutes);
app.use('/recipients', recipientRoutes);
app.use('/account-change-requests', changeRequestRoutes);
app.use('/admin', adminRoutes);
app.use('/roles', roleRoutes);
app.use('/statistics', statisticRoutes);

// Global error handler — luôn đặt cuối
app.use(errorHandler);
