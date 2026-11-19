'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch, apiPost } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';
import Avatar from '@/app/(common)/Avatar';
import { FiBell, FiBox, FiChevronDown, FiClipboard, FiGrid, FiPackage, FiRefreshCw, FiSettings, FiShoppingBag, FiTrendingUp, FiUsers } from 'react-icons/fi';
import '../eht-ui.css';
import '../staff/staff.css';
import './store.css';

const OWNER_MENU = [
  { label: 'Xử lý & Quản lý Đơn hàng', href: '/store/orders', icon: FiShoppingBag },
  { label: 'Đổi trả - Hoàn tiền', href: '/store/returns', icon: FiRefreshCw, ownerOnly: true },
  { label: 'Quản lý Danh mục Sản phẩm', href: '/store/categories', icon: FiGrid },
  { label: 'Quản lý Kho hàng', href: '/inventory', icon: FiBox },
  { label: 'Thống kê Tài chính', href: '/statistics', icon: FiTrendingUp, ownerOnly: true },
];

const OWNER_ONLY_NOTICE = 'Chỉ có Shop Owner mới có quyền truy cập.';

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
  const [accessNotice, setAccessNotice] = useState('');
  const [inventoryOpen, setInventoryOpen] = useState(() => pathname.startsWith('/inventory'));
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
  const menu = ready ? OWNER_MENU : [];
  const roleLabel = isOwner ? 'Shop Owner' : 'Nhân viên';
  const restrictedPath = !isOwner && (pathname.startsWith('/store/returns') || pathname.startsWith('/statistics'));
  const allowed = !restrictedPath;

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
          <BrandLogo className="eht-side-brand-icon" />
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
              const disabled = item.ownerOnly && !isOwner;
              if (item.href === '/inventory') return (
                <li key={item.href}>
                  <div className={`eht-nav-inventory ${active ? 'active' : ''}`}>
                    <Link href="/inventory" onClick={() => setInventoryOpen(true)}>
                      <span className="eht-nav-ico"><FiBox /></span>
                      {item.label}
                    </Link>
                    <button type="button" className="eht-nav-expand" aria-label={inventoryOpen ? 'Thu gọn mục kho hàng' : 'Mở mục kho hàng'} aria-expanded={inventoryOpen} aria-controls="store-inventory-submenu" onClick={() => setInventoryOpen((value) => !value)}><FiChevronDown /></button>
                  </div>
                  {inventoryOpen && <ul className="eht-nav-submenu" id="store-inventory-submenu">
                    <li><Link href="/inventory?view=inventory"><FiPackage /> Quản lý hàng tồn kho</Link></li>
                    <li>{isOwner ? <Link href="/inventory?view=pending"><FiClipboard /> Duyệt phiếu nhập/xuất kho</Link> : <button type="button" onClick={() => setAccessNotice('inventory-approval')}><FiClipboard /> Duyệt phiếu nhập/xuất kho</button>}</li>
                    <li><Link href="/inventory/suppliers"><FiUsers /> Quản lý nhà cung cấp</Link></li>
                  </ul>}
                  {!isOwner && accessNotice === 'inventory-approval' && <small className="eht-nav-notice" role="status">{OWNER_ONLY_NOTICE}</small>}
                </li>
              );
              return (
                <li key={item.href}>
                  {disabled ? <button
                    type="button"
                    className="eht-nav-disabled"
                    onClick={() => setAccessNotice(item.href)}
                  >
                    <span className="eht-nav-ico"><item.icon /></span>
                    {item.label}
                  </button> : <Link href={item.href} className={active ? 'active' : undefined}>
                    <span className="eht-nav-ico"><item.icon /></span>
                    {item.label}
                  </Link>}
                  {disabled && accessNotice === item.href && <small className="eht-nav-notice" role="status">{OWNER_ONLY_NOTICE}</small>}
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
            <span className="eht-icon-btn" aria-label="Thông báo"><FiBell /></span>
            <span className="eht-icon-btn" aria-label="Cài đặt"><FiSettings /></span>
            <div style={{ position: 'relative' }}>
              <button type="button" className="eht-user-chip" onClick={() => setOpen((v) => !v)}>
                <Avatar src={user?.avatar} alt="" size={40} fallback={initials(user?.fullName)} className="eht-avatar" />
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
        <div className="eht-content">{ready && allowed ? children : ready ? <div className="store-access-notice" role="status">{OWNER_ONLY_NOTICE}</div> : <p>Đang kiểm tra quyền truy cập…</p>}</div>
      </div>
    </div>
  );
}
