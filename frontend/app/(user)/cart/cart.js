"use client"
import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import ProductCart from "./productCart";
import { toast } from "sonner";

export default function Cart() {
  const [cart, setcart] = useState([]); // Khởi tạo mảng rỗng thay vì null

  const renderCart = () => {
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
    fetch(`${process.env.NEXT_PUBLIC_URL}/cart/get`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentCart }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setcart(data.currentCart || []);
          localStorage.setItem("cart",JSON.stringify(data.currentCart||[]))
        }
      });
  };

  useEffect(() => {
    renderCart();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail;
      if (detail?.id !== undefined && detail?.quantity !== undefined) {
        setcart((prev) =>
          prev.map((item) =>
            item.id == detail.id
              ? { ...item, quantity: detail.quantity }
              : item
          )
        );
      }
    };
    window.addEventListener("cart:updated", handler);
    return () => window.removeEventListener("cart:updated", handler);
  }, []);

  // HÀM XỬ LÝ TICK / BỎ TICK
const toggleSelect = (id) => {
  const currentItem = cart.find(item => item.id === id);
  if (!currentItem) return;

  const newSelectedState = !currentItem.selected;

  // 2. Cập nhật State giao diện
  setcart((prevCart) =>
    prevCart.map((item) =>
      item.id === id ? { ...item, selected: newSelectedState } : item
    )
  );

  // 3. Cập nhật vào LocalStorage 
  const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
  const index = localCart.findIndex((i) => i.id == id);

  if (index !== -1) {
    localCart[index].selected = newSelectedState;
    localCart[index].quantity = currentItem.quantity;
  } else {
    localCart.push({ 
      id: id, 
      selected: newSelectedState,
      quantity: currentItem.quantity // Lưu kèm quantity
    });
  }
  localStorage.setItem("cart", JSON.stringify(localCart));
};

  // HÀM XÓA SẢN PHẨM
  const handleRemove = async (id) => {
    setcart((prev) => prev.filter((item) => item.id !== id));

    const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const newLocalCart = localCart.filter((item) => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(newLocalCart));

    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL}/cart/remove`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id })
      });
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
    }
  };

  const subtotal = cart
    .filter((i) => i.selected === true)
    .reduce((s, i) => s + i.oldPrice * i.quantity, 0);

  const total = cart
    .filter((i) => i.selected === true)
    .reduce((s, i) => s + i.newPrice * i.quantity, 0);

  const shippingFee = total == 0 ? 0 : (total > 1000000 ? 0 : 30000);

  return (
    <div className="cart">
      <div className="inner-label">
        <div className="title">Giỏ Hàng</div>
        <Link href="/" className="return">
          <span>Quay lại mua hàng</span>
          <FaChevronRight />
        </Link>
      </div>
      <div className="list-product">
        {cart.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center" }}>Giỏ hàng trống</div>
        ) : (
          cart.map((item) => (
            <div className="inner-product" key={item.id}>
              <div className="inner-sign">
                <IoMdClose
                  color="#828282"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRemove(item.id)}
                />
                <input
                  className="checked"
                  type="checkbox"
                  checked={item.selected === true}
                  onChange={() => toggleSelect(item.id)}
                />
              </div>
              <ProductCart item={item} function={toggleSelect} />
            </div>
          ))
        )}
      </div>

      <div className="total">
        <div className="inner-total">
          <div className="total-label">Tổng tiền:</div>
          <div className="price">{subtotal.toLocaleString("vi-VN")} đ</div>
        </div>
        <div className="inner-total">
          <div className="total-label">Giảm:</div>
          <div className="price">-{(subtotal - total).toLocaleString("vi-VN")} đ</div>
        </div>
        {cart.length > 0 && (
          <div className="inner-total">
            <div className="total-label">Tiền ship:</div>
            <div className="price">{shippingFee.toLocaleString("vi-VN")} đ</div>
          </div>
        )}
        <div className="inner-total">
          <div className="total-label">Thanh toán:</div>
          <div className="hl">{(total + shippingFee).toLocaleString("vi-VN")} đ</div>
        </div>
      </div>
    </div>
  );
}