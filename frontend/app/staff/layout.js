'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const legacyRoutes = {
  '/staff/orders': '/store/orders',
  '/staff/categories': '/store/categories/list',
  '/staff/products': '/store/categories/products',
};

export default function StaffLayout() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => { router.replace(legacyRoutes[pathname] || '/store/orders'); }, [pathname, router]);
  return <p role="status" style={{ padding: 24 }}>Đang chuyển tới khu vực quản lý cửa hàng…</p>;
}
