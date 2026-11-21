'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiGet, apiPost } from '@/lib/api';
import ShellTopBar from '../_components/ShellTopBar';
import './orders.css';

const money = (value) => Number(value || 0).toLocaleString('vi-VN') + ' ₫';
const labels = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', DELIVERED_PENDING_CONFIRM: 'Chờ xác nhận giao hàng', DELIVERED_CONFIRMED: 'Đã xác nhận giao hàng', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy' };
const returnLabels = { PENDING: 'Chờ xét duyệt', APPROVED: 'Đã đồng ý, chờ hoàn tiền', DENIED: 'Đã từ chối', REFUNDED: 'Đã hoàn tiền' };

export default function AccountOrdersPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet('/returns/my-orders');
      setOrders(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    apiGet('/auth/me').then(setUser).catch(() => {});
    const timer = setTimeout(load, 0);
    window.addEventListener('focus', load);
    return () => { clearTimeout(timer); window.removeEventListener('focus', load); };
  }, [load]);

  useEffect(() => {
    if (!orders.some((order) => ['SHIPPING', 'DELIVERED_PENDING_CONFIRM'].includes(order.status)
      || order.returnRequests?.some((request) => ['PENDING', 'APPROVED'].includes(request.status)))) return;
    const timer = setInterval(load, 5_000);
    return () => clearInterval(timer);
  }, [orders, load]);

  async function chooseImages(event) {
    const files = Array.from(event.target.files || []);
    if (files.length > 2 || files.some((file) => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 290000)) {
      setError('Chọn tối đa 2 ảnh PNG, JPEG hoặc WebP, mỗi ảnh dưới 290 KB');
      event.target.value = '';
      return;
    }
    const values = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
    setImages(values);
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    try {
      await apiPost('/returns', { orderId: selected.id, reason, images });
      setSelected(null);
      setReason('');
      setImages([]);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelivery(orderId) {
    setBusy(true);
    setError('');
    try {
      await apiPost(`/orders/${orderId}/confirm-delivery`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <ShellTopBar title="Đơn hàng của tôi" subtitle="Theo dõi đơn hàng và gửi yêu cầu đổi trả" user={user} />
    <div className="eht-content account-orders">
      {error && <p className="account-order-error" role="alert">{error}</p>}
      {loading ? <p>Đang tải đơn hàng…</p> : orders.length === 0 ? <div className="eht-card"><p>Bạn chưa có đơn hàng.</p><Link href="/">Tiếp tục mua sắm</Link></div> : (
        <div className="account-order-list">{orders.map((order) => <article className="eht-card account-order-card" key={order.id}>
          <div className="account-order-head"><div><strong>Đơn hàng #{order.id}</strong><small>{new Date(order.orderDate).toLocaleString('vi-VN')}</small></div><span className="eht-badge">{labels[order.status] || order.status}</span></div>
          <div className="account-order-items">{order.items.map((item) => <p key={item.productId}>
            <Image src={item.product?.pictures?.[0]?.url || '/placeholder.png'} alt="" width={60} height={60} unoptimized />
            <span className="account-order-item-name">{item.product?.productName || `Sản phẩm #${item.productId}`}</span>
            <span className="account-order-item-quantity">× {item.quantity}</span>
          </p>)}</div>
          <div className="account-order-foot"><strong>{money(order.totalCost)}</strong><div><Link href={`/order/detail/${order.id}`} className="eht-btn eht-btn-sm">Xem chi tiết</Link>{order.status === 'DELIVERED_PENDING_CONFIRM' && <button type="button" disabled={busy} className="eht-btn eht-btn-primary eht-btn-sm" onClick={() => confirmDelivery(order.id)}>Xác nhận đã nhận hàng</button>}{['DELIVERED', 'DELIVERED_CONFIRMED'].includes(order.status) && !order.returnRequests?.length && <button type="button" className="eht-btn eht-btn-primary eht-btn-sm" onClick={() => { setSelected(order); setError(''); }}>Đổi trả - hoàn tiền</button>}{order.returnRequests?.length > 0 && <span className="eht-badge">Yêu cầu đổi trả: {returnLabels[order.returnRequests[0].status] || order.returnRequests[0].status}</span>}</div></div>
        </article>)}</div>
      )}
    </div>
    {selected && <div className="account-return-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setSelected(null); }}>
      <form className="account-return-modal" role="dialog" aria-modal="true" aria-labelledby="return-title" onSubmit={submit}>
        <h2 id="return-title">Đổi trả - hoàn tiền</h2>
        <p>Đơn hàng #{selected.id} · {new Date(selected.orderDate).toLocaleDateString('vi-VN')}</p>
        <p>Người nhận: {selected.recipient?.recipientName} · {selected.recipient?.recipientPhoneNumber}</p>
        <p>Địa chỉ: {selected.recipient?.address}</p>
        <div className="account-return-products">{selected.items.map((item) => <p key={item.productId}>{item.product?.productName} × {item.quantity}</p>)}</div>
        <strong>Tổng thanh toán: {money(selected.totalCost)}</strong>
        <label htmlFor="return-reason">Lý do hoàn trả</label>
        <textarea id="return-reason" required minLength={10} maxLength={2000} rows={5} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Mô tả tình trạng sản phẩm và lý do đổi trả…" />
        <label htmlFor="return-images">Ảnh minh họa (tối đa 2 ảnh, mỗi ảnh dưới 290 KB)</label>
        <input id="return-images" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={chooseImages} />
        {images.length > 0 && <span>Đã chọn {images.length} ảnh</span>}
        <div className="account-return-actions"><button type="button" className="eht-btn" disabled={busy} onClick={() => setSelected(null)}>Huỷ</button><button type="submit" className="eht-btn eht-btn-primary" disabled={busy}>{busy ? 'Đang gửi…' : 'Xác nhận Gửi'}</button></div>
      </form>
    </div>}
  </>;
}
