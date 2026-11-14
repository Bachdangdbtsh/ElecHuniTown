'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { postShop, saveCart } from '../component/cartStore';

export default function CustomerInfor({ cart, setCart, loading }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', addressType: '' });
  const selected = cart.filter((item) => item.selected !== false);
  const amount = selected.reduce((sum, item) => sum + item.newPrice * item.quantity, 0);
  const shippingFee = amount > 1000000 ? 0 : 30000;

  useEffect(() => {
    const controller = new AbortController();
    async function loadAddresses() {
      try {
        const response = await fetch('/api/backend/recipients', {
          credentials: 'include', signal: controller.signal,
        });
        if (!response.ok) return;
        const result = await response.json();
        const list = Array.isArray(result.data) ? result.data : [];
        setAddresses(list);
        const preferred = list.find((item) => item.isDefault) || list[0];
        if (preferred) {
          setSelectedAddressId(preferred.id);
          setCustomer((current) => ({
            name: current.name || preferred.recipientName || '',
            phone: current.phone || preferred.recipientPhoneNumber || '',
            address: current.address || preferred.address || '',
            addressType: current.addressType || (preferred.recipientType === 'Công ty' ? 'company' : 'home'),
          }));
        }
      } catch (error) {
        if (error.name !== 'AbortError') console.error('Không thể tải địa chỉ giao hàng', error);
      }
    }
    loadAddresses();
    return () => controller.abort();
  }, []);

  function selectAddress(item) {
    setSelectedAddressId(item.id);
    setCustomer({
      name: item.recipientName || '',
      phone: item.recipientPhoneNumber || '',
      address: item.address || '',
      addressType: item.recipientType === 'Công ty' ? 'company' : 'home',
    });
  }

  function changeField(event) {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
    setSelectedAddressId(null);
  }

  function prepareOrder(event) {
    event.preventDefault();
    if (!selected.length) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setConfirmation({
      name: fields.name.trim(), phone: fields.phone.trim(), address: fields.address.trim(),
      addressType: fields.addressType, note: fields.note.trim(),
      paymentMethod: fields.paymentMethod, cart: selected,
    });
  }

  async function confirmOrder() {
    if (!confirmation || submitting) return;
    setSubmitting(true);
    try {
      const data = await postShop('/order/create', confirmation);
      const remaining = cart.filter((item) => !confirmation.cart.some((ordered) => ordered.id === item.id));
      setCart(saveCart(remaining));
      toast.success(data.message);
      router.push(`/order/payment/${data.newOrder.id}`);
    } catch (error) {
      if (error.message.includes('đăng nhập') || error.message.includes('Phiên đăng nhập') || error.message.includes('Tài khoản không thể đặt hàng')) {
        toast.error('Vui lòng đăng nhập bằng tài khoản khách hàng để hoàn tất đặt hàng');
        router.push('/login?returnTo=%2Fcart');
      } else {
        toast.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {addresses.length > 0 && (
        <div className="address-list-section" style={{ marginBottom: 20, paddingLeft: 20 }}>
          <h3>Chọn địa chỉ giao hàng</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {addresses.map((item) => (
              <button key={item.id} type="button" onClick={() => selectAddress(item)}
                aria-pressed={selectedAddressId === item.id}
                style={{ padding: 10, borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: '1px solid #ddd', backgroundColor: selectedAddressId === item.id ? '#f9f9f9' : 'white' }}>
                <strong>{item.recipientName} | {item.recipientPhoneNumber}</strong>
                {item.isDefault && <span style={{ color: 'red', marginLeft: 10 }}>[Mặc định]</span>}
                <div style={{ fontSize: 14, color: '#666', marginTop: 10 }}>{item.address}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      <form className="inner-form" id="customer-infor-form" onSubmit={prepareOrder}>
        <div className="inrow">
          <div className="field"><input className="input-text" type="text" name="name" placeholder="Họ và tên" required value={customer.name} onChange={changeField} /></div>
          <div className="field"><input className="input-text" type="tel" name="phone" placeholder="Số điện thoại" required pattern="[0-9]{9,15}" value={customer.phone} onChange={changeField} /></div>
        </div>
        <div className="inrow">
          <div className="field"><input className="input-text" type="text" name="address" placeholder="Địa chỉ giao hàng" required value={customer.address} onChange={changeField} /></div>
          <div className="field"><select className="input-text" name="addressType" required value={customer.addressType} onChange={changeField}><option value="" disabled>Chọn loại địa chỉ</option><option value="home">Nhà riêng</option><option value="company">Công ty</option></select></div>
        </div>
        <div className="field"><textarea className="input-text" name="note" placeholder="Ghi chú" /></div>
        <div className="inner-method">
          <div className="inner-title">Chọn phương thức thanh toán</div>
          <div className="inner-list">
            <div className="method-detail">
              <input
                type="radio"
                id="money"
                className="paymentMethod"
                name="paymentMethod"
                defaultChecked
                value="money"
              />
              <label htmlFor="money">Thanh toán tiền mặt khi nhận hàng</label>
            </div>
            {/* <div className="method-detail">
              <input
                type="radio"
                id="momo"
                className="paymentMethod"
                name="paymentMethod"
                value="momo"
              />
              <label htmlFor="momo">Ví MoMo</label>
            </div> */}
            <div className="method-detail">
              <input
                type="radio"
                id="bank"
                className="paymentMethod"
                name="paymentMethod"
                value="bank"
              />
              <label htmlFor="bank">Chuyển khoản ngân hàng</label>
            </div>
          </div>
        </div>
        <div className="order"><button type="submit" disabled={loading || !selected.length}>XEM LẠI ĐƠN HÀNG</button></div>
      </form>
      {confirmation && (
        <div className="checkout-confirm-backdrop" role="presentation">
          <section className="checkout-confirm" role="dialog" aria-modal="true" aria-labelledby="checkout-confirm-title">
            <h2 id="checkout-confirm-title">Xác nhận đặt hàng</h2>
            <p>Người nhận: {confirmation.name} · {confirmation.phone}</p>
            <p>Giao đến: {confirmation.address}</p>
            <ul>{confirmation.cart.map((item) => <li key={item.id}>{item.productName} × {item.quantity}</li>)}</ul>
            <p>Phương thức: {confirmation.paymentMethod === 'bank' ? 'VNPay' : 'Thanh toán khi nhận hàng'}</p>
            <strong>Tổng thanh toán: {(amount + shippingFee).toLocaleString('vi-VN')} đ</strong>
            <div className="checkout-confirm-actions">
              <button type="button" onClick={() => setConfirmation(null)} disabled={submitting}>Quay lại chỉnh sửa</button>
              <button type="button" onClick={confirmOrder} disabled={submitting}>{submitting ? 'Đang đặt hàng...' : 'Xác nhận đặt hàng'}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
