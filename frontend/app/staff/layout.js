'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import './staff.css';

const links = [
  ['/staff/orders', 'Đơn hàng'],
  ['/staff/products', 'Sản phẩm'],
  ['/staff/categories', 'Danh mục'],
];

export default function StaffLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    apiGet('/auth/me')
      .then((value) => {
        if (value?.role !== 'STAFF') {
          router.replace('/login');
          return;
        }
        setUser(value);
        setReady(true);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function logout() {
    try { await apiPost('/auth/logout'); } finally { router.replace('/login'); }
  }

  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <Link href="/staff/orders" className="staff-brand">ElecHuniTown</Link>
        <div className="staff-caption">Khu vực nhân viên</div>
        <nav className="staff-nav" aria-label="Điều hướng nhân viên">
          {links.map(([href, label]) => <Link key={href} href={href} className={pathname.startsWith(href) ? 'active' : ''}>{label}</Link>)}
        </nav>
        <div className="staff-user">
          <strong>{user?.fullName || 'Nhân viên'}</strong>
          <span>Nhân viên</span>
          <button type="button" onClick={logout}>Đăng xuất</button>
        </div>
      </aside>
      <main className="staff-main">{ready ? children : <div className="staff-loading">Đang kiểm tra tài khoản…</div>}</main>
    </div>
  );
}
