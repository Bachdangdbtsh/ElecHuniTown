'use client';

import { useState } from 'react';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';

const MAX_AVATAR_BYTES = 200000;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export default function Avatar({ avatar, onUpdated }) {
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  function chooseFile(file) {
    setError('');
    setSuccess('');
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_AVATAR_BYTES) {
      setSelected('');
      setError('Chỉ chọn ảnh PNG, JPEG hoặc WebP dưới 200 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSelected(String(reader.result || ''));
    reader.onerror = () => setError('Không đọc được ảnh đã chọn.');
    reader.readAsDataURL(file);
  }

  async function updateAvatar() {
    if (!selected || saving) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await apiFetch('/auth/avatar', {
        method: 'PATCH',
        body: { avatar: selected },
      });
      onUpdated?.(updated.avatar);
      setSelected('');
      setSuccess('Ảnh đại diện đã được cập nhật.');
    } catch (cause) {
      setError(cause.message || 'Không thể cập nhật ảnh đại diện.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="account-avatar-editor">
      <Image
        className="account-avatar-preview"
        src={selected || avatar || '/default-avatar.svg'}
        alt="Ảnh đại diện hiện tại"
        width={88}
        height={88}
        unoptimized
      />
      <div className="account-avatar-controls">
        <label className="account-avatar-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
          event.preventDefault();
          chooseFile(event.dataTransfer.files?.[0]);
        }}>
          <span>Chọn ảnh hoặc kéo thả vào đây</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              chooseFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        <span className="eht-card-desc">PNG, JPEG hoặc WebP · tối đa 200 KB</span>
        <button type="button" className="eht-btn eht-btn-primary" onClick={updateAvatar} disabled={!selected || saving}>
          {saving ? 'Đang cập nhật…' : 'Cập nhật ảnh đại diện'}
        </button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {success && <p className="auth-success" role="status">{success}</p>}
      </div>
    </div>
  );
}
