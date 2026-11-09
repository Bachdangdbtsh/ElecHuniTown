"use client"
import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function ProductCart({ item, }) {
  const [quantity, setquantity] = useState(item.quantity);
  useEffect(() => {
    setquantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = async (e) => {
    let newQuantity = parseInt(e.target.value, 10);
    if (isNaN(newQuantity)) newQuantity = 1;

    // Giới hạn min 1, max là tồn kho
    const MAX_STOCK = item.stock || 99;
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > MAX_STOCK) newQuantity = MAX_STOCK;

    setquantity(newQuantity);

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const index = cart.findIndex((i) => i.id == item.id);
    if (index != -1) {
      cart[index].quantity = newQuantity;
      localStorage.setItem("cart", JSON.stringify(cart));
    }

    try {
      await fetch(`${(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_URL)}/cart/update`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          quantity: newQuantity
        })
      });
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
    }

    window.dispatchEvent(
      new CustomEvent("cart:updated", {
        detail: { id: item.id, quantity: newQuantity }
      })
    );
  };
  return (
    <>
      <div className="infor-product">
        <img src={item.image} alt=""></img>
        <div className="inner-infor">
          <div className="label">{item.productName}</div>
          <div className="product-id">Mã sản phẩm: <strong>{item.id}</strong></div>
          <div className="new-price product-id">Giá sản phẩm <strong className="color-red">{item.newPrice.toLocaleString("vi-VN")}</strong></div>
          <div className="old-price product-id">Giá niêm yết: <strong>{item.oldPrice?.toLocaleString("vi-VN")}</strong></div>
        </div>
      </div>
      <div className="inner-quantity">
        <div className="label">Số Lượng </div>
        <input type="number" value={quantity} min="0" max={item.stock}
          onChange={handleQuantityChange}
        ></input>
        <div className="price">
          <span>{quantity} x </span>
          <span className="hl">{item.newPrice.toLocaleString("vi-VN")}</span>
        </div>
      </div>
    </>
  )
}