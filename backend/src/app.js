import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler } from './common/error/ErrorHandler.js';
import router from "./router/index.router.js";
export const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;   // kiểm tra kết nối DB
  res.json({ status: 'ok' });
});
app.use("/",router);
console.log(env)
// các module sẽ được gắn ở đây: app.use('/products', productRoutes), ...

app.use(errorHandler);                 