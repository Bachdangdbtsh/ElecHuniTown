'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';

const STATUS_TEXT = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang vận chuyển',
  DELIVERED: 'Đã nhận',
  CANCELLED: 'Đã hủy',
};

const money = (value) =>
  Number(value || 0).toLocaleString('vi-VN') + ' ₫';

const formatDate = (value) =>
  new Date(value).toLocaleString('vi-VN');

function getNextStatuses(status) {
  const next = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['SHIPPING', 'CANCELLED'],
    SHIPPING: ['DELIVERED'],
  };
  return next[status] || [];
}

/* Popup chi tiết; nhận đơn hàng và callback từ page */
function OrderDetailModal({ order, history, busy, error, onClose, onChangeStatus }) {
  const nextStatuses = getNextStatuses(order.status);

  return (
    <div
      className="staff-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="staff-modal staff-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="staff-order-modal-head">
          <div>
            <h2 id="order-modal-title">Đơn hàng #{order.id}</h2>
            <span className="staff-badge">
              {STATUS_TEXT[order.status] || order.status}
            </span>
          </div>
          <button type="button" className="staff-button secondary" onClick={onClose}>
            Đóng
          </button>
        </header>

        {error && <div className="staff-error">{error}</div>}

        <div className="staff-order-info">
          <p><b>Người nhận</b><span>{order.recipient?.recipientName || order.customer?.fullName || 'Khách vãng lai'}</span></p>
          <p><b>Số điện thoại</b><span>{order.recipient?.recipientPhoneNumber || '—'}</span></p>
          <p className="wide"><b>Địa chỉ giao hàng</b><span>{order.recipient?.address || '—'}</span></p>
          <p><b>Ngày đặt</b><span>{formatDate(order.orderDate)}</span></p>
          <p><b>Ghi chú</b><span>{order.note || 'Không có ghi chú'}</span></p>
        </div>

        <h3 className="staff-order-section-title">Sản phẩm trong đơn</h3>
        <div className="staff-table-wrap staff-order-items">
          <table className="staff-table">
            <thead>
              <tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th></tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.product?.productName || 'Sản phẩm #' + item.productId}</td>
                  <td>{item.quantity}</td>
                  <td>{money(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="staff-order-totals">
          <p><span>Tạm tính</span><b>{money(order.subtotal)}</b></p>
          <p><span>Phí giao hàng</span><b>{money(order.shippingFee)}</b></p>
          <p className="grand-total"><span>Tổng thanh toán</span><b>{money(order.totalCost)}</b></p>
        </div>

        <h3 className="staff-order-section-title">Lịch sử xử lý đơn hàng</h3>
        <div className="staff-order-history">{history.length ? history.map((entry) => <p key={entry.id}><b>{entry.details?.to || entry.details?.status || entry.action}</b> · {entry.actor?.fullName || 'Hệ thống'} · {formatDate(entry.createdAt)}</p>) : <p>Chưa có lịch sử xử lý.</p>}</div>

        <div className="staff-order-status-actions">
          <h3 className="staff-order-section-title">Cập nhật trạng thái</h3>
          <div className="staff-actions">
            {nextStatuses.map((status) => (
              <button
                key={status}
                type="button"
                disabled={busy}
                className={'staff-button' + (status === 'CANCELLED' ? ' danger' : '')}
                onClick={() => onChangeStatus(order, status)}
              >
                {status === 'CONFIRMED' && 'Xác nhận đơn'}
                {status === 'SHIPPING' && 'Đánh dấu đã vận chuyển'}
                {status === 'DELIVERED' && 'Đánh dấu đã nhận'}
                {status === 'CANCELLED' && (order.status === 'PENDING' ? 'Từ chối đơn' : 'Hủy đơn')}
              </button>
            ))}
          </div>
          {order.status === 'DELIVERED' && (
            <span className="staff-subtitle">
              Khách đã nhận hàng.
            </span>
          )}

          {order.status === 'CANCELLED' && (
            <span className="staff-subtitle">
              Đơn hàng đã hủy.
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [pendingDecision, setPendingDecision] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({});
  const [history, setHistory] = useState([]);

  const loadOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        ...(filter ? { status: filter } : {}),
      });

      const result = await apiGet(`/staff/orders?${params}`);

      setOrders(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setStatusCounts(result.statusCounts);
      setError('');

      if (result.page !== page) {
        setPage(result.page);
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [page, pageSize, search, filter]);

  useEffect(() => {
    const timer = setTimeout(loadOrders, 300);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const selectedOrder = orders.find((order) => order.id === selectedId);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    apiGet(`/staff/orders/${selectedId}/history`).then((data) => { if (active) setHistory(data); }).catch(() => { if (active) setHistory([]); });
    return () => { active = false; };
  }, [selectedId, orders]);

  async function changeStatus(order, nextStatus) {
    setBusy(true);
    setError('');

    try {
      await apiPatch('/staff/orders/' + order.id + '/status', { status: nextStatus });
      await loadOrders();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="staff-page">
      <header className="staff-page-head">
        <div>
          <h1>Đơn hàng mới</h1>
          <p className="staff-subtitle">Quản lý và xử lý đơn hàng từ khách hàng</p>
        </div>
        <div className="staff-actions">
          <button type="button" className="staff-button secondary" onClick={loadOrders}>
            Làm mới
          </button>
        </div>
      </header>

      <div className="staff-cards">
        {['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'].map((status) => (
          <div className="staff-card" key={status}>
            <span>{STATUS_TEXT[status]}</span>
            <strong>{statusCounts[status] || 0}</strong>
          </div>
        ))}
      </div>

      <div className="staff-toolbar">
        <input
          className="staff-input"
          placeholder="Tìm mã đơn, tên hoặc SĐT"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <div className="staff-order-filters" role="group" aria-label="Lọc trạng thái đơn hàng">
          {[['', 'Tất cả'], ...Object.entries(STATUS_TEXT)].map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? 'selected' : ''}
              onClick={() => { setFilter(value); setPage(1); }}>{label}</button>
          ))}
        </div>

        <select
          className="staff-select staff-page-size"
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} dòng / trang
            </option>
          ))}
        </select>
      </div>

      {error && !selectedOrder && <div className="staff-error">{error}</div>}

      <div className="staff-table-wrap">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Mã đơn</th><th>Người nhận</th><th>Ngày đặt</th>
              <th>Số lượng</th><th>Tổng tiền</th><th>Trạng thái</th><th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>
                  <strong>{order.recipient?.recipientName || order.customer?.fullName || 'Khách vãng lai'}</strong>
                  <br />
                  <small>{order.recipient?.recipientPhoneNumber}</small>
                </td>
                <td>{formatDate(order.orderDate)}</td>
                <td>{order.items.reduce((total, item) => total + item.quantity, 0)}</td>
                <td>{money(order.totalCost)}</td>
                <td>
                  <span className={'staff-badge ' + (order.status === 'DELIVERED' ? 'green' : order.status === 'CANCELLED' ? 'red' : '')}>
                    {STATUS_TEXT[order.status] || order.status}
                  </span>
                </td>
                <td>
                  <div className="staff-actions">
                    <button type="button" className="staff-button secondary" onClick={() => setSelectedId(order.id)}>Xem chi tiết</button>
                    {order.status === 'PENDING' && <>
                      <button type="button" className="staff-button" onClick={() => setPendingDecision({ order, status: 'CONFIRMED' })}>Xác nhận</button>
                      <button type="button" className="staff-button danger" onClick={() => setPendingDecision({ order, status: 'CANCELLED' })}>Từ chối</button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="7" className="staff-empty">
                  {error ? 'Không tải được đơn hàng' : 'Chưa có đơn hàng phù hợp'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="staff-pagination">
        <span className="staff-pagination-info">
          Tổng {total} đơn hàng · Trang {page} / {totalPages}
        </span>

        <div className="staff-pagination-buttons">
          <button
            type="button"
            className="staff-button secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Trước
          </button>

          <button
            type="button"
            className="staff-button secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Sau
          </button>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          history={history}
          busy={busy}
          error={error}
          onClose={() => setSelectedId(null)}
          onChangeStatus={(order, status) => setPendingDecision({ order, status })}
        />
      )}
      {pendingDecision && <div className="staff-modal-backdrop staff-decision-backdrop" role="presentation">
        <section className="staff-modal staff-decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-title">
          <h2 id="decision-title">{pendingDecision.status === 'CANCELLED' ? 'Từ chối đơn hàng' : 'Xác nhận đơn hàng'}</h2>
          <p>Bạn có chắc chắn muốn {pendingDecision.status === 'CANCELLED' ? 'từ chối' : 'cập nhật'} đơn hàng #{pendingDecision.order.id} của khách hàng {pendingDecision.order.recipient?.recipientName || pendingDecision.order.customer?.fullName}?</p>
          <div className="staff-modal-actions"><button type="button" className="staff-button secondary" onClick={() => setPendingDecision(null)} disabled={busy}>Hủy bỏ</button><button type="button" className={'staff-button' + (pendingDecision.status === 'CANCELLED' ? ' danger' : '')} disabled={busy} onClick={async () => { await changeStatus(pendingDecision.order, pendingDecision.status); setPendingDecision(null); }}>{pendingDecision.status === 'CANCELLED' ? 'Từ chối đơn hàng' : 'Xác nhận đơn hàng'}</button></div>
        </section>
      </div>}
    </section>
  );
}
