'use client';

import { useState } from 'react';
import { useApi } from '../_lib/useApi';
import AsyncSection from '../_components/AsyncSecction';

export default function AccessAnalyticsPage() {
  const [days, setDays] = useState(90);
  const analyticsState = useApi('/admin/access-analytics', { days });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Phân tích truy cập</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
            Tần suất truy cập, mức sử dụng và người dùng hoạt động nhiều nhất
          </p>
        </div>

        <div className="st-segment">
          {[30, 90, 180].map((d) => (
            <button
              key={d}
              type="button"
              className="st-segment-btn"
              aria-pressed={days === d}
              onClick={() => setDays(d)}
            >
              {d === 180 ? '6 tháng' : `${d} ngày`}
            </button>
          ))}
        </div>
      </div>

      <AsyncSection state={analyticsState} minHeight={300}>
        {(data) => (
          <>
            {/* KPI */}
            <div className="adm-grid-kpi">
              <div className="adm-kpi-card">
                <p className="adm-kpi-title">Số ngày có hoạt động</p>
                <p className="adm-kpi-value">{data.activeDaysCount} / {days}</p>
              </div>
              <div className="adm-kpi-card">
                <p className="adm-kpi-title">Tổng số phiên truy cập</p>
                <p className="adm-kpi-value">{data.totalSessions}</p>
              </div>
              <div className="adm-kpi-card">
                <p className="adm-kpi-title">Giờ cao điểm</p>
                <p className="adm-kpi-value" style={{ color: 'var(--ink)' }}>{data.peakHour}</p>
              </div>
              <div className="adm-kpi-card">
                <p className="adm-kpi-title">Người dùng tích cực</p>
                <p className="adm-kpi-value">{data.topUsers.length}</p>
              </div>
            </div>

            {/* Mức sử dụng theo ngày trong tuần */}
            <div className="st-panel">
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Phân bố phiên đăng nhập theo thứ trong tuần</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
                {Object.entries(data.weekdayDistribution).map(([day, count]) => (
                  <div key={day} style={{ textAlign: 'center', background: 'var(--mint-soft)', padding: 14, borderRadius: 10 }}>
                    <p style={{ fontWeight: 800, fontSize: 16 }}>{day}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>{count}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)' }}>phiên</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top người dùng */}
            <div className="st-panel">
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Người dùng hoạt động nhiều nhất</h2>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã</th>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Số ngày hoạt động</th>
                    <th>Lượt truy cập</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topUsers.map((u, idx) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700 }}>{idx + 1}</td>
                      <td>{u.userCode}</td>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.roleName}</td>
                      <td>{u.activeDaysCount} ngày</td>
                      <td style={{ fontWeight: 700 }}>{u.loginCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AsyncSection>
    </div>
  );
}
