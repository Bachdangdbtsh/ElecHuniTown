'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AccountProfilePage() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  useEffect(() => {
    apiFetch('/auth/me').then((d) => {
      setUser(d);
      setFullName(d.fullName || '');
      setPhone(d.phone || '');
    }).catch(() => {});
  }, []);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');

    try {
      const updated = await apiFetch('/account-change-requests/profile', {
        method: 'PATCH',
        body: { fullName, phone },
      });
      setUser((prev) => ({ ...prev, ...updated }));
      setProfileMsg('Cập nhật thông tin thành công!');
    } catch (err) {
      setProfileErr(err.message);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');

    if (newPassword !== confirmPassword) {
      setPassErr('Mật khẩu mới không trùng khớp');
      return;
    }

    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword, confirmPassword },
      });
      setPassMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassErr(err.message);
    }
  }

  return (
    <div>
      <h1 className="cust-title">Hồ sơ của tôi</h1>
      <p className="cust-subtitle">Quản lý thông tin tài khoản và bảo mật mật khẩu</p>

      {/* Form Thông tin */}
      <div className="cust-card-box">
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Thông tin cá nhân</h2>
        {profileMsg && <div className="auth-success" style={{ marginBottom: 12 }}>{profileMsg}</div>}
        {profileErr && <div className="auth-error" style={{ marginBottom: 12 }}>{profileErr}</div>}

        <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="pf-name">Họ và tên</label>
            <input
              id="pf-name"
              type="text"
              className="form-control"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pf-email">Email (Cố định)</label>
            <input
              id="pf-email"
              type="email"
              className="form-control"
              value={user?.email || ''}
              disabled
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pf-phone">Số điện thoại</label>
            <input
              id="pf-phone"
              type="text"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
            <button type="submit" className="auth-btn" style={{ width: 'auto', padding: '10px 24px' }}>
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* Form Đổi mật khẩu */}
      <div className="cust-card-box">
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Đổi mật khẩu</h2>
        {passMsg && <div className="auth-success" style={{ marginBottom: 12 }}>{passMsg}</div>}
        {passErr && <div className="auth-error" style={{ marginBottom: 12 }}>{passErr}</div>}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 440 }}>
          <div className="form-group">
            <label htmlFor="cp-curr">Mật khẩu hiện tại</label>
            <input
              id="cp-curr"
              type="password"
              className="form-control"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cp-new">Mật khẩu mới (tối thiểu 8 ký tự)</label>
            <input
              id="cp-new"
              type="password"
              className="form-control"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cp-conf">Xác nhận mật khẩu mới</label>
            <input
              id="cp-conf"
              type="password"
              className="form-control"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div>
            <button type="submit" className="auth-btn" style={{ width: 'auto', padding: '10px 24px' }}>
              Cập nhật mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}