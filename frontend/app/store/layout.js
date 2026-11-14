'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch, apiPost } from '@/lib/api';
import { FiBell, FiBox, FiGrid, FiLogOut, FiRefreshCw, FiSettings, FiShoppingBag, FiTrendingUp } from 'react-icons/fi';
import '../eht-ui.css';
import '../staff/staff.css';
import './store.css';

const OWNER_MENU = [
  { label: 'Xử lý & Quản lý Đơn hàng', href: '/store/orders', icon: FiShoppingBag },
  { label: 'Đổi trả - Hoàn tiền', href: '/store/returns', icon: FiRefreshCw },
  { label: 'Quản lý Danh mục Sản phẩm', href: '/store/categories', icon: FiGrid },
  { label: 'Quản lý Kho hàng', href: '/inventory', icon: FiBox },
  { label: 'Thống kê Tài chính', href: '/statistics', icon: FiTrendingUp },
];

const STAFF_MENU = OWNER_MENU.filter((m) => ['/store/orders', '/store/categories'].includes(m.href));

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
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [today] = useState(() => new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Ho_Chi_Minh',
  }));

  useEffect(() => {
    apiFetch('/auth/me')
      .then((u) => {
        setUser(u);
        const role = u.role || '';
        if (!['SHOP_OWNER', 'STAFF'].includes(role)) {
          router.replace('/account/overview');
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace('/login?redirect=/store/orders'));
  }, [router]);

  const isOwner = user?.role === 'SHOP_OWNER';
  const menu = ready ? (isOwner ? OWNER_MENU : STAFF_MENU) : [];
  const roleLabel = isOwner ? 'Shop Owner' : 'Nhân viên';
  const allowed = isOwner || pathname === '/store' || pathname.startsWith('/store/orders') || pathname.startsWith('/store/categories');

  useEffect(() => {
    if (ready && !allowed) router.replace('/store/orders');
  }, [ready, allowed, router]);
  
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
        <Link href="/store/orders" className="eht-side-brand">
          <span className="eht-side-brand-icon"><FiShoppingBag /></span>
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
                    <span className="eht-nav-ico"><item.icon /></span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <button type="button" className="eht-side-logout" onClick={logout}><FiLogOut /> Đăng xuất</button>
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
            <span className="eht-icon-btn" aria-label="Thông báo"><FiBell /></span>
            <span className="eht-icon-btn" aria-label="Cài đặt"><FiSettings /></span>
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
        <div className="eht-content">{ready && allowed ? children : <p>Đang kiểm tra quyền truy cập…</p>}</div>
      </div>
    </div>
  );
}
