'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import '../customer.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendToken(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiPost('/auth/forgot-password', { email });
      setMsg(res.message);
      if (res.resetToken) {
        setToken(res.resetToken);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost('/auth/reset-password', {
        email,
        token,
        newPassword,
        confirmPassword,
      });
      alert(res.message);
      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <p className="auth-logo">ElecHuniTown</p>
          <p className="auth-subtitle">Khôi phục mật khẩu tài khoản</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {msg && <div className="auth-success">{msg}</div>}

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleSendToken}>
            <div className="form-group">
              <label htmlFor="fp-email">Nhập email tài khoản</label>
              <input
                id="fp-email"
                type="email"
                className="form-control"
                placeholder="you@student.edu.vn"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Link href="/login" style={{ fontSize: 13, color: 'var(--cust-muted)' }}>
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="fp-token">Mã xác thực token</label>
              <input
                id="fp-token"
                type="text"
                className="form-control"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fp-newpass">Mật khẩu mới</label>
              <input
                id="fp-newpass"
                type="password"
                className="form-control"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fp-conf">Xác nhận mật khẩu mới</label>
              <input
                id="fp-conf"
                type="password"
                className="form-control"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}