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
import inventoryRoutes from './source/Inventory/InventoryRouter.js';
export const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;   // kiểm tra kết nối DB
  res.json({ status: 'ok' });
});
app.use('/order', guardCheckout);
app.use('/vnpay-return', guardPaymentReturn);
app.use("/",router);
// các module sẽ được gắn ở đây: app.use('/products', productRoutes), ...

app.use('/', inventoryRoutes);
app.use('/auth', authRoutes);
app.use('/recipients', recipientRoutes);
app.use('/account-change-requests', changeRequestRoutes);
app.use('/admin', adminRoutes);
app.use('/roles', roleRoutes);
app.use('/statistics', statisticRoutes);
app.use(errorHandler);                 
