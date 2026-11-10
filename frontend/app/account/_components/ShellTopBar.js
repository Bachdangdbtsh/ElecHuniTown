'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

function initials(name) {
  return (name || 'U')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ShellTopBar({ title, subtitle, user, action }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function logout() {
    try {
      await apiPost('/auth/logout');
    } finally {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <header className="eht-top">
      <div className="eht-top-left">
        <h1 className="eht-page-title">{title}</h1>
        {subtitle ? <p className="eht-page-sub">{subtitle}</p> : null}
      </div>
      <div className="eht-top-right">
        {action}
        <Link href="/" className="eht-btn eht-btn-sm" title="Tiếp tục mua sắm">
          🛒 Tiếp tục mua sắm
        </Link>
        <button type="button" className="eht-icon-btn" title="Thông báo" aria-label="Thông báo">
          🔔
        </button>
        <Link href="/account/profile" className="eht-icon-btn" title="Cài đặt" aria-label="Cài đặt">
          ⚙
        </Link>
        <div ref={ref} style={{ position: 'relative' }}>
          <button type="button" className="eht-user-chip" onClick={() => setOpen((v) => !v)}>
            <span className="eht-avatar">{initials(user?.fullName)}</span>
            <span>
              <p className="eht-user-label">Tài khoản khách hàng</p>
              <p className="eht-user-name">Xin chào, {user?.fullName?.split(' ').slice(-1)[0] || '…'}!</p>
            </span>
            <span style={{ opacity: 0.5 }}>▾</span>
          </button>
          {open && (
            <div className="eht-dropdown">
              <p style={{ margin: '4px 12px 8px', fontSize: 12, color: 'var(--eht-muted)' }}>{user?.fullName}</p>
              <Link href="/account/profile" onClick={() => setOpen(false)}>
                👤 Hồ sơ của tôi
              </Link>
              <button type="button" className="danger" onClick={logout}>
                ↪ Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
