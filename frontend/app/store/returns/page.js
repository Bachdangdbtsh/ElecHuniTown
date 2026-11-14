'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import './returns.css';

const labels = { PENDING: 'Chờ xét duyệt', APPROVED: 'Đồng ý', DENIED: 'Từ chối', REFUNDED: 'Đã hoàn tiền' };
const money = (value) => Number(value || 0).toLocaleString('vi-VN') + ' ₫';

export default function StoreReturnsPage() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);
  const [conditions, setConditions] = useState({});
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refundConfirm, setRefundConfirm] = useState(false);
  const [transactionDate, setTransactionDate] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await apiGet('/returns'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  const selected = rows.find((row) => row.id === selectedId);
  const visible = rows.filter((row) => filter === 'ALL' || row.status === filter);
  const count = (status) => rows.filter((row) => row.status === status).length;

  function open(row) {
    setSelectedId(row.id);
    setConditions(Object.fromEntries(row.items.map((item) => [item.productId, item.condition || 'RESALEABLE'])));
    setRejectReason('');
    setRefundConfirm(false);
    setTransactionDate('');
    setError('');
  }

  async function decide(decision) {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await apiPatch(`/returns/${selected.id}/decision`, { decision, rejectReason, conditions });
      setSelectedId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function refund() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await apiPost(`/returns/${selected.id}/refund`, { transactionDate });
      setRefundConfirm(false);
      setSelectedId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="store-returns">
    <header className="store-returns-head"><div><h1>Đổi trả - Hoàn tiền</h1><p>Tiếp nhận, xét duyệt và theo dõi các yêu cầu đổi trả của khách hàng.</p></div><button type="button" className="eht-btn" onClick={load}>⟳ &nbsp; Làm mới dữ liệu</button></header>
    <div className="store-returns-summary">
      <div className="highlight"><small>Đang chờ xét duyệt</small><strong>{String(count('PENDING')).padStart(2, '0')}</strong><span>Cần xử lý</span></div>
      <div><small>Đã đồng ý</small><strong>{String(count('APPROVED') + count('REFUNDED')).padStart(2, '0')}</strong><span>Trong hệ thống</span></div>
      <div><small>Đã từ chối</small><strong>{String(count('DENIED')).padStart(2, '0')}</strong><span>Trong hệ thống</span></div>
    </div>
    {error && <p className="store-returns-error" role="alert">{error}</p>}
    <div className="store-returns-table-card">
      <div className="store-returns-card-head"><h2>Yêu cầu đổi trả gần đây</h2><select aria-label="Lọc tình trạng" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">Tất cả tình trạng</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
      <div className="store-returns-scroll"><table><thead><tr><th>ID YÊU CẦU</th><th>TÊN KHÁCH HÀNG</th><th>NGÀY GỬI YÊU CẦU</th><th>TÌNH TRẠNG</th><th>THAO TÁC</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td><b>DT-{row.id}</b><small>{row.order.paymentMethod === 'bank' ? 'Hoàn tiền qua VNPay' : 'Thanh toán khi nhận hàng'}</small></td><td>{row.order.customer.fullName}<small>{row.order.customer.email}</small></td><td>{new Date(row.createdAt).toLocaleString('vi-VN')}</td><td><span className={`store-return-status ${row.status.toLowerCase()}`}>● {labels[row.status]}</span></td><td><button type="button" onClick={() => open(row)}>Xét duyệt ↗</button></td></tr>)}{!loading && !visible.length && <tr><td colSpan={5}>Chưa có yêu cầu phù hợp</td></tr>}</tbody></table></div>
      <footer>Hiển thị {visible.length} trên {rows.length} yêu cầu</footer>
    </div>
    {selected && <div className="store-return-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setSelectedId(null); }}><div className="store-return-dialog" role="dialog" aria-modal="true" aria-labelledby="store-return-title">
      <div className="store-return-dialog-head"><div><h2 id="store-return-title">Yêu cầu DT-{selected.id}</h2><p>Đơn hàng #{selected.orderId} · {labels[selected.status]}</p></div><button type="button" onClick={() => setSelectedId(null)} disabled={busy}>✕</button></div>
      <p><b>Khách hàng:</b> {selected.order.customer.fullName} · {selected.order.customer.email}</p>
      <p><b>Ngày gửi:</b> {new Date(selected.createdAt).toLocaleString('vi-VN')}</p>
      <p><b>Lý do:</b> {selected.reason}</p>
      <p><b>Giá trị đơn:</b> {money(selected.order.totalCost)} · {selected.order.paymentMethod === 'bank' ? 'VNPay' : 'Thanh toán khi nhận hàng'}</p>
      {selected.images.length > 0 && <div className="store-return-images">{selected.images.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><Image src={item.url} alt="Ảnh minh họa đổi trả" width={90} height={90} unoptimized /></a>)}</div>}
      <h3>Sản phẩm hoàn trả</h3>
      {selected.items.map((item) => <div className="store-return-item" key={item.id}><span>{item.product.productName} × {item.quantity}</span><select disabled={selected.status !== 'PENDING'} value={conditions[item.productId] || 'RESALEABLE'} onChange={(event) => setConditions((current) => ({ ...current, [item.productId]: event.target.value }))}><option value="RESALEABLE">Còn bán được · nhập lại tồn</option><option value="NON_RESALEABLE">Không bán được · không nhập tồn</option></select></div>)}
      {selected.status === 'PENDING' && <><label htmlFor="reject-reason">Lý do từ chối (khi từ chối)</label><textarea id="reject-reason" rows={3} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} /><div className="store-return-actions"><button type="button" onClick={() => decide('DENIED')} disabled={busy}>Từ chối</button><button type="button" className="primary" onClick={() => decide('APPROVED')} disabled={busy}>Đồng ý đổi trả</button></div></>}
      {selected.status === 'APPROVED' && selected.order.paymentMethod === 'bank' && <div className="store-return-actions"><button type="button" className="primary" onClick={() => setRefundConfirm(true)} disabled={busy || !!selected.refundCode}>{selected.refundCode ? 'Đã gửi yêu cầu VNPay' : 'Gửi yêu cầu hoàn tiền VNPay'}</button></div>}
      {selected.status === 'APPROVED' && selected.order.paymentMethod !== 'bank' && <p>Đơn thanh toán khi nhận hàng không có giao dịch VNPay gốc. Cần xử lý hoàn tiền ngoài hệ thống.</p>}
      {selected.refundMessage && <p className="store-return-note">{selected.refundMessage}</p>}
      {error && <p className="store-returns-error" role="alert">{error}</p>}
    </div></div>}
    {refundConfirm && selected && <div className="store-return-backdrop"><div className="store-return-dialog store-refund-confirm" role="dialog" aria-modal="true" aria-labelledby="refund-title">
      <h2 id="refund-title">Xác nhận hoàn tiền VNPay</h2>
      <p>Vui lòng kiểm tra thông tin trước khi gửi yêu cầu hoàn tiền.</p>
      <div className="store-refund-line"><span>ID yêu cầu</span><b>DT-{selected.id}</b></div>
      <div className="store-refund-line"><span>Khách hàng</span><b>{selected.order.customer.fullName}</b></div>
      <div className="store-refund-line"><span>Giao dịch VNPay gốc</span><b>{selected.order.transactionID || 'Chưa có'}</b></div>
      {!selected.order.paymentCreatedAt && <><label htmlFor="vnp-original-date">Ngày tạo giao dịch gốc trên VNPay (yyyyMMddHHmmss)</label><input id="vnp-original-date" inputMode="numeric" pattern="[0-9]{14}" maxLength={14} value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} placeholder="20260929120000" /></>}
      <div className="store-refund-line"><span>Phương thức</span><b>VNPay</b></div>
      <div className="store-refund-amount"><span>Số tiền hoàn lại</span><strong>{money(selected.order.totalCost)}</strong></div>
      <p className="store-return-note">Yêu cầu sẽ được truy vấn và gửi tới VNPay theo giao dịch gốc. Kết quả có thể cần đối soát nếu VNPay đang xử lý.</p>
      <div className="store-return-actions"><button type="button" onClick={() => setRefundConfirm(false)} disabled={busy}>Quay lại</button><button type="button" className="primary" onClick={refund} disabled={busy || (!selected.order.paymentCreatedAt && !/^\d{14}$/.test(transactionDate))}>{busy ? 'Đang gửi…' : 'Xác nhận hoàn tiền qua VNPay'}</button></div>
      {error && <p className="store-returns-error" role="alert">{error}</p>}
    </div></div>}
  </section>;
}
