'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';

export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const [fullName, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleCode, setRoleCode] = useState('STAFF');
  const [temporaryPassword, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiPost('/admin/users', {
        fullName,
        email,
        phone: phone || undefined,
        roleCode,
        temporaryPassword,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adm-modal-overlay">
      <div className="adm-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Tạo tài khoản nhân viên</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label htmlFor="modal-name">Họ và tên</label>
            <input
              id="modal-name"
              type="text"
              className="form-control"
              required
              placeholder="Nguyễn Văn X"
              value={fullName}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-email">Email công việc</label>
            <input
              id="modal-email"
              type="email"
              className="form-control"
              required
              placeholder="name@elechunitown.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-phone">Điện thoại</label>
            <input
              id="modal-phone"
              type="text"
              className="form-control"
              placeholder="+84..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-role">Vai trò</label>
            <select
              id="modal-role"
              className="form-control"
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value)}
            >
              <option value="STAFF">Nhân viên (Staff)</option>
              <option value="SHOP_OWNER">Chủ ứng dụng (Shop Owner)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="modal-pass">Mật khẩu tạm thời (tối thiểu 8 ký tự)</label>
            <input
              id="modal-pass"
              type="password"
              className="form-control"
              required
              minLength={8}
              value={temporaryPassword}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="adm-btn" style={{ background: 'var(--ink)', color: '#fff', flex: 1 }} disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
            <button type="button" className="adm-btn" onClick={onClose} style={{ flex: 1 }}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}