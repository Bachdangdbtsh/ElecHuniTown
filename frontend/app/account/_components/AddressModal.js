'use client';

import { useEffect, useState } from 'react';

export default function AddressModal({ initialData, isOpen, onClose, onSave, error }) {
  const [recipientName, setName] = useState('');
  const [recipientPhone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [recipientType, setType] = useState('Nhà');
  const [isDefault, setDefault] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.recipientName || '');
      setPhone(initialData.recipientPhone || initialData.recipientPhoneNumber || '');
      setAddress(initialData.address || '');
      setType(initialData.recipientType || 'Nhà');
      setDefault(Boolean(initialData.isDefault));
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setType('Nhà');
      setDefault(false);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      recipientName,
      recipientPhone,
      address,
      recipientType,
      isDefault,
    });
  }

  return (
    <div className="cust-card-box" style={{ border: '2px solid var(--cust-secondary)', marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        {initialData ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao hàng mới'}
      </h2>

      {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group">
          <label htmlFor="ad-type">Nhãn địa chỉ</label>
          <input
            id="ad-type"
            type="text"
            className="form-control"
            placeholder="Nhà riêng, Khuôn viên, KTX..."
            value={recipientType}
            onChange={(e) => setType(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ad-name">Tên người nhận</label>
          <input
            id="ad-name"
            type="text"
            className="form-control"
            required
            value={recipientName}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ad-phone">Số điện thoại</label>
          <input
            id="ad-phone"
            type="text"
            className="form-control"
            required
            value={recipientPhone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="ad-addr">Địa chỉ chi tiết</label>
          <input
            id="ad-addr"
            type="text"
            className="form-control"
            placeholder="Phòng, Tòa nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            id="is-def"
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setDefault(e.target.checked)}
          />
          <label htmlFor="is-def" style={{ fontSize: 13, cursor: 'pointer' }}>
            Đặt làm địa chỉ nhận hàng mặc định
          </label>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="submit" className="auth-btn" style={{ width: 'auto', padding: '9px 20px' }}>
            Lưu địa chỉ
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--cust-border)',
              borderRadius: 10,
              padding: '9px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}