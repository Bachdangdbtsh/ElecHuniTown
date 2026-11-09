'use client';

import { useState } from 'react';
import { useApi } from '../_lib/useApi';
import AsyncSection from './AsyncSection';
import { apiPatch } from '@/lib/api';

export default function UserDrawer({ userId, onClose, onRefresh }) {
  const userDetailState = useApi(userId ? `/admin/users/${userId}` : null);
  const [locking, setLocking] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!userId) return null;

  async function handleToggleStatus(currentActive) {
    const nextStatus = !currentActive;
    const promptMsg = nextStatus ? 'Nhập lý do mở khóa tài khoản:' : 'Nhập lý do khóa tài khoản vi phạm:';
    const reason = prompt(promptMsg, 'Quyết định của Quản trị viên');
    if (!reason) return;

    setLocking(true);
    setActionError('');
    try {
      await apiPatch(`/admin/users/${userId}/status`, {
        isActive: nextStatus,
        reason,
      });
      userDetailState.reload();
      onRefresh?.();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLocking(false);
    }
  }

  return (
    <div className="adm-drawer-overlay" onClick={onClose}>
      <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
        {actionError && <div className="auth-error" style={{ marginBottom: 12 }}>{actionError}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Chi tiết người dùng</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <AsyncSection state={userDetailState} minHeight={300}>
          {(user) => (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className={`adm-badge ${user.isActive ? 'adm-badge-active' : 'adm-badge-locked'}`} style={{ width: 'fit-content' }}>
                  {user.isActive ? 'Đang hoạt động' : 'Đã bị khóa'}
                </span>
                <p style={{ fontSize: 20, fontWeight: 800 }}>{user.fullName}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>Mã: {user.userCode} | Vai trò: {user.roleName}</p>
                <p style={{ fontSize: 13 }}>Email: {user.email}</p>
                <p style={{ fontSize: 13 }}>Điện thoại: {user.phone || 'Chưa cập nhật'}</p>
                <p style={{ fontSize: 13 }}>Tổng số đơn hàng: {user.totalOrders}</p>
              </div>

              <div>
                <button
                  type="button"
                  className="adm-btn"
                  style={{
                    color: user.isActive ? 'var(--down)' : 'var(--up)',
                    borderColor: user.isActive ? 'var(--down)' : 'var(--up)',
                  }}
                  disabled={locking}
                  onClick={() => handleToggleStatus(user.isActive)}
                >
                  {user.isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                </button>
              </div>

              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Lịch sử đăng nhập gần đây</h3>
                {user.loginHistory.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Chưa có lượt đăng nhập nào.</p>
                ) : (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    {user.loginHistory.map((h) => (
                      <li key={h.id} style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, color: h.success ? 'var(--up)' : 'var(--down)' }}>
                            {h.success ? 'Thành công' : 'Thất bại'}
                          </span>
                          <span style={{ color: 'var(--muted)' }}>{new Date(h.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <p style={{ marginTop: 2, color: 'var(--muted)' }}>IP: {h.ip || 'Unknown'} | {h.userAgent}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </AsyncSection>
      </div>
    </div>
  );
}