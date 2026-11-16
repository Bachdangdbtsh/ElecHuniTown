'use client';

import { useState } from 'react';
import { FiDownload, FiFileText, FiPrinter, FiX } from 'react-icons/fi';

export default function InventoryExportModal({ visibleCount, totalCount, onClose, onExport, onPrint }) {
  const [scope, setScope] = useState('all');

  return (
    <div className="inv-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="inv-modal inv-export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <header className="inv-modal-header">
          <div className="inv-export-title">
            <span className="inv-export-icon"><FiFileText aria-hidden="true" /></span>
            <span>
              <p className="inv-eyebrow">BẢNG DỮ LIỆU KHO</p>
              <h2 id="export-title">Xuất dữ liệu hàng tồn kho</h2>
              <p>Xem trước dữ liệu trước khi xuất hoặc in.</p>
            </span>
          </div>
          <button type="button" className="inv-close-button" onClick={onClose} aria-label="Đóng"><FiX /></button>
        </header>

        <div className="inv-export-layout">
          <div className="inv-export-preview">
            <div className="inv-export-preview-head">
              <strong>Danh sách sản phẩm</strong>
              <span>{scope === 'all' ? totalCount : visibleCount} dòng</span>
            </div>
            <p className="inv-export-preview-note">Tồn kho hiện tại · Tình trạng · Danh mục sản phẩm</p>
          </div>
          <aside className="inv-export-settings">
            <h3>Thiết lập xuất dữ liệu</h3>
            <p>Chọn phạm vi dữ liệu cần xuất.</p>
            <label className={`inv-export-option ${scope === 'all' ? 'is-selected' : ''}`}>
              <input type="radio" name="inventory-export-scope" checked={scope === 'all'} onChange={() => setScope('all')} />
              <span><strong>Tất cả dữ liệu</strong><small>{totalCount} sản phẩm trong kho</small></span>
            </label>
            <label className={`inv-export-option ${scope === 'filtered' ? 'is-selected' : ''}`}>
              <input type="radio" name="inventory-export-scope" checked={scope === 'filtered'} onChange={() => setScope('filtered')} />
              <span><strong>Dữ liệu đang lọc</strong><small>{visibleCount} sản phẩm theo bộ lọc hiện tại</small></span>
            </label>
            <div className="inv-export-facts">
              <div><span>Định dạng</span><strong>CSV UTF-8 · Mở bằng Excel</strong></div>
              <div><span>Số sản phẩm</span><strong>{scope === 'all' ? totalCount : visibleCount} dòng</strong></div>
              <div><span>Thời điểm xuất</span><strong>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</strong></div>
            </div>
            <button type="button" className="inv-button inv-button-primary inv-export-action" onClick={() => onExport(scope)}>
              <FiDownload aria-hidden="true" /> Xuất tệp CSV
            </button>
            <button type="button" className="inv-button inv-button-light inv-export-action" onClick={onPrint}>
              <FiPrinter aria-hidden="true" /> In bảng
            </button>
            <small className="inv-export-disclaimer">Tệp dữ liệu chỉ bao gồm thông tin tồn kho.</small>
          </aside>
        </div>
      </section>
    </div>
  );
}
