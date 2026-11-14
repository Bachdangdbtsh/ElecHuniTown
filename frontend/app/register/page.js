'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import '../eht-ui.css';

const subscribe = () => () => {};
const getReturnToCart = () => new URLSearchParams(window.location.search).get('returnTo') === '/cart';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const returnToCart = useSyncExternalStore(subscribe, getReturnToCart, () => false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await apiPost('/auth/register', {
        fullName,
        email,
        phone: phone || undefined,
        password,
        confirmPassword,
      });

      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push(returnToCart ? '/login?returnTo=%2Fcart' : '/login');
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
          <div className="auth-brand-mark">EH</div>
          <p className="auth-logo">ElecHuniTown</p>
          <p className="auth-subtitle">Thiết bị gia dụng thông minh cho cuộc sống sinh viên</p>
        </div>

        <div className="auth-tabs">
          <Link href={returnToCart ? '/login?returnTo=%2Fcart' : '/login'} className="auth-tab">
            Đăng nhập
          </Link>
          <Link href="/register" className="auth-tab active">
            Đăng ký
          </Link>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Họ và tên</label>
            <input
              id="reg-name"
              type="text"
              className="form-control"
              placeholder="Nguyễn Văn A"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="form-control"
              placeholder="you@student.edu.vn"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-phone">Số điện thoại (tùy chọn)</label>
            <input
              id="reg-phone"
              type="text"
              className="form-control"
              placeholder="0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-pass">Mật khẩu (tối thiểu 8 ký tự)</label>
            <input
              id="reg-pass"
              type="password"
              className="form-control"
              placeholder="Tối thiểu 8 ký tự, gồm hoa, thường, số"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-conf">Xác nhận mật khẩu</label>
            <input
              id="reg-conf"
              type="password"
              className="form-control"
              placeholder="Nhập lại mật khẩu"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
