'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api';
import '../eht-ui.css';

const subscribe = () => () => {};
const getReturnToCart = () => new URLSearchParams(window.location.search).get('returnTo') === '/cart';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const returnToCart = useSyncExternalStore(subscribe, getReturnToCart, () => false);

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
      if (r && (r === '/store' || r.startsWith('/store/') || r === '/statistics' || r === '/inventory')) return r;
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
      const role = data.user.role;
      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'STAFF' || role === 'SHOP_OWNER') {
        router.push('/inventory');
      } else {
        const returnTo = new URLSearchParams(window.location.search).get('returnTo');
        router.push(returnTo === '/cart' ? '/cart' : '/account/overview');
      }
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
          <div className="auth-brand-mark">EH</div>
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
