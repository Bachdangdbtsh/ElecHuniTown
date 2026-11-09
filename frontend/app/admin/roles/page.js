'use client';

import { useState } from 'react';
import { useApi } from '../_lib/useApi';
import AsyncSection from '../_components/AsyncSection';
import { apiPut } from '@/lib/api';

export default function AdminRolesPage() {
  const matrixState = useApi('/roles/matrix');
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [activePerms, setActivePerms] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusErr, setStatusErr] = useState('');

  function handleSelectRole(role) {
    setSelectedRoleId(role.id);
    setActivePerms(new Set(role.assignedPermissionIds));
  }

  function handleTogglePerm(permId) {
    if (!activePerms) return;
    const next = new Set(activePerms);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setActivePerms(next);
  }

  async function handleSavePermissions() {
    if (!selectedRoleId || !activePerms) return;
    setSaving(true);
    setStatusMsg('');
    setStatusErr('');
    try {
      await apiPut(`/roles/${selectedRoleId}/permissions`, {
        permissionIds: Array.from(activePerms),
      });
      setStatusMsg('Cập nhật phân quyền thành công.');
      matrixState.reload();
    } catch (err) {
      setStatusErr(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        {statusMsg && <div className="auth-success" style={{ marginBottom: 12 }}>{statusMsg}</div>}
        {statusErr && <div className="auth-error" style={{ marginBottom: 12 }}>{statusErr}</div>}
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Phân quyền truy cập</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
          Cấu hình quyền hạn chức năng theo từng vai trò trong hệ thống
        </p>
      </div>

      <AsyncSection state={matrixState} minHeight={300}>
        {(data) => {
          const selectedRole = data.roles.find((r) => r.id === (selectedRoleId ?? data.roles[0].id));
          const currentPermSet = activePerms ?? new Set(selectedRole.assignedPermissionIds);

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
              {/* Cột danh sách vai trò */}
              <div className="st-panel" style={{ padding: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Danh sách vai trò</h2>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.roles.map((r) => {
                    const isCurrent = r.id === selectedRole.id;
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          className="adm-nav-item"
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            border: 'none',
                            background: isCurrent ? 'var(--ink)' : 'transparent',
                            color: isCurrent ? '#fff' : 'var(--ink)',
                          }}
                          onClick={() => handleSelectRole(r)}
                        >
                          <p style={{ fontWeight: 700 }}>{r.name}</p>
                          <p style={{ fontSize: 11, opacity: 0.8 }}>{r.userCount} người dùng</p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Cột ma trận quyền */}
              <div className="st-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>{selectedRole.name}</h2>
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>{selectedRole.description}</p>
                  </div>
                  <button
                    type="button"
                    className="st-btn st-btn-primary"
                    disabled={saving}
                    onClick={handleSavePermissions}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {data.permissionGroups.map((g) => (
                    <div key={g.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: 'var(--ink)' }}>{g.name}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                        {g.permissions.map((p) => {
                          const checked = currentPermSet.has(p.id);
                          return (
                            <label
                              key={p.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 13,
                                cursor: 'pointer',
                                background: checked ? 'var(--mint-soft)' : '#f8fafc',
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: checked ? '1px solid var(--mint)' : '1px solid var(--line)',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleTogglePerm(p.id)}
                              />
                              <span>{p.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }}
      </AsyncSection>
    </div>
  );
}
