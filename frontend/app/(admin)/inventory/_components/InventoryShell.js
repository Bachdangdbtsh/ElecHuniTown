'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiBarChart2,
  FiBell,
  FiBox,
  FiClipboard,
  FiGrid,
  FiLogOut,
  FiRefreshCw,
  FiSettings,
  FiTag,
} from 'react-icons/fi';

const navigation = [
  { label: 'Quản lý đơn hàng', icon: FiClipboard, disabled: true },
  { label: 'Đổi trả - Hoàn tiền', icon: FiRefreshCw, disabled: true },
  { label: 'Quản lý danh mục sản phẩm', icon: FiGrid, disabled: true },
];

export default function InventoryShell({ user, onLogout, children }) {
  const pathname = usePathname();
  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date());
  const isInventory = pathname.startsWith('/inventory');

  return (
    <div className="inv-shell">
      <aside className="inv-sidebar">
        <Link className="inv-brand" href="/inventory" aria-label="ElecHuniTown - Quản lý cửa hàng">
          <img src="/inventory/brand-logo.png" alt="ElecHuniTown" width="118" height="42" />
          <span>
            <strong>ElecHuniTown</strong>
            <small>Quản lý cửa hàng</small>
          </span>
        </Link>

        <p className="inv-nav-caption">MENU CHÍNH</p>
        <nav className="inv-nav" aria-label="Menu quản lý">
          {navigation.map(({ label, icon: Icon }) => (
            <span className="inv-nav-link inv-nav-disabled" key={label} aria-disabled="true">
              <span className="inv-nav-icon"><Icon aria-hidden="true" /></span>
              <span>{label}</span>
            </span>
          ))}
          <Link
            href="/inventory"
            className={`inv-nav-link ${isInventory ? 'is-active' : ''}`}
            aria-current={isInventory ? 'page' : undefined}
          >
            <span className="inv-nav-icon"><FiBox aria-hidden="true" /></span>
            <span>Quản lý kho hàng</span>
            <span className="inv-nav-chevron" aria-hidden="true">›</span>
          </Link>
          <Link
            href="/statistics"
            className={`inv-nav-link ${pathname.startsWith('/statistics') ? 'is-active' : ''}`}
          >
            <span className="inv-nav-icon"><FiBarChart2 aria-hidden="true" /></span>
            <span>Thống kê tài chính</span>
          </Link>
        </nav>

        <div className="inv-sidebar-bottom">
          <div className="inv-sidebar-user">
            <span className="inv-avatar">{user.fullName?.slice(0, 1)?.toUpperCase() || 'U'}</span>
            <span className="inv-user-copy">
              <strong>{user.fullName}</strong>
              <small>{user.roleName || (user.role === 'STAFF' ? 'Nhân viên' : 'Chủ cửa hàng')}</small>
            </span>
          </div>
          <button type="button" className="inv-logout" onClick={onLogout}>
            <FiLogOut aria-hidden="true" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="inv-main-column">
        <header className="inv-topbar">
          <div className="inv-date">
            <span>{today}</span>
            <small><i /> Hệ thống vận hành ổn định</small>
          </div>
          <div className="inv-topbar-actions">
            <button type="button" className="inv-icon-button" aria-label="Thông báo">
              <FiBell aria-hidden="true" />
              <span className="inv-notification-dot" />
            </button>
            <button type="button" className="inv-icon-button" aria-label="Cài đặt">
              <FiSettings aria-hidden="true" />
            </button>
            <span className="inv-topbar-divider" />
            <span className="inv-avatar inv-avatar-top">{user.role === 'STAFF' ? 'STF' : 'QT'}</span>
            <span className="inv-greeting">
              <small>TÀI KHOẢN {user.role === 'STAFF' ? 'STAFF' : 'SHOP OWNER'}</small>
              <strong>Chào mừng, {user.role === 'STAFF' ? 'Staff' : 'Shop Owner'}</strong>
            </span>
            <FiGrid className="inv-greeting-chevron" aria-hidden="true" />
          </div>
        </header>
        <main className="inv-content">{children}</main>
      </div>
    </div>
  );
}
