'use client';

import { useState } from 'react';
import AsyncSection from './AsyncSection';
import { formatCompactVnd, formatVnd } from '../_lib/format';
import { formatDate, formatDayMonth } from '../_lib/dates';

const W = 860;
const H = 300;
const M = { l: 58, r: 16, t: 16, b: 32 };
const PW = W - M.l - M.r;
const PH = H - M.t - M.b;

// Làm tròn trần trục Y lên một mốc "đẹp" (1, 2, 2.5, 5 × 10^n).
function niceMax(v) {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}

function Chart({ series, previous, bestDate, groupBy }) {
  const [hover, setHover] = useState(null);
  const n = series.length;
  const prev = previous ? previous.slice(0, n) : null;
  const yMax = niceMax(Math.max(...series.map((p) => p.revenue), ...(prev ?? []).map((p) => p.revenue), 0));

  const x = (i) => M.l + (n === 1 ? PW / 2 : (i / (n - 1)) * PW);
  const y = (v) => M.t + PH - (v / yMax) * PH;
  const line = (arr) => arr.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(' ');
  const area = `${line(series)} L${x(n - 1).toFixed(1)},${M.t + PH} L${x(0).toFixed(1)},${M.t + PH} Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const xStep = Math.max(1, Math.ceil(n / 7));
  const bestIdx = series.findIndex((p) => p.date === bestDate);
  const label = (d) => (groupBy === 'month' ? d.slice(5) + '/' + d.slice(0, 4) : formatDayMonth(d));

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - M.l) / PW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, n === 1 ? 0 : i)));
  }

  const hp = hover !== null ? series[hover] : null;
  const total = series.reduce((s, p) => s + p.revenue, 0);

  return (
    <div className="st-chart">
      <div className="st-chart-inner">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Biểu đồ doanh thu ${groupBy === 'month' ? 'theo tháng' : 'theo ngày'} từ ${formatDate(
          series[0].date.length === 7 ? `${series[0].date}-01` : series[0].date,
        )}, tổng ${formatVnd(total)}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className="st-grid" />
            <text x={M.l - 8} y={y(t) + 4} textAnchor="end" className="st-axis">
              {formatCompactVnd(t)}
            </text>
          </g>
        ))}
        {series.map(
          (p, i) =>
            i % xStep === 0 && (
              <text key={p.date} x={x(i)} y={H - 10} textAnchor="middle" className="st-axis">
                {label(p.date)}
              </text>
            ),
        )}

        {n > 1 && <path d={area} className="st-area" />}
        {prev && n > 1 && <path d={line(prev)} className="st-line-prev" />}
        {n > 1 ? <path d={line(series)} className="st-line" /> : null}

        {bestIdx >= 0 && (
          <circle cx={x(bestIdx)} cy={y(series[bestIdx].revenue)} r="6" className="st-best" />
        )}
        {hp && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={M.t + PH} className="st-guide" />
            <circle cx={x(hover)} cy={y(hp.revenue)} r="4.5" className="st-dot" />
          </g>
        )}
        {n === 1 && <circle cx={x(0)} cy={y(series[0].revenue)} r="4.5" className="st-dot" />}
      </svg>

      {hp && (
        <div
          className="st-tooltip"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: x(hover) > W * 0.7 ? 'translateX(-105%)' : 'translateX(8px)' }}
        >
          <strong>{groupBy === 'month' ? label(hp.date) : formatDate(hp.date)}</strong>
          <span>{formatVnd(hp.revenue)}</span>
          <span className="st-tooltip-sub">{hp.orders} đơn</span>
          {prev?.[hover] && <span className="st-tooltip-sub">Kỳ trước: {formatVnd(prev[hover].revenue)}</span>}
        </div>
      )}
      </div>

      <ul className="st-legend">
        <li>
          <i className="st-legend-line" /> Kỳ này
        </li>
        {prev && (
          <li>
            <i className="st-legend-line st-legend-prev" /> Kỳ trước
          </li>
        )}
        {bestIdx >= 0 && (
          <li>
            <i className="st-legend-ring" /> Ngày bán tốt nhất
          </li>
        )}
      </ul>
    </div>
  );
}

export default function RevenueChart({ revenueState, previousState, bestDate }) {
  const prevSeries = previousState.data?.series ?? null;
  return (
    <AsyncSection
      state={revenueState}
      minHeight={340}
      isEmpty={(d) => d.series.every((p) => p.revenue === 0)}
      emptyText="Chưa có đơn hàng nào đã giao trong kỳ này."
    >
      {(d) => <Chart series={d.series} previous={prevSeries} bestDate={bestDate} groupBy={d.groupBy} />}
    </AsyncSection>
  );
}
