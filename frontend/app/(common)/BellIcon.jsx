'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiBell } from 'react-icons/fi';
import { apiGet, apiPatch } from '@/lib/api';
import './bell.css';

export default function BellIcon({ user }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const root = useRef(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiGet('/api/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError('');
    } catch {
      setError('Không tải được thông báo.');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const initial = setTimeout(load, 0);
    const timer = setInterval(load, 30000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [user, load]);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  async function openItem(item) {
    try {
      if (!item.isRead) {
        await apiPatch(`/api/notifications/${item.id}/read`);
        setNotifications((current) => current.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      if (item.url?.startsWith('/') && !item.url.startsWith('//')) {
        setOpen(false);
        router.push(item.url);
      }
    } catch {
      setError('Không đánh dấu được thông báo.');
    }
  }

  async function markAllRead() {
    try {
      await apiPatch('/api/notifications/mark-all-read');
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setError('');
    } catch {
      setError('Không đánh dấu được thông báo.');
    }
  }

  if (!user) return null;
  return <div className="notification-root" ref={root}>
    <button type="button" className="eht-icon-btn notification-trigger" aria-label="Thông báo" aria-expanded={open} onClick={() => { setOpen((value) => !value); load(); }}>
      <FiBell aria-hidden="true" />
      {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    {open && <div className="notification-popup" role="region" aria-label="Danh sách thông báo">
      <div className="notification-header">Thông báo</div>
      {error && <p className="notification-error" role="alert">{error}</p>}
      <div className="notification-list">
        {notifications.length === 0 ? <p className="notification-empty">Không có thông báo</p> : notifications.map((item) =>
          <button type="button" key={item.id} onClick={() => openItem(item)} className={`notification-item ${item.isRead ? 'is-read' : 'is-unread'}`}>
            <span>{item.message}</span>
            <small>{new Date(item.createdAt).toLocaleString('vi-VN')}</small>
          </button>)}
      </div>
      <div className="notification-footer">
        <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>Đánh dấu tất cả đã đọc</button>
        <button type="button" onClick={() => setOpen(false)}>Đóng</button>
      </div>
    </div>}
  </div>;
}
