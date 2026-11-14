import { Toaster } from 'sonner';
import InventoryAccess from './_components/InventoryAccess';
import './inventory.css';
import './supplier-management.css';

export const metadata = {
  title: 'Quản lý kho hàng · ElecHuniTown',
};

export default function InventoryLayout({ children }) {
  return (
    <div className="inv-root">
      <Toaster position="top-right" richColors />
      <InventoryAccess>{children}</InventoryAccess>
    </div>
  );
}
