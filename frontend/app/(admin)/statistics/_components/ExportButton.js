'use client';

import { useState } from 'react';
import { apiDownload } from '../_lib/api';

export default function ExportButton({ range }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    if (!range || busy) return;
    setBusy(true);
    setError('');
    try {
      const qs = new URLSearchParams(range).toString();
      await apiDownload(`/statistics/export?${qs}`, `Bao_cao_tai_chinh_${range.from}_${range.to}.xlsx`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="st-export">
      <button type="button" className="st-btn st-btn-primary" onClick={handleClick} disabled={!range || busy}>
        {busy ? 'Đang xuất…' : 'Xuất báo cáo Excel'}
      </button>
      <p className="st-hint" role="status" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
