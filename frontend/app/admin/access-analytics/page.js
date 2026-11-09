'use client';

import { useState } from 'react';
import { useApi } from '../_lib/useApi';
import AsyncSection from '../_components/AsyncSection';

export default function AccessAnalyticsPage() {
  const [days, setDays] = useState(90);
  const analyticsState = useApi('/admin/access-analytics', { days });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Phân tích truy cập</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
            Tần suất truy cập, giờ cao điểm và người dùng hoạt động nhiều nhất
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
        {(data) => {
          const hours = data.hourlyDistribution || [];
          const maxHour = Math.max(1, ...hours.map((h) => h.count || 0));
          const weekdays = data.weekdayDistribution || {};
          const maxDay = Math.max(1, ...Object.values(weekdays).map(Number), 1);

          return (
            <>
              <div className="adm-grid-kpi">
                <div className="adm-kpi-card">
                  <p className="adm-kpi-title">Số ngày có hoạt động</p>
                  <p className="adm-kpi-value">
                    {data.activeDaysCount} / {data.daysConfigured || days}
                  </p>
                </div>
                <div className="adm-kpi-card">
                  <p className="adm-kpi-title">Tổng số phiên truy cập</p>
                  <p className="adm-kpi-value">{data.totalSessions}</p>
                </div>
                <div className="adm-kpi-card">
                  <p className="adm-kpi-title">Giờ cao điểm</p>
                  <p className="adm-kpi-value" style={{ color: 'var(--ink)' }}>
                    {data.peakHour}
                  </p>
                </div>
                <div className="adm-kpi-card">
                  <p className="adm-kpi-title">Top người dùng</p>
                  <p className="adm-kpi-value">{data.topUsers?.length ?? 0}</p>
                </div>
              </div>

              <div className="st-panel">
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Mức sử dụng theo thứ</h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                  Tổng phiên đăng nhập theo từng ngày trong tuần
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(weekdays).map(([day, count]) => (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                      <span style={{ width: 28, fontWeight: 700, color: 'var(--muted)' }}>{day}</span>
                      <div style={{ flex: 1, height: 20, background: 'rgba(0,0,0,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(Number(count) / maxDay) * 100}%`,
                            background: 'var(--accent, #649c75)',
                            borderRadius: 6,
                            minWidth: count ? 4 : 0,
                          }}
                        />
                      </div>
                      <span style={{ width: 40, textAlign: 'right', fontWeight: 600 }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="st-panel">
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Hoạt động theo giờ</h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                  Phân bố phiên trong ngày (cao điểm: {data.peakHour})
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160 }}>
                  {hours.map((h) => {
                    const isPeak = `${String(h.hour).padStart(2, '0')}:00` === data.peakHour;
                    return (
                      <div
                        key={h.hour}
                        title={`${String(h.hour).padStart(2, '0')}:00 · ${h.count} phiên`}
                        style={{
                          flex: 1,
                          height: `${Math.max(2, (h.count / maxHour) * 100)}%`,
                          background: isPeak ? 'var(--ink, #000)' : 'var(--structural, #8fe3a9)',
                          borderRadius: '3px 3px 0 0',
                          minHeight: 2,
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--muted)' }}>
                  <span>00</span>
                  <span>06</span>
                  <span>12</span>
                  <span>18</span>
                  <span>23</span>
                </div>
              </div>

              <div className="st-panel">
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Người dùng hoạt động nhiều nhất</h2>
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mã</th>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Số phiên</th>
                      <th>Số ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topUsers || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                          Chưa có dữ liệu đăng nhập trong khoảng đã chọn.
                        </td>
                      </tr>
                    ) : (
                      data.topUsers.map((u, i) => (
                        <tr key={u.id}>
                          <td>{i + 1}</td>
                          <td>{u.userCode}</td>
                          <td>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td>{u.roleName}</td>
                          <td>{u.loginCount}</td>
                          <td>{u.activeDaysCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          );
        }}
      </AsyncSection>
    </div>
  );
}
