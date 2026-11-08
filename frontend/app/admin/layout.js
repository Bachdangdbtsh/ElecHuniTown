'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { apiPost } from '@/lib/api';
import { useApi } from './_lib/useApi';
import AdminConsoleNav from './_components/AdminConsoleNav';
import '@/components/admin/admin.css';
import './admin-console.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-jakarta',
  display: 'swap',
});

export default function AdminLayout({ children }) {
  const router = useRouter();
  const userState = useApi('/auth/me');

  useEffect(() => {
    if (userState.status === 'error') {
      router.push('/login');
    } else if (userState.data && userState.data.role !== 'ADMIN') {
      alert('Bạn không có quyền truy cập trang Quản trị viên');
      router.push('/account/overview');
    }
  }, [userState.status, userState.data, router]);

  async function handleLogout() {
    try {
      await apiPost('/auth/logout');
    } finally {
      router.push('/login');
    }
  }

  return (
    <div className={`${jakarta.variable} adm-root`}>
      <div className="adm-shell">
        <aside className="adm-side">
          <p className="adm-brand">ElecHuniTown</p>
          <p className="adm-side-title">Bảng điều khiển Quản trị</p>
          <Suspense fallback={null}>
            <AdminConsoleNav />
          </Suspense>

          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: 13, fontWeight: 700 }}>{userState.data?.fullName || 'Đang tải...'}</p>
            <p style={{ fontSize: 12, opacity: 0.8 }}>Quản trị viên</p>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                marginTop: 10,
                background: 'none',
                border: 'none',
                color: 'var(--down)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                padding: 0,
              }}
            >
              [→ Đăng xuất
            </button>
          </div>
        </aside>

        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}