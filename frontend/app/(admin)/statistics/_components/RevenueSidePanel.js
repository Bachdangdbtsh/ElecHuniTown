'use client';

import { formatCompactVnd, formatVnd } from '../_lib/format';
import { formatDate } from '../_lib/dates';

/** Panel xanh tóm tắt doanh thu tháng, đặt cạnh biểu đồ. */
export default function RevenueSidePanel({ state, month }) {
  const d = state.data;
  const bestDay = d?.bestDay;

  return (
    <aside className="st-revenue-side" aria-label={`Doanh thu tháng ${month}`}>
      <p className="st-revenue-side-label">Doanh thu tháng {month}</p>
      <p className="st-revenue-side-value">
        {d ? `${formatCompactVnd(d.revenue.value)} ₫` : '…'}
      </p>
      <div className="st-revenue-side-row">
        <span>Giá trị đơn trung bình</span>
        <strong>{d ? formatVnd(d.averageOrderValue) : '…'}</strong>
      </div>
      <div className="st-revenue-side-row">
        <span>Ngày bán tốt nhất</span>
        <strong>
          {bestDay ? `${formatDate(bestDay.date)} · ${formatCompactVnd(bestDay.revenue)} ₫` : '—'}
        </strong>
      </div>
    </aside>
  );
}
