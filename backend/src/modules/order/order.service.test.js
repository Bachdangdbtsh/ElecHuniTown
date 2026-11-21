import test from 'node:test';
import assert from 'node:assert/strict';
import { autoConfirmDelivered, autoMarkDelivered, confirmDelivered, markDelivered } from './order.service.js';

function fakeDatabase(order) {
  const audit = [];
  const notifications = [];
  const matches = (where) => Object.entries(where).every(([key, value]) => {
    if (key === 'deliveredAt') return order.deliveredAt && order.deliveredAt <= value.lte;
    if (key === 'shippedAt') return order.shippedAt && order.shippedAt <= value.lte;
    if (key === 'totalCost') return order.totalCost <= value.lte;
    return order[key] === value;
  });
  const db = {
    order: {
      findMany: async ({ where }) => matches(where) ? [{ id: order.id }] : [],
      findFirst: async ({ where }) => matches(where) ? { ...order } : null,
      findUnique: async ({ where }) => order.id === where.id ? { ...order } : null,
      updateMany: async ({ where, data }) => {
        if (!matches(where)) return { count: 0 };
        Object.assign(order, data);
        return { count: 1 };
      },
    },
    user: { findMany: async () => [{ id: 7 }] },
    auditLog: { create: async ({ data }) => { audit.push(data); } },
    notification: { create: async ({ data }) => { notifications.push(data); } },
    $transaction: async (callback) => callback(db),
  };
  return { db, audit, notifications };
}

function order(totalCost, status = 'SHIPPING', deliveredAt = null) {
  return { id: 11, customerId: 3, totalCost, status, deliveredAt, paymentMethod: 'bank' };
}

test('markDelivered stores the timestamp and notifies both sides', async () => {
  const value = order(2_000_000);
  const { db, audit, notifications } = fakeDatabase(value);
  await markDelivered(11, 7, db);
  assert.equal(value.status, 'DELIVERED_PENDING_CONFIRM');
  assert.ok(value.deliveredAt instanceof Date);
  assert.equal(audit[0].details.from, 'SHIPPING');
  assert.deepEqual(notifications.map((item) => item.userId), [7, 3]);
  await assert.rejects(markDelivered(11, 7, db), { code: 'INVALID_TRANSITION' });
});

test('simulated shipping reaches customer after 30 seconds and notifies both sides', async () => {
  const value = { ...order(929_000), shippedAt: new Date(Date.now() - 31_000) };
  const { db, audit, notifications } = fakeDatabase(value);
  assert.equal(await autoMarkDelivered(db), 1);
  assert.equal(value.status, 'DELIVERED_PENDING_CONFIRM');
  assert.ok(value.deliveredAt instanceof Date);
  assert.equal(audit[0].actorId, null);
  assert.equal(audit[0].details.mode, 'SIMULATED_SHIPPING');
  assert.deepEqual(notifications.map((item) => item.userId), [7, 3]);
  assert.equal(await autoMarkDelivered(db), 0);
});

test('shipping does not complete before 30 seconds', async () => {
  const value = { ...order(929_000), shippedAt: new Date(Date.now() - 20_000) };
  const { db, notifications } = fakeDatabase(value);
  assert.equal(await autoMarkDelivered(db), 0);
  assert.equal(value.status, 'SHIPPING');
  assert.equal(notifications.length, 0);
});

test('auto confirms a due order at the inclusive limit once with system audit', async () => {
  const value = order(2_000_000, 'DELIVERED_PENDING_CONFIRM', new Date(Date.now() - 120_000));
  const { db, audit, notifications } = fakeDatabase(value);
  assert.equal(await autoConfirmDelivered(db), 1);
  assert.equal(value.status, 'DELIVERED_CONFIRMED');
  assert.equal(audit[0].action, 'AUTO_CONFIRM_DELIVERY');
  assert.equal(audit[0].actorId, null);
  assert.deepEqual(notifications.map((item) => item.type), ['ORDER_AUTO_CONFIRMED', 'ORDER_AUTO_CONFIRMED_CUSTOMER']);
  assert.equal(await autoConfirmDelivered(db), 0);
  assert.equal(audit.length, 1);
});

test('does not auto confirm expensive or newly delivered orders', async () => {
  for (const value of [order(2_000_001, 'DELIVERED_PENDING_CONFIRM', new Date(Date.now() - 120_000)),
    order(2_000_000, 'DELIVERED_PENDING_CONFIRM', new Date())]) {
    const { db, audit } = fakeDatabase(value);
    assert.equal(await autoConfirmDelivered(db), 0);
    assert.equal(value.status, 'DELIVERED_PENDING_CONFIRM');
    assert.equal(audit.length, 0);
  }
});

test('customer may confirm during the wait; owner can manually confirm expensive orders', async () => {
  const low = order(100_000, 'DELIVERED_PENDING_CONFIRM', new Date());
  const first = fakeDatabase(low);
  await confirmDelivered(11, { id: 3, role: 'CUSTOMER' }, first.db);
  assert.equal(low.status, 'DELIVERED_CONFIRMED');
  assert.equal(await autoConfirmDelivered(first.db), 0);

  const high = order(2_000_001, 'DELIVERED_PENDING_CONFIRM', new Date(Date.now() - 120_000));
  const second = fakeDatabase(high);
  await confirmDelivered(11, { id: 7, role: 'SHOP_OWNER' }, second.db);
  assert.equal(high.status, 'DELIVERED_CONFIRMED');
  assert.equal(second.audit[0].action, 'APPROVE');
});

test('expired low-value window prevents late customer confirmation and owner override', async () => {
  const expired = fakeDatabase(order(100_000, 'DELIVERED_PENDING_CONFIRM', new Date(Date.now() - 120_000)));
  await assert.rejects(confirmDelivered(11, { id: 3, role: 'CUSTOMER' }, expired.db), { code: 'CONFIRM_WINDOW_EXPIRED' });
  await assert.rejects(confirmDelivered(11, { id: 7, role: 'SHOP_OWNER' }, expired.db), { code: 'MANUAL_CONFIRM_LIMIT' });
  assert.equal(await autoConfirmDelivered(expired.db), 1);
});
