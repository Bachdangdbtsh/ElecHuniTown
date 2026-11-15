'use client';

import AsyncSection from './AsyncSection';
import { formatCompactVnd, formatNumber, formatPct, formatVnd } from '../_lib/format';
import { formatDate } from '../_lib/dates';

function Delta({ pct, abs, unit }) {
  if (pct === null) return <p className="st-delta st-delta-flat">Chưa có kỳ trước để so sánh</p>;
  const dir = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '';
  return (
    <p className={`st-delta st-delta-${dir}`}>
      {arrow} {formatPct(pct)} so với kỳ trước
      {abs !== undefined && abs !== 0 && (
        <span className="st-delta-abs">
          {abs > 0 ? '+' : '−'}
          {formatNumber(Math.abs(abs))} {unit}
        </span>
      )}
    </p>
  );
}

export default function KpiPanel({ state }) {
  return (
    <AsyncSection state={state} minHeight={150}>
      {(d) => (
        <div className="st-kpi">
          <div className="st-kpi-main">
            <div className="st-kpi-item">
              <p className="st-kpi-label">Tổng doanh thu</p>
              <p className="st-kpi-value" title={formatVnd(d.revenue.value)}>
                {formatCompactVnd(d.revenue.value)} <span className="st-kpi-unit">₫</span>
              </p>
              <Delta pct={d.revenue.changePct} />
            </div>
            <div className="st-kpi-item">
              <p className="st-kpi-label">Tổng số đơn hàng</p>
              <p className="st-kpi-value">{formatNumber(d.orders.value)}</p>
              <Delta pct={d.orders.changePct} abs={d.orders.changeAbs} unit="đơn" />
            </div>
            <div className="st-kpi-item">
              <p className="st-kpi-label">Khách hàng mới</p>
              <p className="st-kpi-value">{formatNumber(d.newCustomers.value)}</p>
              <Delta pct={d.newCustomers.changePct} abs={d.newCustomers.changeAbs} unit="khách" />
            </div>
          </div>
          <dl className="st-kpi-side">
            <div>
              <dt>Giá trị đơn trung bình</dt>
              <dd className="st-kpi-value">{formatCompactVnd(d.averageOrderValue)} <span className="st-kpi-unit">₫</span></dd>
              <div className="st-kpi-extra">
                <p><span>Ngày bán tốt nhất</span><strong>{d.bestDay ? `${formatDate(d.bestDay.date)} · ${formatCompactVnd(d.bestDay.revenue)} ₫` : '—'}</strong></p>
                <p><span>Sản phẩm đang bán</span><strong>{formatNumber(d.activeProducts)}</strong></p>
              </div>
            </div>
          </dl>
        </div>
      )}
    </AsyncSection>
  );
}
