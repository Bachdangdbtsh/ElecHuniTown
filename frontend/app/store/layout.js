'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch, apiPost } from '@/lib/api';
import '../eht-ui.css';

const OWNER_MENU = [
  { label: 'Tiếp nhận & Xử lý đơn hàng', href: '/store/orders', icon: '🛒' },
  { label: 'Đổi trả, Hoàn tiền', href: '/store/returns', icon: '↺' },
  { label: 'Quản lý Danh mục Sản phẩm', href: '/store/categories', icon: '▦' },
  { label: 'Quản lý Kho hàng', href: '/store/inventory', icon: '⌂' },
  { label: 'Thống kê Tài chính', href: '/store/finance', icon: '▥' },
];

const STAFF_MENU = OWNER_MENU.filter((m) => m.href !== '/store/finance');

function initials(name) {
  return (name || 'SO')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function StoreLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }));
  }, []);

  useEffect(() => {
    apiFetch('/auth/me')
      .then((u) => {
        setUser(u);
        const role = u.role || '';
        if (!['ADMIN', 'SHOP_OWNER', 'STAFF', 'OWNER'].includes(role)) {
          router.replace('/account/overview');
        }
      })
      .catch(() => router.replace('/login?redirect=/store/orders'));
  }, [router]);

  const isOwner = ['ADMIN', 'SHOP_OWNER', 'OWNER'].includes(user?.role);
  const menu = isOwner ? OWNER_MENU : STAFF_MENU;
  const roleLabel = isOwner ? 'Shop Owner' : 'Nhân viên';
  
  async function logout() {
    try {
      await apiPost('/auth/logout');
    } finally {
      router.push('/login');
    }
  }

  return (
    <div className="eht-shell">
      <aside className="eht-side">
        <Link href="/" className="eht-side-brand">
          <span className="eht-side-brand-icon">EH</span>
          <span>
            <p className="eht-side-brand-title">ElecHuniTown</p>
            <p className="eht-side-brand-sub">Quản lý cửa hàng</p>
          </span>
        </Link>
        <p className="eht-side-label">Menu chính</p>
        <nav>
          <ul className="eht-nav">
            {menu.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link href={item.href} className={active ? 'active' : undefined}>
                    <span className="eht-nav-ico">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="eht-body">
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
            <button type="button" className="eht-icon-btn">
              🔔<span className="eht-icon-badge">4</span>
            </button>
            <button type="button" className="eht-icon-btn">⚙</button>
            <div style={{ position: 'relative' }}>
              <button type="button" className="eht-user-chip" onClick={() => setOpen((v) => !v)}>
                <span className="eht-avatar">{initials(user?.fullName)}</span>
                <span>
                  <p className="eht-user-label">Tài khoản {roleLabel}</p>
                  <p className="eht-user-name">Chào mừng, {roleLabel}!</p>
                </span>
                <span style={{ opacity: 0.5 }}>▾</span>
              </button>
              {open && (
                <div className="eht-dropdown">
                  <p style={{ margin: '4px 12px 8px', fontSize: 12, color: '#64748b' }}>{user?.fullName}</p>
                  <Link href="/account/profile" onClick={() => setOpen(false)}>👤 Hồ sơ</Link>
                  <button type="button" className="danger" onClick={logout}>↪ Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="eht-content">{children}</div>
      </div>
    </div>
  );
}
