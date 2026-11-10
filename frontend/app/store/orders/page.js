'use client';

import { useState } from 'react';
import { PENDING_ORDERS } from '../_data/mock';

export default function StoreOrdersPage() {
  const [rows, setRows] = useState(PENDING_ORDERS);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="eht-page-title">Thông báo Công việc</h1>
          <p className="eht-page-sub">Theo dõi và xử lý nhanh những đơn hàng đang cần bạn phê duyệt.</p>
        </div>
        <button type="button" className="eht-btn" onClick={() => setRows([...PENDING_ORDERS])}>
          ↻ Làm mới dữ liệu
        </button>
      </div>

      <div className="eht-kpi-row">
        <div className="eht-kpi eht-kpi-hi">
          <p className="eht-kpi-num">0{rows.length}</p>
          <p className="eht-kpi-lbl">Đơn đang chờ phê duyệt · Cần xử lý</p>
        </div>
        <div className="eht-kpi">
          <p className="eht-kpi-num">18</p>
          <p className="eht-kpi-lbl">Đơn đã duyệt hôm nay · +12% hôm qua</p>
        </div>
        <div className="eht-kpi">
          <p className="eht-kpi-num" style={{ fontSize: 22 }}>8 phút</p>
          <p className="eht-kpi-lbl">Thời gian xử lý TB · Tốt</p>
        </div>
      </div>

      <div className="eht-card">
        <div className="eht-card-head">
          <div>
            <h2 className="eht-card-title">
              <span className="eht-badge eht-badge-ok" style={{ marginRight: 8 }}>{rows.length}</span>
              Đơn hàng chờ phê duyệt
            </h2>
            <p className="eht-card-desc">Sắp xếp theo thời gian mới nhất</p>
          </div>
          <button type="button" className="eht-btn eht-btn-sm">Tất cả đơn chờ</button>
        </div>
        <div className="eht-table-wrap">
          <table className="eht-table">
            <thead>
              <tr>
                <th></th>
                <th>Tên sản phẩm</th>
                <th>Tài khoản khách hàng</th>
                <th>Số lượng</th>
                <th>Ngày đặt hàng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ width: 36, height: 36, borderRadius: 10, background: '#d9f5e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>▣</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>{o.product}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{o.id} · {o.category}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.customer}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{o.email}</div>
                  </td>
                  <td style={{ fontWeight: 800 }}>{String(o.qty).padStart(2, '0')}</td>
                  <td>{o.date}</td>
                  <td><span className="eht-badge eht-badge-warn">● {o.status}</span></td>
                  <td>
                    <button
                      type="button"
                      className="eht-btn eht-btn-primary eht-btn-sm"
                      style={{ width: 36, height: 36, padding: 0, justifyContent: 'center' }}
                      title="Xem chi tiết"
                      onClick={() => alert(`Chi tiết đơn ${o.id} — gắn API sau`)}
                    >
                      →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>
          Hiển thị {rows.length} trên {rows.length} đơn hàng
        </p>
      </div>
    </>
  );
}
