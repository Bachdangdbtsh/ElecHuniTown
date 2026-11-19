'use client';

import { useSearchParams } from 'next/navigation';
import InventoryWorkspace from './InventoryWorkspace';

export default function InventoryPageContent() {
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
