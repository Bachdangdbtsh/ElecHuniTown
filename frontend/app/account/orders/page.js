'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ShellTopBar from '../_components/ShellTopBar';

export default function AccountOrdersPage() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    apiFetch('/auth/me').then(setUser).catch(() => {});
  }, []);

  return (
    <>
      <ShellTopBar title="Đơn hàng của tôi" subtitle="Theo dõi đơn đã đặt (liên kết module đơn hàng)" user={user} />
      <div className="eht-content">
        <div className="eht-card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Danh sách đơn hàng</p>
          <p style={{ color: 'var(--eht-muted)', fontSize: 14, marginBottom: 20 }}>
            Khi API đơn hàng của thành viên khác sẵn sàng, trang này sẽ hiển thị lịch sử đơn.
          </p>
          <Link href="/" className="eht-btn eht-btn-primary">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </>
  );
}
