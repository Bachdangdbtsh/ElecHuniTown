'use client';

import AsyncSection from './AsyncSection';
import { formatCompactVnd, formatNumber, formatVnd } from '../_lib/format';

const TABS = [
  { key: 'category', label: 'Theo danh mục', head: 'Danh mục' },
  { key: 'product', label: 'Theo sản phẩm', head: 'Sản phẩm' },
  { key: 'staff', label: 'Theo nhân viên', head: 'Nhân viên xử lý đơn' },
];

const pct = (v) => (v === null || v === undefined ? '—' : `${v.toFixed(1).replace('.', ',')}%`);
const signedNumber = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatNumber(Math.abs(n))}`;

function Stat({ label, value, hint, accent }) {
  return (
    <div className={accent ? 'st-profit-item st-profit-accent' : 'st-profit-item'}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <p className="st-delta st-delta-flat">{hint}</p>}
    </div>
  );
}

function Summary({ d }) {
  return (
    <>
      <dl className="st-profit">
        <Stat label="Doanh thu" value={`${formatCompactVnd(d.revenue)} ₫`} hint={`${formatNumber(d.orders)} đơn đã giao`} />
        <Stat label="Giá vốn hàng bán" value={`${formatCompactVnd(d.cogs)} ₫`} hint="Theo giá nhập bình quân" />
        <Stat label="Hoàn tiền cho khách" value={`${formatCompactVnd(d.refunds)} ₫`} hint="Yêu cầu đổi trả đã hoàn tiền" />
        <Stat label="Chi phí phát sinh khác" value={`${formatCompactVnd(d.otherCosts)} ₫`} hint="Hàng hỏng đã duyệt xuất kho" />
        <Stat
          label="Lợi nhuận"
          value={`${formatCompactVnd(d.profit)} ₫`}
          hint={`Tỷ suất ${pct(d.marginPct)}${d.changePct === null ? '' : ` · ${signedNumber(d.changePct)}% so với kỳ trước`}`}
          accent
        />
      </dl>
      {d.itemsMissingCost > 0 && (
        <p className="st-note">
          Lưu ý: {formatNumber(d.itemsMissingCost)} dòng hàng trong kỳ chưa có phiếu nhập kho nên chưa tính được giá vốn, lợi nhuận
          đang bị ước tính cao hơn thực tế.
        </p>
      )}
    </>
  );
}

function Breakdown({ state, groupBy, onChangeGroupBy }) {
  const tab = TABS.find((t) => t.key === groupBy) ?? TABS[0];
  const isStaff = groupBy === 'staff';

  return (
    <div className="st-panel">
      <div className="st-profit-head">
        <div>
          <p className="st-kpi-label">Chi tiết theo {tab.label.toLowerCase().replace('theo ', '')}</p>
          <p className="st-sub">Doanh thu, giá vốn và lợi nhuận của từng nhóm trong kỳ</p>
        </div>
        <div className="st-segment" role="group" aria-label="Chọn cách gom nhóm thống kê">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className="st-segment-btn"
              aria-pressed={groupBy === t.key}
              onClick={() => onChangeGroupBy(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="st-table-wrap">
        <AsyncSection
          state={state}
          minHeight={220}
          isEmpty={(d) => d.items.length === 0}
          emptyText="Chưa có đơn hàng đã giao trong kỳ này."
        >
          {(d) => (
            <table className="st-table">
              <thead>
                <tr>
                  <th scope="col">{tab.head}</th>
                  <th scope="col" className="num">
                    {isStaff ? 'Số đơn' : 'Đã bán'}
                  </th>
                  <th scope="col" className="num">
                    Doanh thu
                  </th>
                  <th scope="col" className="num">
                    Giá vốn
                  </th>
                  <th scope="col" className="num">
                    Lợi nhuận
                  </th>
                  <th scope="col" className="num">
                    Tỷ suất
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="st-rank-name">{row.label}</span>
                      {row.sublabel && <span className="st-rank-cat">{row.sublabel}</span>}
                    </td>
                    <td className="num">{formatNumber(isStaff ? row.orders : row.sold)}</td>
                    <td className="num" title={formatVnd(row.revenue)}>
                      {formatCompactVnd(row.revenue)} ₫
                    </td>
                    <td className="num" title={formatVnd(row.cogs)}>
                      {formatCompactVnd(row.cogs)} ₫
                    </td>
                    <td className={row.profit < 0 ? 'num neg' : 'num pos'} title={formatVnd(row.profit)}>
                      {formatCompactVnd(row.profit)} ₫
                    </td>
                    <td className="num">{pct(row.marginPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AsyncSection>
      </div>
    </div>
  );
}

export default function ProfitSection({ profitState, breakdownState, groupBy, onChangeGroupBy }) {
  return (
    <div className="st-profit-block">
      <AsyncSection state={profitState} minHeight={180}>
        {(d) => <Summary d={d} />}
      </AsyncSection>
      <Breakdown state={breakdownState} groupBy={groupBy} onChangeGroupBy={onChangeGroupBy} />
    </div>
  );
}
