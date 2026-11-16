'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, apiPost } from '@/lib/api';
import ShellTopBar from '../_components/ShellTopBar';
import AccountChangeRequests from '../_components/AccountChangeRequests';

export default function AccountProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [editProfile, setEditProfile] = useState(false);
  const [editPass, setEditPass] = useState(false);
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
    apiFetch('/auth/me')
      .then((d) => {
        setUser(d);
        setFullName(d.fullName || '');
        setPhone(d.phone || '');
      })
      .catch(() => {});
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
      setEditProfile(false);
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
      setPassMsg(res.message || 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      try {
        await apiPost('/auth/logout');
      } catch { /* ignore */ }
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setPassErr(err.message);
    }
  }

  const lastName = (user?.fullName || '').trim().split(/\s+/).slice(-1)[0] || '—';

  return (
    <>
      <ShellTopBar
        title="Hồ sơ của tôi"
        subtitle="Quản lý thông tin cá nhân và mật khẩu"
        user={user}
      />
      <div className="eht-content">
        {/* Thông tin cá nhân */}
        <section className="eht-card">
          <div className="eht-card-head">
            <div>
              <h2 className="eht-card-title">Thông tin cá nhân</h2>
              <p className="eht-card-desc">Xem và cập nhật thông tin tài khoản</p>
            </div>
            <button
              type="button"
              className="eht-btn eht-btn-sm"
              onClick={() => setEditProfile((v) => !v)}
              title="Chỉnh sửa"
            >
              ✎
            </button>
          </div>

          {profileMsg && <div className="auth-success" style={{ marginBottom: 12 }}>{profileMsg}</div>}
          {profileErr && <div className="auth-error" style={{ marginBottom: 12 }}>{profileErr}</div>}

          {!editProfile ? (
            <div className="eht-field-grid">
              <div>
                <p className="eht-field-label">Họ và tên</p>
                <p className="eht-field-value">{user?.fullName || '—'}</p>
              </div>
              <div>
                <p className="eht-field-label">Tên hiển thị</p>
                <p className="eht-field-value">{lastName}</p>
              </div>
              <div>
                <p className="eht-field-label">Email</p>
                <p className="eht-field-value">{user?.email || '—'}</p>
              </div>
              <div>
                <p className="eht-field-label">Số điện thoại</p>
                <p className="eht-field-value">{user?.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="eht-field-grid">
              <div className="form-group">
                <label>Họ và tên</label>
                <input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" value={user?.email || ''} disabled />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <button type="button" className="eht-btn" onClick={() => setEditProfile(false)}>Hủy</button>
                <button type="submit" className="eht-btn eht-btn-primary">Lưu</button>
              </div>
            </form>
          )}
        </section>

        <AccountChangeRequests currentUser={user} />

        {/* Đổi mật khẩu */}
        <section className="eht-card">
          <div className="eht-card-head">
            <div>
              <h2 className="eht-card-title">Đổi mật khẩu</h2>
              <p className="eht-card-desc">Giữ an toàn cho tài khoản của bạn</p>
            </div>
            <button type="button" className="eht-btn eht-btn-sm" onClick={() => setEditPass((v) => !v)} title="Đổi mật khẩu">
              ✎
            </button>
          </div>

          {passMsg && <div className="auth-success" style={{ marginBottom: 12 }}>{passMsg}</div>}
          {passErr && <div className="auth-error" style={{ marginBottom: 12 }}>{passErr}</div>}

          {!editPass ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p className="eht-field-label">Mật khẩu</p>
                <p className="eht-field-value">••••••••</p>
                <p className="eht-card-desc" style={{ marginTop: 6 }}>
                  Nhấn chỉnh sửa để đặt mật khẩu mới (tối thiểu 8 ký tự, có hoa, thường, số).
                </p>
              </div>
              <button type="button" className="eht-btn" onClick={() => setEditPass(true)}>
                ✎ Đổi mật khẩu
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <input type="password" className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="≥8, hoa + thường + số" />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="eht-btn" onClick={() => setEditPass(false)}>Hủy</button>
                <button type="submit" className="eht-btn eht-btn-primary">Lưu mật khẩu</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
