import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../src/lib/prisma.js';
import { approveReceiptInTransaction } from '../src/source/Inventory/InventoryRepository.js';
import { recordRefund, recordSale } from '../src/modules/finance/finance.service.js';
import { getFinance } from '../src/modules/statistic/statistic.repository.js';

test('supplier expense, sale income and refund remain consistent in one transaction', { skip: process.env.RUN_DB_TESTS !== '1' }, async (t) => {
  t.after(() => prisma.$disconnect());
  const [supplier, product, owner, before] = await Promise.all([
    prisma.supplier.findFirst({ select: { id: true } }),
    prisma.product.findFirst({ select: { id: true, stock: true } }),
    prisma.user.findFirst({ where: { role: { code: 'SHOP_OWNER' } }, select: { id: true } }),
    prisma.finance.findUnique({ where: { id: 1 } }),
  ]);
  if (!supplier || !product || !owner || !before) {
    t.skip('Supplier, product, shop owner, and Finance row are required');
    return;
  }

  const rollback = new Error('ROLLBACK_FINANCE_TEST');
  try {
    await prisma.$transaction(async (tx) => {
      const receipt = await tx.stockReceipt.create({
        data: {
          code: `TEST-${Date.now()}`,
          status: 'PENDING_HANDLE',
          content: 'Finance transaction test',
          supplierId: supplier.id,
          createdById: owner.id,
          items: { create: [{ productId: product.id, quantity: 2, unitCost: 123 }] },
        },
      });

      const approved = await approveReceiptInTransaction(tx, receipt.id, owner.id);
      assert.equal(approved.status, 'APPROVED');
      assert.equal(await approveReceiptInTransaction(tx, receipt.id, owner.id), null);

      const [finance, stock, logs] = await Promise.all([
        tx.finance.findUnique({ where: { id: 1 } }),
        tx.product.findUnique({ where: { id: product.id }, select: { stock: true } }),
        tx.auditLog.findMany({ where: { entityType: 'Finance', entityId: 1, details: { path: ['receiptId'], equals: receipt.id } } }),
      ]);
      assert.equal(finance.cashBalance, before.cashBalance - 246n);
      assert.equal(finance.totalExpense, before.totalExpense + 246n);
      assert.equal(stock.stock, product.stock + 2);
      assert.equal(logs.length, 1);

      const recipient = await tx.recipientInfo.create({
        data: { recipientName: 'Finance test', recipientPhoneNumber: '0000000000', address: 'Finance test' },
      });
      const order = await tx.order.create({
        data: {
          recipientId: recipient.id,
          status: 'DELIVERED',
          paymentMethod: 'bank',
          paymentMethodStatus: true,
          shippingFee: 0,
          discount: 0,
          subtotal: 899000,
          totalCost: 899000,
        },
      });
      assert.equal(await recordSale(tx, order, owner.id), true);
      assert.equal(await recordSale(tx, order, owner.id), false);
      assert.equal((await tx.finance.findUnique({ where: { id: 1 } })).cashBalance, before.cashBalance - 246n + 899000n);
      assert.equal(await recordRefund(tx, order, owner.id), true);
      assert.equal(await recordRefund(tx, order, owner.id), false);
      assert.equal((await tx.finance.findUnique({ where: { id: 1 } })).cashBalance, before.cashBalance - 246n);
      assert.equal(await tx.financeMovement.count({ where: { orderId: order.id } }), 2);
      throw rollback;
    }, { maxWait: 10000, timeout: 30000 });
  } catch (error) {
    if (error !== rollback) throw error;
  }

  assert.deepEqual(await getFinance(), {
    cashBalance: Number(before.cashBalance),
    totalExpense: Number(before.totalExpense),
  });
});
