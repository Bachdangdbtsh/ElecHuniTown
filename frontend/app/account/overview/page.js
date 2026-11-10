'use client';

import Link from 'next/link';
import { useApi } from '../_lib/useApi';
import AsyncSection from '../_components/AsyncSection';
import ShellTopBar from '../_components/ShellTopBar';

export default function AccountOverviewPage() {
  const userState = useApi('/auth/me');
  const addressesState = useApi('/recipients');
  const addressCount = Array.isArray(addressesState.data) ? addressesState.data.length : null;

  return (
    <>
      <ShellTopBar
        title="Tổng quan"
        subtitle="Tóm tắt tài khoản của bạn"
        user={userState.data}
      />
      <div className="eht-content">
        <AsyncSection state={userState} minHeight={160}>
          {(user) => (
            <>
              <div className="eht-kpi-row">
                <div className="eht-kpi">
                  <p className="eht-kpi-num">{addressCount ?? '—'}</p>
                  <p className="eht-kpi-lbl">Địa chỉ nhận hàng</p>
                </div>
                <div className="eht-kpi">
                  <p className="eht-kpi-num" style={{ fontSize: 18 }}>{user.roleName || user.role || '—'}</p>
                  <p className="eht-kpi-lbl">Vai trò</p>
                </div>
                <div className="eht-kpi">
                  <p className="eht-kpi-num" style={{ fontSize: 18 }}>{user.isActive === false ? 'Khóa' : 'Hoạt động'}</p>
                  <p className="eht-kpi-lbl">Trạng thái</p>
                </div>
              </div>
              <div className="eht-card">
                <h2 className="eht-card-title">Xin chào, {user.fullName}!</h2>
                <p className="eht-card-desc">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
                  <Link href="/account/profile" className="eht-btn eht-btn-primary">Hồ sơ & mật khẩu</Link>
                  <Link href="/account/addresses" className="eht-btn">Sổ địa chỉ</Link>
                  <Link href="/account/orders" className="eht-btn">Đơn hàng</Link>
                  <Link href="/" className="eht-btn">Mua sắm</Link>
                </div>
              </div>
            </>
          )}
        </AsyncSection>
      </div>
    </>
  );
}
