'use client';

import { useState } from 'react';
import { FiCheckCircle, FiX, FiXCircle } from 'react-icons/fi';
import { apiPost } from '@/lib/api';

const money = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(amount || 0);

const dateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

export default function InventoryDocumentModal({ document, canReview, onClose, onUpdated }) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const basePath = document.kind === 'receipt' ? '/stock-receipts' : '/stock-issues';

  async function approve() {
    setBusy(true);
    setError('');
    try {
      await apiPost(`${basePath}/${document.id}/approve`, {});
      onUpdated();
    } catch (requestError) {
      setError(requestError.message || 'Không thể duyệt phiếu.');
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  async function reject(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiPost(`${basePath}/${document.id}/reject`, { rejectReason: rejectReason.trim() });
      onUpdated();
    } catch (requestError) {
      setError(requestError.message || 'Không thể từ chối phiếu.');
    } finally {
      setBusy(false);
    }
  }

  const pending = document.status === 'PENDING_HANDLE';
  const typeLabel = document.kind === 'receipt'
    ? 'Phiếu nhập kho'
    : `Phiếu xuất kho${document.type === 'DAMAGED' ? ' · Hư hỏng' : document.type === 'RETURN_TO_SUPPLIER' ? ' · Trả nhà cung cấp' : ''}`;

  return (
    <div className="inv-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="inv-modal inv-document-modal" role="dialog" aria-modal="true" aria-labelledby="document-title">
        <header className="inv-modal-header">
          <div>
            <p className="inv-eyebrow">{typeLabel.toLocaleUpperCase('vi-VN')}</p>
            <h2 id="document-title">{canReview && pending ? 'Xét duyệt yêu cầu' : 'Chi tiết phiếu kho'}</h2>
            <p>{document.code} · Gửi lúc {dateTime(document.createdAt)}</p>
          </div>
          <button type="button" className="inv-close-button" onClick={onClose} aria-label="Đóng">
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="inv-document-summary">
          <div>
            <span>Nội dung đề xuất</span>
            <strong>{document.content || 'Không có nội dung'}</strong>
          </div>
          <div className="inv-document-meta">
            <div><span>Người lập phiếu</span><strong>{document.createdBy?.fullName || '—'}</strong></div>
            <div><span>Nhà cung cấp</span><strong>{document.supplier?.name || 'Không áp dụng'}</strong></div>
            <div><span>Tình trạng</span><strong className={`inv-status inv-status-${document.status?.toLowerCase()}`}>{statusText(document.status)}</strong></div>
            {document.rejectReason && <div className="inv-reject-reason"><span>Lý do từ chối</span><strong>{document.rejectReason}</strong></div>}
          </div>
        </div>

        <div className="inv-detail-items">
          <h3>Sản phẩm trong phiếu</h3>
          {document.loading ? (
            <p className="inv-empty-inline">Đang tải chi tiết phiếu…</p>
          ) : !document.items?.length ? (
            <p className="inv-empty-inline">Phiếu không có sản phẩm chi tiết.</p>
          ) : (
            <div className="inv-table-scroll">
              <table className="inv-table inv-detail-table">
                <thead><tr><th>Sản phẩm</th><th>Mã</th><th>Số lượng</th><th>Đơn giá</th></tr></thead>
                <tbody>
                  {document.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product?.productName || `Sản phẩm #${item.productId}`}</td>
                      <td>{item.product?.slug || item.productId}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.unitCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {error && <p className="inv-form-error" role="alert">{error}</p>}
        {canReview && pending && !confirming && !rejecting && (
          <footer className="inv-modal-footer">
            <span className="inv-footer-note">Tồn kho chỉ cập nhật sau khi duyệt.</span>
            <button type="button" className="inv-button inv-button-danger-outline" onClick={() => setRejecting(true)}>
              <FiXCircle aria-hidden="true" /> Từ chối
            </button>
            <button type="button" className="inv-button inv-button-primary" onClick={() => setConfirming(true)}>
              <FiCheckCircle aria-hidden="true" /> Duyệt phiếu
            </button>
          </footer>
        )}

        {rejecting && (
          <form className="inv-reject-form" onSubmit={reject}>
            <label className="inv-field">
              <span>Lý do từ chối <b>*</b></span>
              <textarea required minLength={1} maxLength={1000} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={3} />
            </label>
            <div className="inv-modal-footer">
              <button type="button" className="inv-button inv-button-light" onClick={() => setRejecting(false)}>Quay lại</button>
              <button type="submit" className="inv-button inv-button-danger" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xác nhận từ chối'}</button>
            </div>
          </form>
        )}

        {confirming && (
          <div className="inv-confirm-box">
            <div>
              <strong>Xác nhận duyệt phiếu?</strong>
              <p>Hệ thống sẽ ghi nhận {document.items?.length || 0} dòng sản phẩm và cập nhật tồn kho ngay sau khi duyệt.</p>
            </div>
            <div className="inv-confirm-actions">
              <button type="button" className="inv-button inv-button-light" onClick={() => setConfirming(false)}>Hủy</button>
              <button type="button" className="inv-button inv-button-primary" onClick={approve} disabled={busy}>{busy ? 'Đang duyệt…' : 'Xác nhận duyệt'}</button>
            </div>
          </div>
        )}

        {(!canReview || !pending) && (
          <footer className="inv-modal-footer inv-modal-footer-end">
            <span className="inv-footer-note">{document.handledBy?.fullName ? `Xử lý bởi ${document.handledBy.fullName} · ${dateTime(document.handledAt)}` : ''}</span>
            <button type="button" className="inv-button inv-button-light" onClick={onClose}>Đóng</button>
          </footer>
        )}
      </section>
    </div>
  );
}

function statusText(status) {
  return {
    DRAFT: 'Bản nháp',
    PENDING_HANDLE: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    DENIED: 'Từ chối',
  }[status] || status || '—';
}
