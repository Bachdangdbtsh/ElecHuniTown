// A unique movement per order and kind makes payment callbacks and staff updates idempotent.
async function recordMovement(tx, { orderId, kind, amount, actorId }) {
  const value = BigInt(amount);
  const created = await tx.financeMovement.createMany({
    data: [{ orderId, kind, amount: value }],
    skipDuplicates: true,
  });
  if (!created.count) return false;

  const finance = await tx.finance.upsert({
    where: { id: 1 },
    create: { id: 1, cashBalance: kind === 'SALE' ? value : -value, totalExpense: 0n },
    update: { cashBalance: kind === 'SALE' ? { increment: value } : { decrement: value } },
  });
  if (actorId) {
    await tx.auditLog.create({
      data: {
        actorId,
        action: 'UPDATE',
        entityType: 'Finance',
        entityId: 1,
        details: { orderId, kind, amount: value.toString(), cashBalance: finance.cashBalance.toString() },
      },
    });
  }
  return true;
}

export function recordSale(tx, order, actorId) {
  return recordMovement(tx, { orderId: order.id, kind: 'SALE', amount: order.totalCost, actorId });
}

export function recordRefund(tx, order, actorId) {
  return recordMovement(tx, { orderId: order.id, kind: 'REFUND', amount: order.totalCost, actorId });
}
