import { Suspense } from 'react';
import AdminNav from './AdminNav';

// Khung chung của khu quản lý (sidebar + vùng nội dung).
// Giao diện quản lý: nền trắng 60%, xanh mint #8FE3A9 30%, xanh đen #1E293B 10%.
export default function AdminShell({ children }) {
  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <p className="adm-brand">ElecHuniTown</p>
        <p className="adm-side-title">Quản lý cửa hàng</p>
        <Suspense fallback={null}>
          <AdminNav />
        </Suspense>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
