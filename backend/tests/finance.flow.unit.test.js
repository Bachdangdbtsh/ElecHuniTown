import assert from 'node:assert/strict';
import test from 'node:test';
import { recordRefund, recordSale } from '../src/modules/finance/finance.service.js';

test('a paid sale increases cash once and a VNPay refund reverses it once', async () => {
  const movements = new Set();
  const audits = [];
  let balance = 100n;
  const tx = {
    financeMovement: {
      createMany: async ({ data }) => {
        const key = `${data[0].orderId}:${data[0].kind}`;
        if (movements.has(key)) return { count: 0 };
        movements.add(key);
        return { count: 1 };
      },
    },
    finance: {
      upsert: async ({ update }) => {
        balance += update.cashBalance.increment ?? -update.cashBalance.decrement;
        return { id: 1, cashBalance: balance };
      },
    },
    auditLog: { create: async ({ data }) => { audits.push(data); } },
  };
  const order = { id: 42, totalCost: 899000 };

  assert.equal(await recordSale(tx, order, 7), true);
  assert.equal(await recordSale(tx, order, 7), false);
  assert.equal(balance, 899100n);
  assert.equal(await recordRefund(tx, order, 7), true);
  assert.equal(await recordRefund(tx, order, 7), false);
  assert.equal(balance, 100n);
  assert.deepEqual(audits.map((log) => log.details.kind), ['SALE', 'REFUND']);
});
