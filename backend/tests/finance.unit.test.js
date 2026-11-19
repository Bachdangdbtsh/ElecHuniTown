import assert from 'node:assert/strict';
import test from 'node:test';
import { approveReceiptInTransaction } from '../src/source/Inventory/InventoryRepository.js';

test('a receipt charges Finance once for quantity times unit cost', async () => {
  let status = 'PENDING_HANDLE';
  let stockAdded = 0;
  let cashBalance = 1000n;
  let totalExpense = 0n;
  const audits = [];
  const tx = {
    stockReceipt: {
      updateMany: async ({ where, data }) => {
        if (where.id !== 7 || status !== where.status) return { count: 0 };
        status = data.status;
        return { count: 1 };
      },
      findUnique: async () => ({ id: 7, status }),
    },
    stockReceiptItem: {
      findMany: async () => [
        { id: 1, productId: 11, quantity: 2, unitCost: 123 },
        { id: 2, productId: 12, quantity: 3, unitCost: 45 },
      ],
    },
    product: { update: async ({ data }) => { stockAdded += data.stock.increment; } },
    inventoryTransaction: { createMany: async ({ data }) => assert.equal(data.length, 2) },
    finance: {
      upsert: async ({ update }) => {
        cashBalance -= update.cashBalance.decrement;
        totalExpense += update.totalExpense.increment;
        return { id: 1, cashBalance, totalExpense };
      },
    },
    auditLog: { create: async ({ data }) => { audits.push(data); } },
  };

  assert.equal((await approveReceiptInTransaction(tx, 7, 9)).status, 'APPROVED');
  assert.equal(await approveReceiptInTransaction(tx, 7, 9), null);
  assert.equal(stockAdded, 5);
  assert.equal(cashBalance, 619n);
  assert.equal(totalExpense, 381n);
  assert.deepEqual(audits, [{
    actorId: 9,
    action: 'UPDATE',
    entityType: 'Finance',
    entityId: 1,
    details: { receiptId: 7, amount: '381', cashBalance: '619', totalExpense: '381' },
  }]);
});
