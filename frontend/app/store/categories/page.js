'use client';

import { useState } from 'react';
import { CATEGORIES, PRODUCTS } from '../_data/mock';

export default function StoreCategoriesPage() {
  const [products, setProducts] = useState(PRODUCTS);

  function toggle(code) {
    setProducts((prev) => prev.map((p) => (p.code === code ? { ...p, visible: !p.visible } : p)));
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="eht-page-title">Quản lý Danh mục Sản phẩm</h1>
          <p className="eht-page-sub">Sắp xếp danh mục và trạng thái hiển thị của sản phẩm.</p>
        </div>
        <button type="button" className="eht-btn">↻ Làm mới dữ liệu</button>
      </div>

      <div className="eht-kpi-row">
        {CATEGORIES.map((c) => (
          <div key={c.name} className="eht-kpi" style={{ cursor: 'pointer' }} onClick={() => alert(`Lọc danh mục: ${c.name}`)}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>▦ {c.name}</p>
            <p className="eht-kpi-lbl">{c.count} sản phẩm</p>
          </div>
        ))}
      </div>

      <div className="eht-card">
        <h2 className="eht-card-title" style={{ marginBottom: 16 }}>Sản phẩm theo danh mục</h2>
        <table className="eht-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá bán</th>
              <th>Hiển thị</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.code}>
                <td style={{ fontWeight: 700 }}>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td style={{ fontWeight: 700 }}>{p.price}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => toggle(p.code)}
                    aria-pressed={p.visible}
                    title="Bật/tắt hiển thị"
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 999,
                      border: 'none',
                      background: p.visible ? '#649c75' : '#cbd5e1',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: p.visible ? 22 : 3,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left .15s',
                      }}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
