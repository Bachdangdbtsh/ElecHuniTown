'use client';

import { useEffect, useRef, useState } from 'react';

export default function ShippingTimer({ shippedAt, delayMs, onExpired }) {
  const deadline = new Date(shippedAt).getTime() + delayMs;
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Date.now()));
  const lastRefresh = useRef(0);

  useEffect(() => {
    lastRefresh.current = 0;
    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left === 0 && Date.now() - lastRefresh.current >= 5_000) {
        lastRefresh.current = Date.now();
        onExpired();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, onExpired]);

  return <p className="staff-subtitle">
    {remaining > 0 ? `Đang giao tới khách: còn ${Math.ceil(remaining / 1000)} giây.` : 'Đang cập nhật trạng thái giao hàng…'}
  </p>;
}
