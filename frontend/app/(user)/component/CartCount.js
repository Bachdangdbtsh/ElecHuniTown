'use client';

import { useSyncExternalStore } from 'react';
import { readCart } from './cartStore';

function subscribe(callback) {
  window.addEventListener('cart:changed', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('cart:changed', callback);
    window.removeEventListener('storage', callback);
  };
}

function getSnapshot() {
  return readCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export default function CartCount() {
  const count = useSyncExternalStore(subscribe, getSnapshot, () => 0);
  return <div aria-label={`${count} sản phẩm trong giỏ`}>{count}</div>;
}
