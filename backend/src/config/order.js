export const ORDER_AUTO_CONFIRM = Object.freeze({
  ENABLED: process.env.ORDER_AUTO_CONFIRM_ENABLED !== 'false',
  DELAY_MS: 60_000,
  MAX_AMOUNT: 2_000_000,
  POLL_MS: 10_000,
});

export const SIMULATED_SHIPPING = Object.freeze({
  DELAY_MS: 30_000,
  POLL_MS: 1_000,
});
