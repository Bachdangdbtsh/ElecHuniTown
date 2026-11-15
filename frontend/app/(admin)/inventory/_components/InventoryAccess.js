'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { InventoryUserProvider } from './InventoryUserContext';

export default function InventoryAccess({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    apiGet('/auth/me', controller.signal)
      .then((currentUser) => {
        const allowed = ['SHOP_OWNER', 'STAFF'].includes(currentUser.role);
        if (!allowed) {
          router.replace(currentUser.role === 'ADMIN' ? '/admin/dashboard' : '/account/overview');
          return;
        }
        setUser(currentUser);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        router.replace('/login');
      });
    return () => controller.abort();
  }, [router]);

  if (status !== 'ready') {
    return (
      <div className="inv-access-state" role="status">
        Đang xác thực tài khoản…
      </div>
    );
  }

  return (
    <InventoryUserProvider user={user}>
      <div className="inv-root">{children}</div>
    </InventoryUserProvider>
  );
}
