'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

function initials(name) {
  return (name || 'AD')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AdminTopBar({ user, notifications = 0 }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    );
  }, []);

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
      router.push('/login');
    }
  }

  return (
    <header className="eht-top">
      <div className="eht-top-left">
        <p className="eht-top-meta" style={{ margin: 0, textTransform: 'capitalize' }}>
          {today || '…'}
        </p>
        <p className="eht-top-status" style={{ margin: '4px 0 0' }}>
          <span className="eht-dot" /> Hệ thống vận hành ổn định
        </p>
      </div>
      <div className="eht-top-right">
        <button type="button" className="eht-icon-btn" title="Thông báo">
          🔔
          {notifications > 0 && <span className="eht-icon-badge">{notifications}</span>}
        </button>
        <button type="button" className="eht-icon-btn" title="Cài đặt">
          ⚙
        </button>
        <div ref={ref} style={{ position: 'relative' }}>
          <button type="button" className="eht-user-chip" onClick={() => setOpen((v) => !v)}>
            <span className="eht-avatar">{initials(user?.fullName)}</span>
            <span>
              <p className="eht-user-label">Tài khoản quản lý</p>
              <p className="eht-user-name">Chào mừng, Quản trị viên!</p>
            </span>
            <span style={{ opacity: 0.5 }}>▾</span>
          </button>
          {open && (
            <div className="eht-dropdown">
              <p style={{ margin: '4px 12px 8px', fontSize: 12, color: '#64748b' }}>{user?.fullName}</p>
              <Link href="/account/profile" onClick={() => setOpen(false)}>
                👤 Hồ sơ
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
