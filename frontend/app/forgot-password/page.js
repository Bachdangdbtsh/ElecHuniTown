'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';
import '../eht-ui.css';

/**
 * Multi-step forgot password (bám mockup AuthPortal):
 * 1) Nhập email → 2) Token + mật khẩu mới → 3) Thành công
 * Dev: backend có thể trả resetToken trong response để test không cần email.
 */
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
    setMsg('');
    setLoading(true);
    try {
      const res = await apiPost('/auth/forgot-password', { email });
      setMsg(res.message || 'Nếu email tồn tại, hướng dẫn đã được gửi.');
      if (res.resetToken) {
        setToken(res.resetToken);
        setMsg((m) => `${m} (Dev: mã đã điền sẵn.)`);
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
    setMsg('');
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
      setMsg(res.message || 'Đặt lại mật khẩu thành công.');
      setStep(3);
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
          <BrandLogo variant="authMark" className="auth-brand-mark" />
          <p className="auth-logo">ElecHuniTown</p>
          <p className="auth-subtitle">Khôi phục mật khẩu tài khoản</p>
        </div>

        <p style={{ fontSize: 12, color: 'var(--cust-muted)', marginBottom: 12 }}>
          Bước {step}/3
        </p>

        {error && <div className="auth-error">{error}</div>}
        {msg && <div className="auth-success">{msg}</div>}

        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendToken}>
            <div className="form-group">
              <label htmlFor="fp-email">Email tài khoản</label>
              <input
                id="fp-email"
                type="email"
                className="form-control"
                placeholder="you@student.edu.vn"
                required
                autoComplete="email"
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
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="fp-token">Mã xác thực</label>
              <input
                id="fp-token"
                type="text"
                className="form-control"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Dán mã nhận được (dev: tự điền)"
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
                placeholder="≥8 ký tự, có hoa, thường, số"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="fp-confirm">Xác nhận mật khẩu mới</label>
              <input
                id="fp-confirm"
                type="password"
                className="form-control"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setMsg(''); }}
                style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--cust-muted)', cursor: 'pointer' }}
              >
                ← Nhập lại email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
            </p>
            <button type="button" className="auth-btn" onClick={() => router.push('/login')}>
              Về trang đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
