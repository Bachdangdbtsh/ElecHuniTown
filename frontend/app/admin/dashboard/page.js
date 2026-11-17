'use client';

import { useApi } from '../_lib/useApi';
import AsyncSection from '../_components/AsyncSection';

export default function AdminDashboardPage() {
  const usersState = useApi('/admin/users', { page: 1, limit: 1 });
  const requestsState = useApi('/admin/change-requests');
  const analyticsState = useApi('/admin/access-analytics', { days: 14 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Tổng quan Quản trị</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
          Tình trạng vận hành người dùng và các yêu cầu phê duyệt gần đây
        </p>
      </header>

      {/* KPI thẻ */}
      <div className="adm-grid-kpi">
        <div className="adm-kpi-card">
          <p className="adm-kpi-title">Tổng số tài khoản</p>
          <p className="adm-kpi-value">{usersState.data?.kpis?.totalUsers ?? '—'}</p>
        </div>
        <div className="adm-kpi-card">
          <p className="adm-kpi-title">Người dùng hoạt động (14 ngày)</p>
          <p className="adm-kpi-value">{analyticsState.data?.topUsers?.length ?? '—'}</p>
        </div>
        <div className="adm-kpi-card">
          <p className="adm-kpi-title">Yêu cầu thay đổi đang chờ</p>
          <p className="adm-kpi-value" style={{ color: requestsState.data?.length > 0 ? '#b45309' : 'var(--ink)' }}>
            {requestsState.data?.length ?? '—'}
          </p>
        </div>
        <div className="adm-kpi-card">
          <p className="adm-kpi-title">Tài khoản bị khóa</p>
          <p className="adm-kpi-value" style={{ color: 'var(--down)' }}>
            {usersState.data?.kpis?.lockedCount ?? '—'}
          </p>
        </div>
      </div>

      {/* Biểu đồ hoạt động theo giờ */}
      <section className="st-panel" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Mật độ truy cập theo giờ trong ngày (14 ngày qua)</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Giờ cao điểm hoạt động nhiều nhất: <strong>{analyticsState.data?.peakHour ?? '—'}</strong>
        </p>

        <AsyncSection state={analyticsState} minHeight={220}>
          {(data) => {
            const max = Math.max(...data.hourlyDistribution.map((h) => h.count), 1);
            return (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, marginTop: 24, paddingBottom: 20 }}>
                {data.hourlyDistribution.map((h) => {
                  const pct = (h.count / max) * 100;
                  return (
                    <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(pct, 4)}%`,
                          background: h.count === max ? 'var(--ink)' : 'var(--mint)',
                          borderRadius: '4px 4px 0 0',
                        }}
                        title={`${h.hour}:00 - ${h.count} lượt truy cập`}
                      />
                      <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                        {h.hour % 3 === 0 ? `${h.hour}h` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          }}
        </AsyncSection>
      </section>
    </div>
  );
}
