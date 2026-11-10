'use client';

import { useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

const initialLine = () => ({ productId: '', quantity: '1', unitCost: '' });

export default function InventoryCreateModal({ products, suppliers, permissions, userRole, initialKind = '', initialProductId = '', onClose, onBack, onCreated }) {
  const canCreateReceipt = userRole === 'SHOP_OWNER' || permissions.includes('STOCK_RECEIPT_CREATE');
  const canCreateIssue = ['STAFF', 'SHOP_OWNER'].includes(userRole) || permissions.includes('STOCK_ISSUE_CREATE');
  const defaultKind = initialKind === 'receipt' && canCreateReceipt
    ? 'receipt'
    : initialKind === 'issue' && canCreateIssue
      ? 'issue'
      : canCreateReceipt ? 'receipt' : 'issue';
  const [kind, setKind] = useState(defaultKind);
  const [type, setType] = useState('SALE');
  const [supplierId, setSupplierId] = useState('');
  const [content, setContent] = useState('');
  const [items, setItems] = useState([{
    ...initialLine(),
    productId: initialProductId ? String(initialProductId) : '',
  }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedProductIds = useMemo(
    () => new Set(items.map((item) => item.productId).filter(Boolean)),
    [items],
  );

  function updateLine(index, key, value) {
    setItems((current) => current.map((item, lineIndex) => (
      lineIndex === index ? { ...item, [key]: value } : item
    )));
  }

  function addLine() {
    setItems((current) => [...current, initialLine()]);
  }

  function removeLine(index) {
    setItems((current) => current.filter((_, lineIndex) => lineIndex !== index));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const requestItems = items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        ...(kind === 'receipt' && { unitCost: Number(item.unitCost) }),
      }));
      const payload = {
        content: content.trim(),
        items: requestItems,
        ...(kind === 'receipt' && { supplierId: Number(supplierId) }),
        ...(kind === 'issue' && {
          type,
          ...(type === 'RETURN_TO_SUPPLIER' && { supplierId: Number(supplierId) }),
        }),
      };

      await apiPost(kind === 'receipt' ? '/stock-receipts' : '/stock-issues', payload);
      toast.success('Tạo yêu cầu thành công');
      onCreated();
    } catch (requestError) {
      setError(requestError.message || 'Không thể gửi phiếu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  const needsSupplier = kind === 'receipt' || type === 'RETURN_TO_SUPPLIER';

  return (
    <div className="inv-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="inv-modal inv-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
        <header className="inv-modal-header">
          <div>
            {onBack && <button type="button" className="inv-modal-back" onClick={onBack}>← Quay lại chọn loại phiếu</button>}
            <p className="inv-eyebrow">QUẢN LÝ KHO HÀNG</p>
            <h2 id="create-title">Tạo phiếu nhập / xuất kho</h2>
            <p>Phiếu sẽ được gửi đến chủ cửa hàng để kiểm tra và duyệt.</p>
          </div>
          <button type="button" className="inv-close-button" onClick={onClose} aria-label="Đóng">
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="inv-kind-switch" role="tablist" aria-label="Loại phiếu">
          {canCreateReceipt && (
            <button type="button" role="tab" aria-selected={kind === 'receipt'} className={kind === 'receipt' ? 'is-selected' : ''} onClick={() => setKind('receipt')}>
              Phiếu nhập kho
            </button>
          )}
          {canCreateIssue && (
            <button type="button" role="tab" aria-selected={kind === 'issue'} className={kind === 'issue' ? 'is-selected' : ''} onClick={() => setKind('issue')}>
              Phiếu xuất kho
            </button>
          )}
        </div>

        <form onSubmit={submit}>
          <div className="inv-form-grid">
            {kind === 'issue' && (
              <label className="inv-field">
                <span>Loại xuất kho</span>
                <select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="SALE">Xuất bán / điều chuyển</option>
                  <option value="DAMAGED">Hàng hư hỏng</option>
                  <option value="RETURN_TO_SUPPLIER">Trả nhà cung cấp</option>
                </select>
              </label>
            )}
            {needsSupplier && (
              <label className="inv-field">
                <span>Nhà cung cấp <b>*</b></span>
                <select required value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="inv-field inv-field-wide">
              <span>Nội dung / lý do <b>*</b></span>
              <textarea
                required
                maxLength={2000}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={kind === 'receipt' ? 'Ví dụ: Nhập bổ sung sản phẩm sắp hết hàng…' : 'Nêu rõ mục đích xuất kho…'}
                rows={3}
              />
            </label>
          </div>

          <div className="inv-form-section-head">
            <div>
              <h3>Danh sách sản phẩm</h3>
              <p>Chọn sản phẩm từ dữ liệu kho hiện tại.</p>
            </div>
            <button type="button" className="inv-button inv-button-light inv-button-compact" onClick={addLine}>
              <FiPlus aria-hidden="true" /> Thêm sản phẩm
            </button>
          </div>

          <div className="inv-lines">
            {items.map((item, index) => {
              const product = products.find((candidate) => String(candidate.id) === item.productId);
              return (
                <div className="inv-line" key={index}>
                  <label className="inv-field inv-product-field">
                    <span>Sản phẩm <b>*</b></span>
                    <select required value={item.productId} onChange={(event) => {
                      const selected = products.find((candidate) => String(candidate.id) === event.target.value);
                      updateLine(index, 'productId', event.target.value);
                      if (kind === 'receipt' && selected) updateLine(index, 'unitCost', String(selected.newPrice ?? ''));
                    }}>
                      <option value="">Chọn sản phẩm</option>
                      {products.map((candidate) => (
                        <option
                          key={candidate.id}
                          value={candidate.id}
                          disabled={selectedProductIds.has(String(candidate.id)) && item.productId !== String(candidate.id)}
                        >
                          {candidate.productName} · {candidate.stock} sản phẩm
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inv-field inv-quantity-field">
                    <span>Số lượng <b>*</b></span>
                    <input type="number" min="1" step="1" required value={item.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} />
                  </label>
                  {kind === 'receipt' && (
                    <label className="inv-field inv-cost-field">
                      <span>Đơn giá nhập (₫) <b>*</b></span>
                      <input type="number" min="0" step="1" required value={item.unitCost} onChange={(event) => updateLine(index, 'unitCost', event.target.value)} />
                    </label>
                  )}
                  {items.length > 1 && (
                    <button type="button" className="inv-line-remove" onClick={() => removeLine(index)} aria-label="Xóa sản phẩm">
                      <FiTrash2 aria-hidden="true" />
                    </button>
                  )}
                  {product && <small className="inv-line-stock">Tồn hiện tại: {product.stock} sản phẩm</small>}
                </div>
              );
            })}
          </div>

          {error && <p className="inv-form-error" role="alert">{error}</p>}
          <footer className="inv-modal-footer">
            <span className="inv-footer-note">Phiếu chỉ thay đổi tồn kho sau khi được duyệt.</span>
            <button type="button" className="inv-button inv-button-light" onClick={onClose}>Hủy</button>
            <button type="submit" className="inv-button inv-button-primary" disabled={saving || !products.length || !suppliers.length && needsSupplier}>
              {saving ? 'Đang gửi…' : `Gửi phiếu ${kind === 'receipt' ? 'nhập' : 'xuất'}`}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
