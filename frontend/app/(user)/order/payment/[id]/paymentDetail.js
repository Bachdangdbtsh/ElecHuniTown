"use client"
import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentDetail({ id }) {
  const router=useRouter();
  const [order, setorder] = useState(null);
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  useEffect(() => {
    if(status=="success"){
      toast.success("Thanh toán thành công")
    }

    fetch(`${process.env.NEXT_PUBLIC_URL}/order/payment/${id}`, {
      method: "GET",
    })
      .then(res => res.json())
      .then((data) => {
        setorder(data.order)
      })
  }, [])
  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return { text: 'Chờ xác nhận', color: '#f59e0b' }; // Màu cam
      case 'CONFIRMED':
        return { text: 'Đã xác nhận', color: '#3b82f6' }; // Màu xanh dương
      case 'SHIPPING':
        return { text: 'Đang giao hàng', color: '#8b5cf6' }; // Màu tím
      case 'DELIVERED':
        return { text: 'Đã giao hàng thành công', color: '#10b981' }; // Màu xanh lá
      case 'CANCELLED':
        return { text: 'Đã hủy', color: '#ef4444' }; // Màu đỏ
      default:
        return { text: 'Không xác định', color: '#6b7280' }; // Màu xám
    }
  };
  const pay=function(){
    fetch(`${process.env.NEXT_PUBLIC_URL}/order/pay/${id}`,{
      method:"POST",
    })
    .then(res=>res.json())
    .then(data=>{
      if(data.code="success"){
        router.push(data.paymentUrl);
      }
    })
  }
  return (order && <>
    <div className="order-detail-page">
      <div className="cart-page">
        <div className="cart">
          <div className="inner-label">
            <div className="title">ĐƠN HÀNG {order.id}</div>
            <Link href="/" className="return">
              <span>Quay lại mua hàng</span>
              <FaChevronRight />
            </Link>
          </div>
          <div className="list-product">
            {
              order.items.map((item,index) => {
                const product = item.product
                return (
                  <div className="inner-product" key={index}>
                    <div className="infor-product">
                      <img src={product.pictures[0].url} alt=""></img>
                      <div className="inner-infor">
                        <div className="label">{product.name}</div>
                        <div className="product-id">Mã sản phẩm: <strong>{product.id}</strong></div>
                        <div className="new-price product-id">Giá sản phẩm <strong className="color-red">{product.newPrice?.toLocaleString("vi-VN")}</strong></div>
                        <div className="old-price product-id">Giá niêm yết: <strong>{product.oldPrice?.toLocaleString("vi-VN")}</strong></div>
                      </div>
                    </div>
                    <div className="inner-quantity">
                      <div className="label">Số Lượng </div>
                      <input type="number" defaultValue={item.quantity} readOnly></input>
                      <div className="price">
                        <span>1 x </span>
                        <span className="hl">{product.newPrice?.toLocaleString("vi-VN")}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </div>

          <div className="total">
            <div className="inner-total">
              <div className="total-label">Tổng tiền:</div>
              <div className="price">{order.subtotal.toLocaleString("vi-VN")} đ</div>
            </div>
            <div className="inner-total">
              <div className="total-label">Giảm:</div>
              <div className="price">-{order.discount.toLocaleString("vi-VN")} đ</div>
            </div>
            <div className="inner-total">
              <div className="total-label">Thanh toán:</div>
              <div className="hl">{order.totalCost.toLocaleString("vi-VN")} đ</div>
            </div>
          </div>
        </div>


      </div>
      <div className="order-infor">
        <div className="inner-title">Thông tin đơn hàng</div>
        <div className="infor-detail">
          <div>{order.recipient.recipientName}</div>
          <div>{order.recipient.recipientPhoneNumber}</div>
          <div>{order.recipient.address}</div>
          <div className="inrow">
            <div className="hl">Ghi chú</div>
            <div>{order.recipient.note}</div>
          </div>
          <div className="inrow">
            <div className="hl">Tình trạng đơn hàng</div>
            <div style={{ color: getStatusInfo(order.status).color, fontWeight: "bold" }}>
              {getStatusInfo(order.status).text}
            </div>
          </div>

        </div>
        {
          (order.paymentMethodStatus==false&&order.paymentMethod!="money")&&
          <div className="payment">
            <button onClick={()=>{pay()}}>THANH TOÁN</button>
          </div>
        }
      </div>
    </div >

  </>)
}