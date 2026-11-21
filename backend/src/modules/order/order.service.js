import { prisma } from '../../lib/prisma.js';
import { notify } from '../../utils/notify.js';
import { AppError } from '../../common/error/AppError.js';
import { recordSale } from '../finance/finance.service.js';
import { ORDER_AUTO_CONFIRM, SIMULATED_SHIPPING } from '../../config/order.js';

const PENDING = 'DELIVERED_PENDING_CONFIRM';
const CONFIRMED = 'DELIVERED_CONFIRMED';

export function validOrderId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError(400, 'INVALID_ID', 'Mã đơn không hợp lệ');
  return id;
}

async function notifyOwners(tx, orderId, type, message, status) {
  const owners = await tx.user.findMany({
    where: { role: { code: 'SHOP_OWNER' }, isActive: true }, select: { id: true },
  });
  for (const owner of owners) {
    await notify({ userId: owner.id, role: 'SHOP_OWNER', type, message,
      url: '/store/orders', payload: { orderId, status } }, tx);
  }
}

export async function markDelivered(orderId, actorId, db = prisma, dueBefore = null) {
  return db.$transaction(async (tx) => {
    const deliveredAt = new Date();
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: 'SHIPPING', ...(dueBefore ? { shippedAt: { lte: dueBefore } } : {}) },
      data: { status: PENDING, deliveredAt },
    });
    if (!changed.count) throw new AppError(409, 'INVALID_TRANSITION', 'Đơn không còn ở trạng thái đang vận chuyển');
    const order = await tx.order.findUnique({ where: { id: orderId } });
    await tx.auditLog.create({ data: { actorId, action: 'UPDATE', entityType: 'Order', entityId: orderId,
      details: { from: 'SHIPPING', to: PENDING, mode: actorId ? 'MANUAL' : 'SIMULATED_SHIPPING', deliveredAt: deliveredAt.toISOString() } } });
    await notifyOwners(tx, orderId, 'ORDER_DELIVERED_PENDING_CONFIRM', `Đơn hàng #${orderId} đã giao tới khách và đang chờ khách xác nhận.`, PENDING);
    await notify({ userId: order.customerId, role: 'CUSTOMER', type: 'ORDER_DELIVERED_PENDING_CONFIRM',
      message: `Đơn hàng #${orderId} đã được giao. Vui lòng xác nhận đã nhận hàng.`,
      url: `/order/detail/${orderId}`, payload: { orderId, status: PENDING } }, tx);
    return order;
  });
}

export async function autoMarkDelivered(db = prisma) {
  const cutoff = new Date(Date.now() - SIMULATED_SHIPPING.DELAY_MS);
  const due = await db.order.findMany({
    where: { status: 'SHIPPING', shippedAt: { lte: cutoff } },
    select: { id: true }, take: 100, orderBy: { shippedAt: 'asc' },
  });
  let count = 0;
  for (const item of due) {
    try {
      await markDelivered(item.id, null, db, cutoff);
      count++;
    } catch (error) {
      if (error instanceof AppError && error.code === 'INVALID_TRANSITION') continue;
      throw error;
    }
  }
  return count;
}

async function confirm(tx, order, { actorId = null, mode }) {
  const changed = await tx.order.updateMany({ where: { id: order.id, status: PENDING }, data: { status: CONFIRMED } });
  if (!changed.count) return false;
  if (order.paymentMethod === 'money') await recordSale(tx, order, actorId);
  await tx.auditLog.create({ data: { actorId, action: mode === 'AUTO' ? 'AUTO_CONFIRM_DELIVERY' : 'APPROVE',
    entityType: 'Order', entityId: order.id,
    details: { from: PENDING, to: CONFIRMED, mode, confirmedAt: new Date().toISOString(), totalCost: order.totalCost } } });
  const auto = mode === 'AUTO';
  await notifyOwners(tx, order.id, auto ? 'ORDER_AUTO_CONFIRMED' : 'ORDER_DELIVERY_CONFIRMED',
    `Đơn hàng #${order.id} đã ${auto ? 'được hệ thống tự động' : 'được'} xác nhận giao hàng.`, CONFIRMED);
  await notify({ userId: order.customerId, role: 'CUSTOMER',
    type: auto ? 'ORDER_AUTO_CONFIRMED_CUSTOMER' : 'ORDER_DELIVERY_CONFIRMED',
    message: `Đơn hàng #${order.id} đã ${auto ? 'được hệ thống tự động' : 'được'} xác nhận giao hàng.`,
    url: `/order/detail/${order.id}`, payload: { orderId: order.id, status: CONFIRMED } }, tx);
  return true;
}

export async function confirmDelivered(orderId, actor, db = prisma) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng');
    if (order.status !== PENDING) throw new AppError(409, 'INVALID_TRANSITION', 'Đơn không còn chờ xác nhận');
    if (actor.role === 'CUSTOMER' && order.customerId !== actor.id) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không thể xác nhận đơn này');
    }
    if (actor.role === 'CUSTOMER' && ORDER_AUTO_CONFIRM.ENABLED && order.totalCost <= ORDER_AUTO_CONFIRM.MAX_AMOUNT
      && order.deliveredAt && Date.now() >= order.deliveredAt.getTime() + ORDER_AUTO_CONFIRM.DELAY_MS) {
      throw new AppError(409, 'CONFIRM_WINDOW_EXPIRED', 'Thời gian xác nhận đã hết');
    }
    if (actor.role === 'SHOP_OWNER' && order.totalCost <= ORDER_AUTO_CONFIRM.MAX_AMOUNT) {
      throw new AppError(403, 'MANUAL_CONFIRM_LIMIT', 'Đơn này sẽ được hệ thống tự xác nhận sau thời gian chờ');
    }
    if (!['CUSTOMER', 'SHOP_OWNER', 'ADMIN'].includes(actor.role)) throw new AppError(403, 'FORBIDDEN', 'Không có quyền xác nhận');
    const changed = await confirm(tx, order, { actorId: actor.id, mode: actor.role });
    if (!changed) throw new AppError(409, 'ORDER_CHANGED', 'Đơn vừa được xác nhận ở nơi khác');
    return tx.order.findUnique({ where: { id: orderId } });
  });
}

export async function autoConfirmDelivered(db = prisma) {
  if (!ORDER_AUTO_CONFIRM.ENABLED) return 0;
  const cutoff = new Date(Date.now() - ORDER_AUTO_CONFIRM.DELAY_MS);
  const due = await db.order.findMany({
    where: { status: PENDING, deliveredAt: { lte: cutoff }, totalCost: { lte: ORDER_AUTO_CONFIRM.MAX_AMOUNT } },
    select: { id: true }, take: 100, orderBy: { deliveredAt: 'asc' },
  });
  let count = 0;
  for (const item of due) {
    const changed = await db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: item.id, status: PENDING,
        deliveredAt: { lte: cutoff }, totalCost: { lte: ORDER_AUTO_CONFIRM.MAX_AMOUNT } } });
      if (!order) return false;
      return confirm(tx, order, { mode: 'AUTO' });
    });
    if (changed) count++;
  }
  return count;
}
