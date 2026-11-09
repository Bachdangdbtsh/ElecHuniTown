'use client';

import { useApi } from '../_lib/useApi';
import AsyncSection from '../_components/AsyncSection';
import AddressCard from '../_components/AddressCard';
import AddressModal from '../_components/AddressModal';
import { useEffect, useState } from 'react';
import { apiDelete, apiPatch, apiPost, apiPut, apiFetch } from '@/lib/api';
import ShellTopBar from '../_components/ShellTopBar';

export default function AddressBookPage() {
  const addressesState = useApi('/recipients');
  const [user, setUser] = useState(null);
  useEffect(() => { apiFetch('/auth/me').then(setUser).catch(() => {}); }, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');

  function handleOpenAdd() {
    setEditingData(null);
    setFormError('');
    setModalOpen(true);
  }

  function handleOpenEdit(item) {
    setEditingData(item);
    setFormError('');
    setModalOpen(true);
  }

  function handleCloseModal() {
    setEditingData(null);
    setFormError('');
    setModalOpen(false);
  }

  async function handleSave(payload) {
    setFormError('');
    try {
      if (editingData) {
        await apiPut(`/recipients/${editingData.id}`, payload);
      } else {
        await apiPost('/recipients', payload);
      }
      handleCloseModal();
      addressesState.reload();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    setPageError('');
    try {
      await apiDelete(`/recipients/${id}`);
      addressesState.reload();
    } catch (err) {
      setPageError(err.message);
    }
  }

  async function handleSetDefault(id) {
    setPageError('');
    try {
      await apiPatch(`/recipients/${id}/default`);
      addressesState.reload();
    } catch (err) {
      setPageError(err.message);
    }
  }

  return (
    <>
      <ShellTopBar title="Sổ địa chỉ" subtitle="Quản lý địa chỉ nhận hàng khi thanh toán" user={user} />
      <div className="eht-content">
    <div>
      {pageError && <div className="auth-error" style={{ marginBottom: 12 }}>{pageError}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 className="cust-title">Sổ địa chỉ giao hàng</h1>
          <p className="cust-subtitle">Quản lý các địa chỉ nhận hàng thuận tiện cho việc thanh toán</p>
        </div>
        {!modalOpen && (
          <button
            type="button"
            className="auth-btn"
            style={{ padding: '9px 18px', width: 'auto' }}
            onClick={handleOpenAdd}
          >
            + Thêm địa chỉ mới
          </button>
        )}
      </div>

      <AddressModal
        isOpen={modalOpen}
        initialData={editingData}
        onClose={handleCloseModal}
        onSave={handleSave}
        error={formError}
      />

      <AsyncSection
        state={addressesState}
        minHeight={200}
        isEmpty={(items) => items.length === 0}
        emptyText="Bạn chưa lưu địa chỉ nhận hàng nào. Nhấn '+ Thêm địa chỉ mới' để thêm."
      >
        {(addresses) => (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {addresses.map((item) => (
              <AddressCard
                key={item.id}
                address={item}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </AsyncSection>
    </div>
  </div>
    </>
  );
}