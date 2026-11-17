import { Toaster } from 'sonner';
import InventoryAccess from './_components/InventoryAccess';
import StoreLayout from '../../store/layout';
import './inventory.css';
import './supplier-management.css';

export const metadata = {
  title: 'Quản lý kho hàng · ElecHuniTown',
};

export default function InventoryLayout({ children }) {
  return (
    <StoreLayout>
      <Toaster position="top-right" richColors />
      <InventoryAccess>{children}</InventoryAccess>
    </StoreLayout>
  );
}
