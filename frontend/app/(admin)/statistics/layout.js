import { Plus_Jakarta_Sans } from 'next/font/google';
import AdminShell from '@/components/admin/AdminShell';
import '@/components/admin/admin.css';
import './statistics.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata = {
  title: 'Thống kê tài chính · ElecHuniTown',
};

// TODO: khi có thêm trang quản lý khác, chuyển file này lên app/(admin)/layout.js để dùng chung khung.
export default function StatisticsLayout({ children }) {
  return (
    <div className={`${jakarta.variable} adm-root`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
