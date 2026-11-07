'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import InventoryShell from './InventoryShell';
import { InventoryUserProvider } from './InventoryUserContext';

export default function InventoryAccess({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    apiGet('/auth/me', controller.signal)
      .then((currentUser) => {
        const allowed = ['STAFF', 'SHOP_OWNER'].includes(currentUser.role)
          && currentUser.permissions?.includes('INVENTORY_VIEW');
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

  async function logout() {
    try {
      await apiPost('/auth/logout');
    } finally {
      router.replace('/login');
    }
  }

  if (status !== 'ready') {
    return (
      <div className="inv-access-state" role="status">
        Đang xác thực tài khoản…
      </div>
    );
  }

  return (
    <InventoryUserProvider user={user}>
      <InventoryShell user={user} onLogout={logout}>
        {children}
      </InventoryShell>
    </InventoryUserProvider>
  );
}
