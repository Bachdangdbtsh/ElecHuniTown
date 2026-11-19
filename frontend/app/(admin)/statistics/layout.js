import StoreLayout from '../../store/layout';
import './statistics.css';

export const metadata = {
  title: 'Thống kê tài chính · ElecHuniTown',
};

// TODO: khi có thêm trang quản lý khác, chuyển file này lên app/(admin)/layout.js để dùng chung khung.
export default function StatisticsLayout({ children }) {
  return <StoreLayout>{children}</StoreLayout>;
}
