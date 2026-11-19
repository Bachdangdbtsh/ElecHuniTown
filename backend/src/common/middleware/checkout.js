import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';

export async function guardCheckout(req, res, next) {
  try {
    const token = req.cookies?.token;
    const userId = token ? jwt.verify(token, env.jwtSecret).userId : null;
    if (!userId) return res.status(401).json({ code: 'error', message: 'Vui lòng đăng nhập để đặt hàng' });

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user?.isActive || user.role.code !== 'CUSTOMER') {
      return res.status(403).json({ code: 'error', message: 'Tài khoản không thể đặt hàng' });
    }

    if (req.path === '/create' && req.method === 'POST') {
      const { name, phone, address, addressType, paymentMethod, cart } = req.body ?? {};
      if (![name, phone, address].every((value) => typeof value === 'string' && value.trim())
        || !['home', 'company'].includes(addressType)
        || !['money', 'bank'].includes(paymentMethod)
        || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ code: 'error', message: 'Thông tin đặt hàng không hợp lệ' });
      }

      const ids = cart.map((item) => Number(item.id));
      if (new Set(ids).size !== ids.length || ids.some((id) => !Number.isInteger(id) || id < 1)) {
        return res.status(400).json({ code: 'error', message: 'Sản phẩm trong giỏ không hợp lệ' });
      }
      const products = await prisma.product.findMany({ where: { id: { in: ids }, status: 'ACTIVE' } });
      const byId = new Map(products.map((product) => [product.id, product]));
      const verifiedCart = [];
      for (const item of cart) {
        const product = byId.get(Number(item.id));
        const quantity = Number(item.quantity);
        if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
          return res.status(400).json({ code: 'error', message: 'Sản phẩm đã hết hàng hoặc số lượng không hợp lệ' });
        }
        verifiedCart.push({ id: product.id, quantity, oldPrice: product.oldPrice, newPrice: product.newPrice });
      }
      req.body = { ...req.body, name: name.trim(), phone: phone.trim(), address: address.trim(), cart: verifiedCart };
    } else if (/^\/(payment|pay)\/\d+$/.test(req.path)) {
      const order = await prisma.order.findUnique({ where: { id: Number(req.path.split('/').pop()) } });
      if (!order || order.customerId !== userId) {
        return res.status(404).json({ code: 'error', message: 'Không tìm thấy đơn hàng' });
      }
      if (req.path.startsWith('/pay/') && (order.paymentMethod !== 'bank' || order.paymentMethodStatus)) {
        return res.status(400).json({ code: 'error', message: 'Đơn hàng không cần thanh toán trực tuyến' });
      }
    }
    next();
  } catch {
    return res.status(401).json({ code: 'error', message: 'Phiên đăng nhập đã hết hạn' });
  }
}

export async function guardPaymentReturn(req, res, next) {
  const orderId = Number(req.query.vnp_TxnRef);
  const amount = Number(req.query.vnp_Amount);
  if (!Number.isSafeInteger(orderId) || !Number.isSafeInteger(amount)) {
    return res.status(400).send('Thông tin giao dịch không hợp lệ');
  }
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentMethod !== 'bank' || amount !== order.totalCost * 100) {
      return res.status(400).send('Đơn hàng hoặc số tiền thanh toán không hợp lệ');
    }
    next();
  } catch {
    return res.status(500).send('Không thể kiểm tra giao dịch');
  }
}
