'use client';

import Link from 'next/link';
import { useApi } from '../_lib/useApi';
import AsyncSection from '../_components/AsyncSection';

export default function AccountOverviewPage() {
  const userState = useApi('/auth/me');
  const addressesState = useApi('/recipients');

  return (
    <div>
      <h1 className="cust-title">Tổng quan tài khoản</h1>
      <p className="cust-subtitle">Xem tóm tắt thông tin hoạt động gần đây của bạn</p>

      <AsyncSection state={userState} minHeight={200}>
        {(user) => (
          <div className="cust-card-box">
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Chào mừng trở lại, {user.fullName}!</h2>
            <p style={{ fontSize: 14, color: 'var(--cust-muted)', marginTop: 4 }}>
              Email: {user.email} | Số điện thoại: {user.phone || 'Chưa cập nhật'}
            </p>

            <div className="cust-grid-kpi">
              <div className="cust-kpi-item">
                <p className="cust-kpi-num">{addressesState.data?.length ?? '—'}</p>
                <p className="cust-kpi-lbl">Địa chỉ nhận hàng</p>
              </div>
              <div className="cust-kpi-item">
                <p className="cust-kpi-num">0</p>
                <p className="cust-kpi-lbl">Đơn hàng đang giao</p>
              </div>
              <div className="cust-kpi-item">
                <p className="cust-kpi-num">0</p>
                <p className="cust-kpi-lbl">Mã giảm giá</p>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <Link
                href="/account/addresses"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--cust-primary)',
                  textDecoration: 'underline',
                }}
              >
                Quản lý sổ địa chỉ giao hàng &rarr;
              </Link>
            </div>
          </div>
        )}
      </AsyncSection>
    </div>
  );
}