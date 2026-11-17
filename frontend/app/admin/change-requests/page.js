'use client';

import { useState } from 'react';
import { useApi } from '../_lib/useApi';
import AsyncSection from '../_components/AsyncSection';
import { apiPatch } from '@/lib/api';

export default function AdminChangeRequestsPage() {
  const requestsState = useApi('/admin/change-requests');
  const [feedback, setFeedback] = useState('');
  const [feedbackErr, setFeedbackErr] = useState('');

  async function handleReview(id, status) {
    const actionText = status === 'APPROVED' ? 'phê duyệt' : 'từ chối';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} yêu cầu này?`)) return;
    setFeedback('');
    setFeedbackErr('');
    try {
      await apiPatch(`/admin/change-requests/${id}/review`, { status });
      setFeedback(`Đã ${actionText} thành công.`);
      requestsState.reload();
    } catch (err) {
      setFeedbackErr(err.message);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        {feedback && <div className="auth-success" style={{ marginBottom: 12 }}>{feedback}</div>}
        {feedbackErr && <div className="auth-error" style={{ marginBottom: 12 }}>{feedbackErr}</div>}
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Yêu cầu thay đổi thông tin</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
          Xét duyệt các yêu cầu cập nhật thông tin tài khoản từ người dùng
        </p>
      </div>

      <AsyncSection
        state={requestsState}
        minHeight={260}
        isEmpty={(items) => items.length === 0}
        emptyText="Hiện không có yêu cầu thay đổi nào đang chờ duyệt."
      >
        {(requests) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {requests.map((r) => (
              <div key={r.id} className="st-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="adm-badge adm-badge-pending">{r.requestCode} · Đang chờ</span>
                    <strong style={{ marginLeft: 10, fontSize: 15 }}>{r.requesterName}</strong>
                    <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 6 }}>({r.requesterRole})</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {new Date(r.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink)' }}>
                  &ldquo;{r.reason}&rdquo;
                </p>

                {/* So sánh giá trị cũ và mới */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--mint-soft)', padding: 14, borderRadius: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Thông tin hiện tại</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Email: {r.previous?.email}</p>
                    <p style={{ fontSize: 13 }}>SĐT: {r.previous?.phone || '—'}</p>
                    <p style={{ fontSize: 13 }}>Tên: {r.previous?.fullName}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--up)', textTransform: 'uppercase' }}>Thông tin thay đổi mới</p>
                    {r.changes?.email && <p style={{ fontSize: 13, marginTop: 4, fontWeight: 700 }}>Email: {r.changes.email}</p>}
                    {r.changes?.phone && <p style={{ fontSize: 13, fontWeight: 700 }}>SĐT: {r.changes.phone}</p>}
                    {r.changes?.fullName && <p style={{ fontSize: 13, fontWeight: 700 }}>Tên: {r.changes.fullName}</p>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="button"
                    className="adm-btn"
                    style={{ color: 'var(--down)', borderColor: 'var(--down)' }}
                    onClick={() => handleReview(r.id, 'REJECTED')}
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    className="adm-btn"
                    style={{ background: 'var(--ink)', color: '#fff' }}
                    onClick={() => handleReview(r.id, 'APPROVED')}
                  >
                    Phê duyệt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
