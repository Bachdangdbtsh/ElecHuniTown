'use client';

import { useEffect, useRef, useState } from 'react';

export default function DeliveryConfirmTimer({ deliveredAt, totalCost, config, onExpired }) {
  const deadline = new Date(deliveredAt).getTime() + config.autoConfirmDelayMs;
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Date.now()));
  const lastRefresh = useRef(0);

  useEffect(() => {
    lastRefresh.current = 0;
    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left === 0 && Date.now() - lastRefresh.current >= 10_000 && totalCost <= config.autoConfirmMaxAmount && config.autoConfirmEnabled) {
        lastRefresh.current = Date.now();
        onExpired();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, totalCost, config.autoConfirmMaxAmount, config.autoConfirmEnabled, onExpired]);

  const seconds = Math.ceil(remaining / 1000);
  return <p className="staff-subtitle">
    {remaining > 0 ? `Chờ khách xác nhận: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
      : totalCost > config.autoConfirmMaxAmount ? 'Hết thời gian chờ. Chủ shop cần xác nhận thủ công.'
        : config.autoConfirmEnabled ? 'Đang chờ hệ thống tự xác nhận…' : 'Tự xác nhận đang tắt.'}
  </p>;
}
