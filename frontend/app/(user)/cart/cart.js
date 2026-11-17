'use client';

import Link from 'next/link';
import { IoMdClose } from 'react-icons/io';
import { FaChevronRight } from 'react-icons/fa';
import { toast } from 'sonner';
import ProductCart from './productCart';
import { removeCart, updateCartQuantity } from '../component/editCart';
import { saveCart } from '../component/cartStore';

export default function Cart({ cart, setCart, loading }) {
  async function remove(id) {
    try { setCart(await removeCart(id)); }
    catch (error) { toast.error(error.message); }
  }

  async function updateQuantity(item, value) {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.stock) {
      toast.error(`Số lượng phải từ 1 đến ${item.stock}`);
      return;
    }
    try { setCart(await updateCartQuantity(item.id, quantity)); }
    catch (error) { toast.error(error.message); }
  }

  function toggleSelect(id) {
    setCart((current) => saveCart(current.map((item) => Number(item.id) === Number(id)
      ? { ...item, selected: item.selected === false }
      : item)));
  }

  const selected = cart.filter((item) => item.selected !== false);
  const subtotal = selected.reduce((sum, item) => sum + item.oldPrice * item.quantity, 0);
  const total = selected.reduce((sum, item) => sum + item.newPrice * item.quantity, 0);
  const shippingFee = selected.length ? (total > 1000000 ? 0 : 30000) : 0;

  return (
    <div className="cart">
      <div className="inner-label">
        <div className="title">Giỏ hàng</div>
        <Link href="/" className="return"><span>Quay lại mua hàng</span><FaChevronRight /></Link>
      </div>
      <div className="list-product">
        {loading ? <p>Đang tải giỏ hàng...</p> : cart.length === 0 ? <p>Giỏ hàng đang trống.</p> : cart.map((item) => (
          <div className="inner-product" key={item.id}>
            <div className="inner-sign">
              <button type="button" onClick={() => remove(item.id)} aria-label={`Xóa ${item.productName}`}><IoMdClose /></button>
              <input className="checked" type="checkbox" checked={item.selected !== false} onChange={() => toggleSelect(item.id)} aria-label={`Chọn ${item.productName}`} />
            </div>
            <ProductCart item={item} onQuantityChange={(value) => updateQuantity(item, value)} />
          </div>
        ))}
      </div>
      <div className="total">
        <div className="inner-total"><div className="total-label">Tổng tiền:</div><div className="price">{subtotal.toLocaleString('vi-VN')} đ</div></div>
        <div className="inner-total"><div className="total-label">Giảm:</div><div className="price">-{(subtotal - total).toLocaleString('vi-VN')} đ</div></div>
        {selected.length > 0 && <div className="inner-total"><div className="total-label">Tiền ship:</div><div className="price">{shippingFee.toLocaleString('vi-VN')} đ</div></div>}
        <div className="inner-total"><div className="total-label">Thanh toán:</div><div className="hl">{(total + shippingFee).toLocaleString('vi-VN')} đ</div></div>
      </div>
    </div>
  );
}
