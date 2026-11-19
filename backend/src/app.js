import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler } from './common/error/ErrorHandler.js';

import router from './router/index.router.js';
import { guardCheckout, guardPaymentReturn } from './common/middleware/checkout.js';
import statisticRoutes from './modules/statistic/statistic.routes.js';
import authRoutes from './modules/auth/auth.route.js';
import recipientRoutes from './modules/recipient/recipient.route.js';
import changeRequestRoutes from './modules/account-change-request/change-request.route.js';
import adminRoutes from './modules/admin/admin.route.js';
import roleRoutes from './modules/role/role.route.js';
import staffRoutes from './modules/staff/staff.route.js';
import returnsRoutes from './modules/returns/returns.route.js';
import commentRoutes from './modules/comment/comment.route.js';
import inventoryRoutes from './source/Inventory/InventoryRouter.js';
import notificationRoutes from './modules/notification/notification.route.js';

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
app.use('/order', guardCheckout);
app.use('/vnpay-return', guardPaymentReturn);
// Shopping / catalog / cart / order (module của thành viên khác)
app.use('/', router);
app.use('/', inventoryRoutes);

// Account / Auth / Phân quyền
app.use('/auth', authRoutes);
app.use('/recipients', recipientRoutes);
app.use('/account-change-requests', changeRequestRoutes);
app.use('/admin', adminRoutes);
app.use('/roles', roleRoutes);
app.use('/staff', staffRoutes);
app.use('/returns', returnsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/comments', commentRoutes);
app.use('/statistics', statisticRoutes);

// Global error handler — luôn đặt cuối
app.use(errorHandler);
