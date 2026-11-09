'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

const statusLabels = {
  PENDING: 'Đang chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
};

export default function AccountChangeRequests({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function reload() {
    const data = await apiGet('/account-change-requests/mine');
    setRequests(data);
  }

  useEffect(() => {
    reload().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    const changes = {};
    if (newEmail.trim() && newEmail.trim().toLowerCase() !== currentUser?.email?.trim().toLowerCase()) {
      changes.email = newEmail.trim();
    }
    if (newFullName.trim() && newFullName.trim() !== currentUser?.fullName) {
      changes.fullName = newFullName.trim();
    }
    if (newPhone.trim() && newPhone.trim() !== currentUser?.phone) {
      changes.phone = newPhone.trim();
    }
    if (Object.keys(changes).length === 0) {
      setError('Hãy nhập ít nhất một thông tin mới khác thông tin hiện tại.');
      return;
    }
    setSaving(true);
    try {
      await apiPost('/account-change-requests', {
        reason: reason.trim(),
        changes,
      });
      await reload();
      setNewEmail('');
      setNewFullName('');
      setNewPhone('');
      setReason('');
      setMessage('Yêu cầu đã được gửi để quản trị viên xét duyệt.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const pending = requests.some((request) => request.status === 'PENDING');

  return (
    <section className="eht-card">
      <div className="eht-card-head">
        <div>
          <h2 className="eht-card-title">Yêu cầu thay đổi thông tin</h2>
          <p className="eht-card-desc">Nhập những thông tin cần thay đổi. Quản trị viên sẽ xét duyệt trước khi áp dụng.</p>
        </div>
      </div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {message && <div className="auth-success" role="status">{message}</div>}
      {loading ? <p>Đang tải yêu cầu...</p> : (
        <>
          <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
            <div className="form-group">
              <label htmlFor="new-account-email">Email mới (nếu cần đổi)</label>
              <input id="new-account-email" type="email" className="form-control" value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)} disabled={pending || saving} />
            </div>
            <div className="form-group">
              <label htmlFor="new-account-name">Họ tên mới (nếu cần đổi)</label>
              <input id="new-account-name" className="form-control" value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)} disabled={pending || saving} />
            </div>
            <div className="form-group">
              <label htmlFor="new-account-phone">Số điện thoại mới (nếu cần đổi)</label>
              <input id="new-account-phone" type="tel" className="form-control" value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)} disabled={pending || saving} />
            </div>
            <div className="form-group">
              <label htmlFor="account-change-reason">Lý do thay đổi</label>
              <textarea id="account-change-reason" className="form-control" value={reason}
                onChange={(e) => setReason(e.target.value)} minLength={5} required disabled={pending || saving} />
            </div>
            <button type="submit" className="eht-btn eht-btn-primary" disabled={pending || saving}>
              {pending ? 'Đang chờ duyệt' : saving ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>
          {requests.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 8 }}>Lịch sử yêu cầu</h3>
              {requests.map((request) => (
                <div key={request.id} style={{ padding: '10px 0', borderTop: '1px solid #ddd' }}>
                  <strong>{statusLabels[request.status] || request.status}</strong>
                  {' · '}{[
                    request.changes?.email && `Email: ${request.changes.email}`,
                    request.changes?.fullName && `Tên: ${request.changes.fullName}`,
                    request.changes?.phone && `SĐT: ${request.changes.phone}`,
                  ].filter(Boolean).join(' · ')}
                  {request.reviewNote && <p>Ghi chú của quản trị viên: {request.reviewNote}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
