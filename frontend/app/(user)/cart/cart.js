"use client"
import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import ProductCart from "./productCart";
import { toast } from "sonner";
function toggleSelect(id) {
  const current = cart.find((i) => i.id == id);
  const newVal = !(current?.selected !== false);

  setcart((prev) =>
    prev.map((item) =>
      item.id == id ? { ...item, selected: newVal } : item
    )
  );

  const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
  const index = localCart.findIndex((i) => i.id == id);
  if (index != -1) {
    localCart[index].selected = newVal;
    localStorage.setItem("cart", JSON.stringify(localCart));
  }
}

export default function Cart() {
  const [cart, setcart] = useState(null);
  useEffect(() => {
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
    fetch(`${process.env.NEXT_PUBLIC_URL}/cart/get`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentCart }),
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        const merged = (data.currentCart || []).map((item) => {
          const local = currentCart.find((l) => l.id == item.id);
          return { ...item, selected: local?.selected !== false };
        });
        setcart(merged);
      })
  }, [])
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
  const total = (cart || [])
    .filter((i) => i.selected !== false)
    .reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="cart">
      <div className="inner-label">
        <div className="title">Giỏ Hàng</div>
        <Link href="#" className="return">
          <span>Quay lại mua hàng</span>
          <FaChevronRight />
        </Link>
      </div>
      <div className="list-product">
        {
          cart?.map((item, index) => {
            return (
              <div className="inner-product" >
                <div className="inner-sign">
                  <IoMdClose color="#828282" />
                  <input type="checkbox" checked={item.selected !== false} onChange={() => { toggleSelect(item.id) }}></input>
                </div>
                <ProductCart item={item} function={toggleSelect} key={index}></ProductCart>
              </div>
            )
          })
        }

      </div>

      <div className="total">
        <div className="inner-total">
          <div className="total-label">Tổng tiền:</div>
          <div className="price">{total.toLocaleString("vi-VN")} đ</div>
        </div>
        <div className="inner-total">
          <div className="total-label">Giảm:</div>
          <div className="price">-0 đ</div>
        </div>
        <div className="inner-total">
          <div className="total-label">Thanh toán:</div>
          <div className="hl">{total.toLocaleString("vi-VN")} đ</div>
        </div>
      </div>
    </div >
  )
}