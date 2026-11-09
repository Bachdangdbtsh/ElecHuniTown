'use client';

import { useState } from 'react';
import { RETURNS } from '../_data/mock';

export default function StoreReturnsPage() {
  const [rows, setRows] = useState(RETURNS);
  const pending = rows.filter((r) => r.status === 'pending').length;

  function decide(id, status) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="eht-page-title">Đổi trả, Hoàn tiền</h1>
          <p className="eht-page-sub">Xem xét yêu cầu đổi trả và hoàn tiền từ khách hàng.</p>
        </div>
        <button type="button" className="eht-btn" onClick={() => setRows([...RETURNS])}>↻ Làm mới dữ liệu</button>
      </div>

      <div className="eht-card">
        <div className="eht-card-head">
          <h2 className="eht-card-title">Yêu cầu đổi trả</h2>
          <span className="eht-badge">{pending} chờ xử lý</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
                padding: '14px 0',
                borderBottom: '1px solid #e8eee9',
              }}
            >
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#d9f5e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>↺</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700 }}>{r.product}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {r.id} · Đơn {r.order} · {r.customer}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>&ldquo;{r.reason}&rdquo;</div>
              </div>
              <span className="eht-badge">{r.type}</span>
              <span style={{ fontWeight: 800, minWidth: 90, textAlign: 'right' }}>{r.amount}</span>
              {r.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="eht-btn eht-btn-sm" onClick={() => decide(r.id, 'rejected')}>Từ chối</button>
                  <button type="button" className="eht-btn eht-btn-primary eht-btn-sm" onClick={() => decide(r.id, 'accepted')}>Chấp nhận</button>
                </div>
              ) : (
                <span className={r.status === 'accepted' ? 'eht-badge eht-badge-ok' : 'eht-badge eht-badge-lock'}>
                  {r.status === 'accepted' ? '● Đã chấp nhận' : '● Đã từ chối'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
