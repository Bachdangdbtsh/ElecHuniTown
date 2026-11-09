'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const ADMIN_CONSOLE_MENU = [
  { label: 'Tổng quan', href: '/admin/dashboard' },
  { label: 'Tài khoản người dùng', href: '/admin/users' },
  { label: 'Theo dõi lượt truy cập', href: '/admin/access-analytics' },
  { label: 'Yêu cầu thay đổi', href: '/admin/change-requests' },
  { label: 'Phân quyền truy cập', href: '/admin/roles' },
];

export default function AdminConsoleNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu quản trị Admin">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {ADMIN_CONSOLE_MENU.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`adm-nav-item${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
