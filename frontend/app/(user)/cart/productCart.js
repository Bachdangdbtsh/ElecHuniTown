"use client"
import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function ProductCart({ item, }) {
  const [quantity, setquantity] = useState(item.quantity);

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
        <input type="number" value={quantity}
          onChange={(event) => {
            setquantity(event.target.value);
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const index = cart.findIndex((i) => i.id == item.id);
            if (index != -1) {
              cart[index].quantity = event.target.value;
              localStorage.setItem("cart", JSON.stringify(cart));
              window.dispatchEvent(
                new CustomEvent("cart:updated", {
                  detail: { id: item.id, quantity: Number(cart[index].quantity) }
                })
              );

            }
          }}
        ></input>
        <div className="price">
          <span>{quantity} x </span>
          <span className="hl">{item.newPrice.toLocaleString("vi-VN")}</span>
        </div>
      </div>
    </>
  )
}