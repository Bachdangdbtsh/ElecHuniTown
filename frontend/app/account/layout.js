'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApi } from './_lib/useApi';
import BrandLogo from '@/components/BrandLogo';
import '../eht-ui.css';

const menu = [
  { label: 'Tổng quan', href: '/account/overview', icon: '⌂' },
  { label: 'Hồ sơ của tôi', href: '/account/profile', icon: '☺' },
  { label: 'Đơn hàng của tôi', href: '/account/orders', icon: '▣' },
  { label: 'Sổ địa chỉ', href: '/account/addresses', icon: '⌖' },
];

function getRoleCode(user) {
  const role = typeof user?.role === 'string' ? user.role : user?.role?.code;
  if (role) return role;
  return {
    'Nhân viên': 'STAFF',
    'Chủ cửa hàng': 'SHOP_OWNER',
    'Chủ ứng dụng': 'SHOP_OWNER',
    'Quản trị viên': 'ADMIN',
    'Khách hàng': 'CUSTOMER',
  }[user?.roleName] || '';
}

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const userState = useApi('/auth/me');
  const roleCode = getRoleCode(userState.data);
  const visibleMenu = roleCode === 'CUSTOMER'
    ? menu
    : menu.filter((item) => ['/account/overview', '/account/profile'].includes(item.href));

  useEffect(() => {
    if (userState.status === 'error') {
      router.replace('/login?redirect=' + encodeURIComponent(pathname || '/account/overview'));
    }
  }, [userState.status, router, pathname]);

  return (
    <div className="eht-shell">
      <aside className="eht-side">
        <Link href="/" className="eht-side-brand">
          <BrandLogo className="eht-side-brand-icon" />
          <span>
            <p className="eht-side-brand-title">ElecHuniTown</p>
            <p className="eht-side-brand-sub">Tài khoản của tôi</p>
          </span>
        </Link>
        {userState.status === 'success' && roleCode === 'ADMIN' && (
          <div style={{ margin: '0 0 12px', padding: '10px 12px', background: '#fff', borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>Bạn đang dùng tài khoản Quản trị</p>
            <Link href="/admin/dashboard" className="eht-btn eht-btn-primary eht-btn-sm" style={{ marginTop: 8, display: 'inline-flex' }}>
              Vào bảng quản trị →
            </Link>
          </div>
        )}
        {['SHOP_OWNER', 'STAFF'].includes(roleCode) && (
          <div style={{ margin: '0 0 12px', padding: '10px 12px', background: '#fff', borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>Tài khoản cửa hàng</p>
            <Link href="/store/orders" className="eht-btn eht-btn-primary eht-btn-sm" style={{ marginTop: 8, display: 'inline-flex' }}>
              Vào quản lý cửa hàng →
            </Link>
          </div>
        )}
        <nav aria-label="Menu tài khoản">
          <ul className="eht-nav">
            {visibleMenu.map((item) => {
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
      <div className="eht-body">{children}</div>
    </div>
  );
}
