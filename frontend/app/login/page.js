'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import '../customer.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPost('/auth/login', { email, password });
      localStorage.setItem("isLoggedIn", "true");
      const role = data.user.role;
      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'STAFF' || role === 'SHOP_OWNER') {
        router.push('/statistics');
      } else {
        router.push('/account/overview');
      }
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
          <p className="auth-subtitle">Thiết bị gia dụng thông minh cho cuộc sống sinh viên</p>
        </div>

        <div className="auth-tabs">
          <Link href="/login" className="auth-tab active">
            Đăng nhập
          </Link>
          <Link href="/register" className="auth-tab">
            Đăng ký
          </Link>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="you@student.edu.vn"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label htmlFor="password">Mật khẩu</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--cust-primary)' }}>
                Quên mật khẩu?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Nhập mật khẩu"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}