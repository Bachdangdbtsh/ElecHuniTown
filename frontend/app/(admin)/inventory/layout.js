import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import InventoryAccess from './_components/InventoryAccess';
import './inventory.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata = {
  title: 'Quản lý kho hàng · ElecHuniTown',
};

export default function InventoryLayout({ children }) {
  return (
    <div className={`${jakarta.variable} inv-root`}>
      <Toaster position="top-right" richColors />
      <InventoryAccess>{children}</InventoryAccess>
    </div>
  );
}
