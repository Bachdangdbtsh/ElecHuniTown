'use client';

import { useState } from 'react';
import { useApi } from '../_lib/useApi';
import AsyncSection from '../_components/AsyncSection';
import CreateUserModal from '../_components/CreateUserModal';
import UserDrawer from '../_components/UserDrawer';

export default function AdminUsersPage() {
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const query = {
    role,
    status,
    page,
    limit: 10,
    ...(search.trim() ? { search: search.trim() } : {}),
  };

  const usersState = useApi('/admin/users', query);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="eht-page-title">Quản lý tài khoản</h1>
          <p className="eht-page-sub">Quản lý tài khoản khách hàng, nhân viên và đối tác</p>
        </div>
        <button type="button" className="eht-btn eht-btn-primary" onClick={() => setIsModalOpen(true)}>
          + Tạo tài khoản nhân viên
        </button>
      </div>

      <div className="eht-kpi-row">
        <div className="eht-kpi">
          <p className="eht-kpi-num">{usersState.data?.kpis?.totalUsers ?? '—'}</p>
          <p className="eht-kpi-lbl">Tổng người dùng</p>
        </div>
        <div className="eht-kpi">
          <p className="eht-kpi-num">{usersState.data?.kpis?.customerCount ?? '—'}</p>
          <p className="eht-kpi-lbl">Khách hàng</p>
        </div>
        <div className="eht-kpi">
          <p className="eht-kpi-num">{usersState.data?.kpis?.staffAndAdminCount ?? '—'}</p>
          <p className="eht-kpi-lbl">Nhân viên / Quản trị</p>
        </div>
        <div className="eht-kpi">
          <p className="eht-kpi-num" style={{ color: 'var(--eht-danger, #dc2626)' }}>{usersState.data?.kpis?.lockedCount ?? '—'}</p>
          <p className="eht-kpi-lbl">Bị khóa</p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          className="st-segment-btn"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          style={{ border: '1.5px solid var(--ink)', borderRadius: 8 }}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="CUSTOMER">Khách hàng</option>
          <option value="STAFF">Nhân viên</option>
          <option value="SHOP_OWNER">Chủ ứng dụng</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>

        <select
          className="st-segment-btn"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ border: '1.5px solid var(--ink)', borderRadius: 8 }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đã khóa</option>
        </select>

        <input
          type="text"
          className="form-control"
          placeholder="Tìm theo tên, email, sđt..."
          style={{ maxWidth: 280 }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <button type="button" className="adm-btn" onClick={usersState.reload} style={{ marginLeft: 'auto' }}>
          Làm mới
        </button>
      </div>

      {/* Bảng danh sách */}
      <AsyncSection
        state={usersState}
        minHeight={280}
        isEmpty={(d) => d.items.length === 0}
        emptyText="Không tìm thấy người dùng phù hợp."
      >
        {(d) => (
          <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Hoạt động gần nhất</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.userCode}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.roleName}</td>
                    <td>
                      <span className={`adm-badge ${u.isActive ? 'adm-badge-active' : 'adm-badge-locked'}`}>
                        {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('vi-VN') : 'Chưa đăng nhập'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="adm-btn"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => setSelectedUserId(u.id)}
                        >
                          Chi tiết
                        </button>
                        {!u.isActive && (
                          <span className="adm-badge adm-badge-locked">Bị khóa</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {d.pagination?.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 16, padding: '0 4px' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                Hiển thị <b>{(d.pagination.page - 1) * d.pagination.limit + 1} - {Math.min(d.pagination.page * d.pagination.limit, d.pagination.total)}</b> trên tổng số <b>{d.pagination.total}</b> người dùng (Trang {d.pagination.page} / {d.pagination.totalPages})
              </span>
              <nav aria-label="Phân trang người dùng" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="adm-btn" disabled={usersState.status === 'loading' || page === 1} onClick={() => setPage((p) => p - 1)}>« Trước</button>
                {Array.from({ length: d.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`adm-btn${p === d.pagination.page ? ' adm-btn-primary' : ''}`}
                    aria-label={`Trang ${p}`}
                    aria-current={p === d.pagination.page ? 'page' : undefined}
                    disabled={usersState.status === 'loading'}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button type="button" className="adm-btn" disabled={usersState.status === 'loading' || page === d.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Sau »</button>
              </nav>
            </div>
          )}
          </>
        )}
      </AsyncSection>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={usersState.reload}
      />

      <UserDrawer
        key={selectedUserId ?? 'closed'}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onRefresh={usersState.reload}
      />
    </div>
  );
}
