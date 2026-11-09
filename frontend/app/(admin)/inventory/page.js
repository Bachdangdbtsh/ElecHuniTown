'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import InventoryWorkspace from './_components/InventoryWorkspace';

function InventoryPageContent() {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const initialView = ['inventory', 'lowStock', 'pending', 'processed'].includes(requestedView)
    ? requestedView
    : 'dashboard';
  const requestedStatus = searchParams.get('status');
  const initialStatus = ['APPROVED', 'DENIED'].includes(requestedStatus) ? requestedStatus : 'all';

  return (
    <InventoryWorkspace
      key={`${initialView}:${initialStatus}`}
      initialView={initialView}
      initialStatus={initialStatus}
    />
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="inv-access-state" role="status">Đang tải dữ liệu kho…</div>}>
      <InventoryPageContent />
    </Suspense>
  );
}
