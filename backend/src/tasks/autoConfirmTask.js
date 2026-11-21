import { autoConfirmDelivered } from '../modules/order/order.service.js';
import { ORDER_AUTO_CONFIRM } from '../config/order.js';

export async function run() {
  return autoConfirmDelivered();
}

export function startAutoConfirmTask() {
  if (!ORDER_AUTO_CONFIRM.ENABLED) return;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await run(); }
    catch (error) { console.error('[auto-confirm-delivery]', error); }
    finally { running = false; }
  };
  void tick();
  const timer = setInterval(tick, ORDER_AUTO_CONFIRM.POLL_MS);
  timer.unref?.();
}
