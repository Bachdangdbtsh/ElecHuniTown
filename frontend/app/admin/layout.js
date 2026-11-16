'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApi } from './_lib/useApi';
import AdminTopBar from './_components/AdminTopBar';
import BrandLogo from '@/components/BrandLogo';
import '../eht-ui.css';

const MENU = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: '▦' },
  { label: 'Tài khoản người dùng', href: '/admin/users', icon: '☺' },
  { label: 'Phân tích truy cập', href: '/admin/access-analytics', icon: '▥' },
  { label: 'Yêu cầu thay đổi', href: '/admin/change-requests', icon: '✓' },
  { label: 'Vai trò & Phân quyền', href: '/admin/roles', icon: '◎' },
];

function roleCode(data) {
  if (!data) return '';
  const r = data.role;
  if (typeof r === 'string') return r;
  return r?.code || '';
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const userState = useApi('/auth/me');
  // Chỉ gọi API admin sau khi đã xác nhận ADMIN — tránh 403 → nhiễu
  const pendingState = useApi(
    userState.status === 'success' && roleCode(userState.data) === 'ADMIN'
      ? '/admin/change-requests'
      : null,
  );

  useEffect(() => {
    if (userState.status === 'loading' || userState.status === 'idle') return;

    if (userState.status === 'error') {
      const status = userState.error?.status;
      // Chỉ đá login khi thật sự chưa auth (401) hoặc lỗi token
      if (!status || status === 401) {
        router.replace('/login?redirect=' + encodeURIComponent(pathname || '/admin/dashboard'));
      }
      return;
    }

    const role = roleCode(userState.data);
    if (role !== 'ADMIN') {
      if (role === 'SHOP_OWNER' || role === 'STAFF') {
        router.replace('/store/orders');
      } else {
        router.replace('/account/overview');
      }
    }
  }, [userState.status, userState.data, userState.error, router, pathname]);

  const pending =
    Array.isArray(pendingState.data)
      ? pendingState.data.filter((r) => r.status === 'PENDING' || r.status === 'pending').length
      : 0;

  if (userState.status === 'loading' || userState.status === 'idle') {
    return (
      <div className="eht-shell" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontWeight: 600, color: '#64748b' }}>Đang xác thực phiên quản trị…</p>
      </div>
    );
  }

  if (userState.status === 'error' || roleCode(userState.data) !== 'ADMIN') {
    return (
      <div className="eht-shell" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontWeight: 600, color: '#64748b' }}>Đang chuyển hướng…</p>
      </div>
    );
  }

  return (
    <div className="eht-shell">
      <aside className="eht-side">
        <Link href="/" className="eht-side-brand">
          <BrandLogo className="eht-side-brand-icon" />
          <span>
            <p className="eht-side-brand-title">ElecHuniTown</p>
            <p className="eht-side-brand-sub">Quản trị hệ thống</p>
          </span>
        </Link>
        <p className="eht-side-label">Menu chính</p>
        <nav aria-label="Menu quản trị">
          <ul className="eht-nav">
            {MENU.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link href={item.href} className={active ? 'active' : undefined}>
                    <span className="eht-nav-ico">{item.icon}</span>
                    {item.label}
                    {item.href.includes('change-requests') && pending > 0 && (
                      <span className="eht-nav-badge">{pending}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <div className="eht-body">
        <AdminTopBar user={userState.data} notifications={pending + 4} />
        <div className="eht-content">{children}</div>
      </div>
    </div>
  );
}
