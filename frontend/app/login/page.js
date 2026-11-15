'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';
import '../eht-ui.css';

const subscribe = () => () => {};
const getSearch = () => window.location.search;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const search = useSyncExternalStore(subscribe, getSearch, () => '');
  const params = new URLSearchParams(search);
  const returnToCart = params.get('returnTo') === '/cart';
  const justRegistered = params.get('registered') === '1';
  const redirectTo = returnToCart ? '/cart' : params.get('redirect');

  function normalizeRole(role) {
    if (!role) return '';
    if (typeof role === 'string') return role;
    return role.code || role.name || '';
  }

  function destinationForRole(role) {
    const r = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null;

    if (role === 'ADMIN') {
      if (r && r.startsWith('/admin/')) return r;
      return '/admin/dashboard';
    }
    if (role === 'SHOP_OWNER' || role === 'STAFF') {
      if (r && (r === '/store/orders' || r === '/store/categories' || r === '/store/categories/list' || r === '/store/categories/products')) return r;
      if (role === 'SHOP_OWNER' && r && (r === '/store/returns' || r === '/inventory' || r === '/statistics')) return r;
      return '/store/orders';
    }
    // CUSTOMER
    if (r && !/^\/(admin|store|statistics|inventory)(\/|\?|$)/.test(r)) return r;
    return '/account/overview';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPost('/auth/login', { email, password });
      localStorage.setItem("isLoggedIn", "true");
      const role = data.user.role;
      window.location.assign(destinationForRole(role));
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <BrandLogo variant="authMark" className="auth-brand-mark" />
          <p className="auth-logo">ElecHuniTown</p>
          <p className="auth-subtitle">Thiết bị gia dụng thông minh cho cuộc sống sinh viên</p>
        </div>

        <div className="auth-tabs">
          <Link href="/login" className="auth-tab active">
            Đăng nhập
          </Link>
          <Link href={returnToCart ? '/register?returnTo=%2Fcart' : '/register'} className="auth-tab">
            Đăng ký
          </Link>
        </div>

        {justRegistered && (
          <div className="auth-success" style={{ marginBottom: 12 }}>
            Đăng ký thành công. Vui lòng đăng nhập.
          </div>
        )}
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
              autoComplete="email"
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
              autoComplete="current-password"
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
