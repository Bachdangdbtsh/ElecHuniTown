'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV } from './nav';

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu chính">
      <ul className="adm-nav">
        {ADMIN_NAV.map((item) => {
          if (!item.href) {
            return (
              <li key={item.label}>
                <span className="adm-nav-item adm-nav-soon" aria-disabled="true" title="Trang này chưa được xây dựng">
                  {item.label}
                </span>
              </li>
            );
          }
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.label}>
              <Link href={item.href} className="adm-nav-item" aria-current={active ? 'page' : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
