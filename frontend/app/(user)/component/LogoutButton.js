'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_URL ||
  'http://localhost:4000';

/**
 * Đăng xuất từ header mua hàng — clear cookie httpOnly qua backend.
 */
export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      /* vẫn điều hướng */
    } finally {
      window.dispatchEvent(new Event("cartUpdated"));
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
      className="login"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: loading ? 'wait' : 'pointer',
        font: 'inherit',
        color: 'inherit',
        padding: 0,
      }}
      title="Đăng xuất"
    >
      {loading ? '...' : 'Đăng xuất'}
    </button>
  );
}
