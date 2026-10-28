"use client";
import { FaTicketSimple } from "react-icons/fa6";
import { BsBox2 } from "react-icons/bs";
import { FaStar } from "react-icons/fa6";
import { useEffect,useState } from "react";

import {addCart} from "@/app/(user)/component/editCart";

export default function RightPart({product}) {
  const discount = Math.round((product.oldPrice - product.newPrice) / product.oldPrice * 100);
  const [quantity,setquantity]=useState(1);

  return (
    <div className="right-part">
      <div className="product-name">{product.productName}</div>
      <div className="in-row">
        <div className="rate">
          <div className="point">{product.rate}</div>
          <FaStar color="#FFD600" />
        </div>
        <div className="number-review">{product.Comment.length} đánh giá</div>
        <div className="sold-number"><strong>Đã bán: {product.sold}</strong></div>
      </div>
      <div className="price">
        <div className="current-price">
          <div className="new-price">{product.newPrice.toLocaleString("vi-VN")}đ</div>
          <div className="discount">-{discount}%</div>
        </div>
        <div className="old-price">{product.oldPrice.toLocaleString("vi-VN")}đ</div>
      </div>
      <div className="product-infor">
        <div className="status infor-detail">
          <BsBox2 />
          <span>{product.stock > 0 ? "Còn hàng" : "Hết hàng"}</span>
        </div>
        <div className="infor-detail">
          <FaTicketSimple />
          <div>Mã sản phẩm:<strong className="product-id">{product.id}</strong></div>
        </div>
      </div>
      <div className="quantity">
        <div className="quantity-input">
          <div className="label">Số lượng</div>
          <input type="number" defaultValue={quantity} onChange={(event)=>{setquantity(event.target.value)}}></input>
        </div>
        <div className="quantity-detail">
          <div className="number">{quantity} x </div>
          <div className="price">{product.newPrice.toLocaleString("vi-VN")} </div>
        </div>
      </div>
      <div className="total">
        <div className="title">Tổng cộng</div>
        <div className="total-price">{(quantity*product.newPrice).toLocaleString("vi-VN")}đ</div>
      </div>
      {product.stock > 0 ? <button className="add-cart" onClick={()=>addCart(product,quantity)}>Thêm vào giỏ hàng</button> : <></>}
    </div>
  )
}