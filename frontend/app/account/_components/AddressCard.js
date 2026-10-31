'use client';

import { formatPhoneNumber } from '../_lib/format';

export default function AddressCard({ address, onEdit, onDelete, onSetDefault }) {
  const phone = address.recipientPhone || address.recipientPhoneNumber;

  return (
    <div className="cust-card-box" style={{ margin: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{address.recipientType || 'Địa chỉ'}</span>
        {address.isDefault && <span className="badge-default">Mặc định</span>}
      </div>

      <p style={{ fontWeight: 700, fontSize: 15 }}>{address.recipientName}</p>
      <p style={{ fontSize: 13, color: 'var(--cust-muted)', marginTop: 4, minHeight: 38 }}>
        {address.address}
      </p>
      <p style={{ fontSize: 13, marginTop: 6 }}>
        {formatPhoneNumber(phone)}
      </p>

      <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--cust-border)' }}>
        <button
          type="button"
          onClick={() => onEdit(address)}
          style={{ background: 'none', border: 'none', color: 'var(--cust-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
        >
          Sửa
        </button>
        <button
          type="button"
          onClick={() => onDelete(address.id)}
          style={{ background: 'none', border: 'none', color: 'var(--cust-danger)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
        >
          Xóa
        </button>
        {!address.isDefault && (
          <button
            type="button"
            onClick={() => onSetDefault(address.id)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--cust-muted)', cursor: 'pointer', fontSize: 12 }}
          >
            Thiết lập mặc định
          </button>
        )}
      </div>
    </div>
  );
}