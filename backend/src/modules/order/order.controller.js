import * as service from './order.service.js';

export async function markDelivered(req, res) {
  res.json({ data: await service.markDelivered(service.validOrderId(req.params.id), req.user.id) });
}

export async function confirmDelivered(req, res) {
  res.json({ data: await service.confirmDelivered(service.validOrderId(req.params.id), req.user) });
}

export async function cancelOrder(req, res) {
  res.json({ data: await service.cancelOrderByCustomer(service.validOrderId(req.params.id), req.user) });
}
