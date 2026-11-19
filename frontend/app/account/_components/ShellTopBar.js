'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

export default function ShellTopBar({ title, subtitle, user, action }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const roleCode = getRoleCode(user);
  const workspaceLink = {
    STAFF: { href: '/store/orders', label: '🏪 Quản lý cửa hàng' },
    SHOP_OWNER: { href: '/store/orders', label: '🏪 Quản lý cửa hàng' },
    ADMIN: { href: '/admin/dashboard', label: '🛡️ Bảng điều khiển quản trị' },
    CUSTOMER: { href: '/', label: '🛒 Tiếp tục mua sắm' },
  }[roleCode] || { href: '/', label: '🛒 Tiếp tục mua sắm' };
  const roleLabels = {
    STAFF: 'Nhân viên',
    SHOP_OWNER: 'Chủ cửa hàng',
    ADMIN: 'Quản trị viên',
    CUSTOMER: 'Khách hàng',
  };
  const userLabel = roleLabels[roleCode] || user?.roleName;

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
        {user && <Link href={workspaceLink.href} className="eht-btn eht-btn-sm" title={workspaceLink.label}>
          {workspaceLink.label}
        </Link>}
        <button type="button" className="eht-icon-btn" title="Thông báo" aria-label="Thông báo">
          🔔
        </button>
        <Link href="/account/profile" className="eht-icon-btn" title="Cài đặt" aria-label="Cài đặt">
          ⚙
        </Link>
        <div ref={ref} style={{ position: 'relative' }}>
          <button type="button" className="eht-user-chip" onClick={() => setOpen((v) => !v)}>
            <span className="eht-avatar">
              {user?.avatar ? <Image src={user.avatar} alt="" width={40} height={40} unoptimized style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials(user?.fullName)}
            </span>
            <span>
              <p className="eht-user-label">{userLabel ? `Tài khoản ${userLabel}` : 'Tài khoản'}</p>
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
