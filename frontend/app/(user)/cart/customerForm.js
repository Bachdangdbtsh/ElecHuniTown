'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { postShop, saveCart } from '../component/cartStore';

export default function CustomerInfor({ cart, setCart, loading }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const selected = cart.filter((item) => item.selected !== false);
  const amount = selected.reduce((sum, item) => sum + item.newPrice * item.quantity, 0);
  const shippingFee = amount > 1000000 ? 0 : 30000;

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

  // 2. Cập nhật form mỗi khi click chọn địa chỉ khác
  useEffect(() => {
    const formEl = document.querySelector("#customer-infor-form");
    if (!formEl || !selectedAddress) return;

    if (formEl.name) formEl.name.value = selectedAddress.recipientName || "";
    if (formEl.phone) formEl.phone.value = selectedAddress.recipientPhoneNumber || "";
    if (formEl.address) formEl.address.value = selectedAddress.address || "";
    
    if (formEl.addressType) {
      formEl.addressType.value = selectedAddress.recipientType === 'Nhà' ? 'home' : 'company';
    }
  }, [selectedAddress]);

  return (
    <>
      <form className="inner-form" id="customer-infor-form" onSubmit={prepareOrder}>
        <div className="inrow">
          <div className="field"><input className="input-text" type="text" name="name" placeholder="Họ và tên" required /></div>
          <div className="field"><input className="input-text" type="tel" name="phone" placeholder="Số điện thoại" required pattern="[0-9]{9,15}" /></div>
        </div>
        <div className="inrow">
          <div className="field"><input className="input-text" type="text" name="address" placeholder="Địa chỉ giao hàng" required /></div>
          <div className="field"><select className="input-text" name="addressType" required defaultValue=""><option value="" disabled>Chọn loại địa chỉ</option><option value="home">Nhà riêng</option><option value="company">Công ty</option></select></div>
        </div>
        <div className="field"><textarea className="input-text" name="note" placeholder="Ghi chú" /></div>
        <div className="inner-method">
          <div className="inner-title">Chọn phương thức thanh toán</div>
          <div className="inner-list">
            <div className="method-detail"><input type="radio" id="money" name="paymentMethod" value="money" defaultChecked /><label htmlFor="money">Thanh toán khi nhận hàng</label></div>
            <div className="method-detail"><input type="radio" id="bank" name="paymentMethod" value="bank" /><label htmlFor="bank">Thanh toán trực tuyến qua VNPay</label></div>
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
