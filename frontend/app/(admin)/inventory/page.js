import { Suspense } from 'react';
import InventoryPageContent from './_components/InventoryPageContent';

export const instant = false;

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="inv-access-state" role="status">Đang tải dữ liệu kho…</div>}>
      <InventoryPageContent />
    </Suspense>
  );
}
