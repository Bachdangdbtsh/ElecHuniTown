'use client';

import { FINANCE } from '../_data/mock';

export default function StoreFinancePage() {
  const max = Math.max(...FINANCE.months.map((m) => m.value));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="eht-page-title">Thống kê Tài chính</h1>
          <p className="eht-page-sub">Doanh thu, đơn hàng và cơ cấu danh mục của cửa hàng.</p>
        </div>
        <button type="button" className="eht-btn">↻ Làm mới dữ liệu</button>
      </div>

      <div className="eht-kpi-row">
        <div className="eht-kpi eht-kpi-hi">
          <p className="eht-kpi-num" style={{ fontSize: 26 }}>{FINANCE.revenue}</p>
          <p className="eht-kpi-lbl">Doanh thu tháng 9 · {FINANCE.revenueDelta}</p>
        </div>
        <div className="eht-kpi">
          <p className="eht-kpi-num" style={{ fontSize: 26 }}>{FINANCE.orders}</p>
          <p className="eht-kpi-lbl">Đơn hàng tháng 9 · Đã chờ giao</p>
        </div>
        <div className="eht-kpi">
          <p className="eht-kpi-num" style={{ fontSize: 26 }}>{FINANCE.refund}</p>
          <p className="eht-kpi-lbl">Tiền hoàn trả · {FINANCE.refundRate}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div className="eht-card">
          <h2 className="eht-card-title">Doanh thu 6 tháng gần nhất</h2>
          <p className="eht-card-desc">Đơn vị: tỷ đồng</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, marginTop: 20 }}>
            {FINANCE.months.map((m) => (
              <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{m.value}</span>
                <div
                  style={{
                    width: '100%',
                    height: `${(m.value / max) * 140}px`,
                    background: m.label === 'T9' ? '#517f60' : '#8fe3a9',
                    borderRadius: 8,
                  }}
                />
                <span style={{ fontSize: 12, color: '#64748b' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="eht-card">
          <h2 className="eht-card-title">Cơ cấu doanh thu theo danh mục</h2>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FINANCE.byCategory.map((c) => (
              <div key={c.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontWeight: 700 }}>{c.pct}%</span>
                </div>
                <div style={{ height: 8, background: '#e8eee9', borderRadius: 999 }}>
                  <div style={{ width: `${c.pct}%`, height: '100%', background: '#649c75', borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
