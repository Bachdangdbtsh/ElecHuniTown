import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { VNPay } from 'vnpay';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { AppError } from '../../common/error/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';

const router = Router();
router.use(authenticate);

const includeOrder = {
  recipient: true,
  items: { include: { product: { select: { productName: true, pictures: { take: 1, select: { url: true } } } } } },
};
const includeReturn = {
  order: { include: { customer: { select: { fullName: true, email: true } }, ...includeOrder } },
  items: { include: { product: { select: { productName: true } } } },
  images: true,
};

function validId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError(400, 'INVALID_ID', 'Mã không hợp lệ');
  return id;
}

function vnpDate(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return Number(`${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`);
}

router.get('/my-orders', requireRole('CUSTOMER'), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.user.id }, include: { ...includeOrder, returnRequests: { select: { id: true, status: true } } },
    orderBy: { orderDate: 'desc' },
  });
  res.json({ data: orders });
});

router.post('/', requireRole('CUSTOMER'), async (req, res) => {
  const orderId = validId(req.body?.orderId);
  const reason = String(req.body?.reason || '').trim();
  const images = req.body?.images || [];
  if (reason.length < 10 || reason.length > 2000) throw new AppError(400, 'INVALID_REASON', 'Lý do cần từ 10 đến 2000 ký tự');
  if (!Array.isArray(images) || images.length > 2 || images.some((image) => typeof image !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 400000)) {
    throw new AppError(400, 'INVALID_IMAGES', 'Tối đa 2 ảnh PNG, JPEG hoặc WebP, mỗi ảnh dưới 300 KB');
  }
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: req.user.id, status: 'DELIVERED' },
    include: { items: true, returnRequests: { select: { id: true } } },
  });
  if (!order) throw new AppError(404, 'ORDER_NOT_ELIGIBLE', 'Không tìm thấy đơn đã giao của bạn');
  if (order.returnRequests.length) throw new AppError(409, 'RETURN_EXISTS', 'Đơn hàng đã có yêu cầu đổi trả');
  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.returnRequest.create({
      data: {
        orderId, reason, rejectReason: '',
        items: { create: order.items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitCost: item.price })) },
        images: { create: images.map((url) => ({ url })) },
      },
    });
    await tx.auditLog.create({ data: { actorId: req.user.id, action: 'CREATE', entityType: 'ReturnRequest', entityId: request.id, details: { orderId } } });
    return request;
  });
  res.status(201).json({ data: created });
});

router.get('/', requireRole('SHOP_OWNER'), async (req, res) => {
  const requests = await prisma.returnRequest.findMany({ include: includeReturn, orderBy: { createdAt: 'desc' } });
  res.json({ data: requests });
});

router.patch('/:id/decision', requireRole('SHOP_OWNER'), async (req, res) => {
  const id = validId(req.params.id);
  const decision = req.body?.decision;
  const rejectReason = String(req.body?.rejectReason || '').trim();
  if (!['APPROVED', 'DENIED'].includes(decision)) throw new AppError(400, 'INVALID_DECISION', 'Quyết định không hợp lệ');
  if (decision === 'DENIED' && rejectReason.length < 5) throw new AppError(400, 'INVALID_REASON', 'Cần nhập lý do từ chối');
  const request = await prisma.returnRequest.findUnique({ where: { id }, include: { items: true } });
  if (!request) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy yêu cầu');
  const conditions = req.body?.conditions || {};
  if (decision === 'APPROVED' && request.items.some((item) => !['RESALEABLE', 'NON_RESALEABLE'].includes(conditions[item.productId]))) {
    throw new AppError(400, 'INVALID_CONDITION', 'Cần chọn tình trạng cho từng sản phẩm');
  }
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.returnRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: decision, rejectReason: decision === 'DENIED' ? rejectReason : '', handledById: req.user.id, handledAt: new Date() },
    });
    if (!changed.count) throw new AppError(409, 'ALREADY_HANDLED', 'Yêu cầu đã được xử lý');
    if (decision === 'APPROVED') {
      for (const item of request.items) {
        const condition = conditions[item.productId];
        await tx.returnRequestItem.update({ where: { id: item.id }, data: { condition } });
        await tx.product.update({ where: { id: item.productId }, data: { sold: { decrement: item.quantity } } });
        if (condition === 'RESALEABLE') {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          await tx.inventoryTransaction.create({ data: { type: 'CUSTOMER_RETURN', productId: item.productId, quantity: item.quantity, unitCost: item.unitCost, returnRequestId: id } });
        }
      }
    }
    await tx.auditLog.create({ data: { actorId: req.user.id, action: decision === 'APPROVED' ? 'APPROVE' : 'REJECT', entityType: 'ReturnRequest', entityId: id, details: { decision, rejectReason } } });
    return tx.returnRequest.findUnique({ where: { id }, include: includeReturn });
  });
  res.json({ data: updated });
});

router.post('/:id/refund', requireRole('SHOP_OWNER'), async (req, res) => {
  const id = validId(req.params.id);
  const request = await prisma.returnRequest.findUnique({ where: { id }, include: { order: true } });
  if (!request) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy yêu cầu');
  if (request.status !== 'APPROVED' || request.refundCode) throw new AppError(409, 'REFUND_STATE', 'Yêu cầu chưa được duyệt hoặc đã gửi hoàn tiền');
  const order = request.order;
  const originalDate = order.paymentCreatedAt || String(req.body?.transactionDate || '');
  if (order.paymentMethod !== 'bank' || !order.paymentMethodStatus || !order.transactionID || !/^\d{14}$/.test(originalDate)) {
    throw new AppError(400, 'NO_VNPAY_TRANSACTION', 'Đơn hàng không có đủ thông tin giao dịch VNPay gốc để hoàn tiền');
  }
  if (!env.vnpayTmnCode || !env.vnpaySecureSecret) throw new AppError(503, 'VNPAY_UNAVAILABLE', 'VNPay chưa được cấu hình');
  const vnpay = new VNPay({ tmnCode: env.vnpayTmnCode, secureSecret: env.vnpaySecureSecret, testMode: true, hashAlgorithm: 'SHA512' });
  const now = vnpDate();
  const requestId = randomUUID().replaceAll('-', '');
  const common = { vnp_TxnRef: String(order.id), vnp_TransactionDate: Number(originalDate), vnp_TransactionNo: order.transactionID, vnp_IpAddr: req.ip || '127.0.0.1' };
  const original = await vnpay.queryDr({ ...common, vnp_RequestId: randomUUID().replaceAll('-', ''), vnp_OrderInfo: `Truy van don ${order.id}`, vnp_CreateDate: now });
  const isSandbox = env.nodeEnv !== 'production';
  const querySuccess = original.isVerified && original.isSuccess && String(original.vnp_TransactionStatus) === '00' && String(original.vnp_TxnRef) === String(order.id) && String(original.vnp_TransactionNo) === String(order.transactionID) && Number(original.vnp_Amount) === order.totalCost * 100;
  const sandboxQueryRejected = isSandbox && String(original.vnp_ResponseCode) === '99';
  if (!querySuccess && !sandboxQueryRejected) {
    throw new AppError(409, 'VNPAY_MISMATCH', 'Giao dịch gốc không khớp dữ liệu VNPay');
  }
  if (!order.paymentCreatedAt) await prisma.order.update({ where: { id: order.id }, data: { paymentCreatedAt: originalDate } });
  const claimed = await prisma.returnRequest.updateMany({ where: { id, status: 'APPROVED', refundCode: null }, data: { refundCode: requestId, refundMessage: 'Đã gửi yêu cầu hoàn tiền tới VNPay' } });
  if (!claimed.count) throw new AppError(409, 'REFUND_STATE', 'Yêu cầu hoàn tiền đã được gửi');
  try {
    const result = await vnpay.refund({
      ...common, vnp_RequestId: requestId, vnp_Amount: order.totalCost,
      vnp_OrderInfo: `Hoan tien don ${order.id}`, vnp_TransactionType: '02',
      vnp_CreateBy: `owner-${req.user.id}`, vnp_CreateDate: now,
    });
    const succeeded = result.isVerified && result.isSuccess && String(result.vnp_TransactionStatus) === '00' && String(result.vnp_TxnRef) === String(order.id) && Number(result.vnp_Amount) === order.totalCost;
    const sandboxMock = isSandbox && String(result.vnp_ResponseCode) === '99';
    const updated = await prisma.returnRequest.update({
      where: { id }, data: {
        ...(succeeded || sandboxMock ? { status: 'REFUNDED', refundAmount: order.totalCost, refundedById: req.user.id, refundedAt: new Date() } : {}),
        refundMessage: sandboxMock ? 'Môi trường Sandbox: Đã xác nhận hoàn tiền thành công (giả lập đối soát)' : succeeded ? 'Đã hoàn tiền qua VNPay' : result.message || result.vnp_Message || 'VNPay đang xử lý yêu cầu',
      },
    });
    await prisma.auditLog.create({ data: { actorId: req.user.id, action: 'UPDATE', entityType: 'ReturnRequest', entityId: id, details: { refundRequestId: requestId, responseCode: result.vnp_ResponseCode, transactionStatus: result.vnp_TransactionStatus, sandboxMock } } });
    res.json({ data: updated });
  } catch (error) {
    await prisma.returnRequest.update({ where: { id }, data: { refundMessage: 'Chưa xác định kết quả VNPay. Không gửi lại; cần đối soát mã ' + requestId } });
    throw error;
  }
});

export default router;
