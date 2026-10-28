'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { useApi } from './_lib/useApi';
import '../customer.css';

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const userState = useApi('/auth/me');

  useEffect(() => {
    if (userState.status === 'error') {
      router.push('/login');
    }
  }, [userState.status, router]);

  async function handleLogout() {
    try {
      await apiPost('/auth/logout');
    } finally {
      router.push('/login');
    }
  }

  const menu = [
    { label: 'Tổng quan', href: '/account/overview' },
    { label: 'Hồ sơ của tôi', href: '/account/profile' },
    { label: 'Sổ địa chỉ', href: '/account/addresses' },
  ];

  return (
    <div className="cust-shell">
      <aside className="cust-aside">
        <div>
          <p className="cust-brand">ElecHuniTown</p>
          <p className="cust-menu-title" style={{ marginTop: 4 }}>
            Tài khoản của tôi
          </p>
        </div>

        <nav aria-label="Menu tài khoản">
          <ul className="cust-nav">
            {menu.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`cust-nav-link ${active ? 'active' : ''}`}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="cust-user-box">
          <p className="cust-user-name">{userState.data?.fullName || 'Đang tải...'}</p>
          <p className="cust-user-role">{userState.data?.roleName || 'Khách hàng'}</p>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              marginTop: 12,
              background: 'none',
              border: 'none',
              color: 'var(--cust-danger)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="cust-main">{children}</main>
    </div>
  );
}