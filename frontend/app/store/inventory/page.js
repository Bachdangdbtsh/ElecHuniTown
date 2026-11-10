'use client';

import { INVENTORY } from '../_data/mock';

function statusClass(s) {
  if (s === 'Còn hàng') return 'eht-badge eht-badge-ok';
  if (s === 'Sắp hết') return 'eht-badge eht-badge-warn';
  return 'eht-badge eht-badge-lock';
}

export default function StoreInventoryPage() {
  const total = INVENTORY.reduce((s, i) => s + i.stock, 0);
  const low = INVENTORY.filter((i) => i.stock > 0 && i.stock <= 10).length;
  const out = INVENTORY.filter((i) => i.stock === 0).length;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="eht-page-title">Quản lý Kho hàng</h1>
          <p className="eht-page-sub">Theo dõi tồn kho và các phiếu nhập / xuất kho.</p>
        </div>
        <button type="button" className="eht-btn">↻ Làm mới dữ liệu</button>
      </div>

      <div className="eht-kpi-row">
        <div className="eht-kpi">
          <p className="eht-kpi-num">{total}</p>
          <p className="eht-kpi-lbl">Tổng tồn kho · sản phẩm</p>
        </div>
        <div className="eht-kpi">
          <p className="eht-kpi-num">{low || 2}</p>
          <p className="eht-kpi-lbl">Sắp hết hàng · cần nhập thêm</p>
        </div>
        <div className="eht-kpi">
          <p className="eht-kpi-num">0{out || 3}</p>
          <p className="eht-kpi-lbl">Phiếu nhập/xuất chờ · tuần này</p>
        </div>
      </div>

      <div className="eht-card">
        <h2 className="eht-card-title" style={{ marginBottom: 16 }}>Tồn kho hiện tại</h2>
        <table className="eht-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Sản phẩm</th>
              <th>Tồn kho</th>
              <th>Tình trạng</th>
            </tr>
          </thead>
          <tbody>
            {INVENTORY.map((i) => (
              <tr key={i.code}>
                <td style={{ fontWeight: 700 }}>{i.code}</td>
                <td>{i.name}</td>
                <td style={{ fontWeight: 800 }}>{i.stock}</td>
                <td><span className={statusClass(i.status)}>{i.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
