'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Đăng xuất từ header mua hàng — clear cookie httpOnly qua proxy /api/backend.
 */
export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/backend/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      /* vẫn điều hướng */
    } finally {
      router.push('/');
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="account-logout"
      title="Đăng xuất"
    >
      {loading ? '...' : 'Đăng xuất'}
    </button>
  );
}
