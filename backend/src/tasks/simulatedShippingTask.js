import { autoMarkDelivered } from '../modules/order/order.service.js';
import { SIMULATED_SHIPPING } from '../config/order.js';

export async function run() {
  return autoMarkDelivered();
}

export function startSimulatedShippingTask() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await run(); }
    catch (error) { console.error('[simulated-shipping]', error); }
    finally { running = false; }
  };
  void tick();
  const timer = setInterval(tick, SIMULATED_SHIPPING.POLL_MS);
  timer.unref?.();
}
