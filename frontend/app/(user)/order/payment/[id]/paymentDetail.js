"use client"
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getApiBase } from "@/lib/apiBase";

export default function PaymentDetail({ id }) {
  const [order, setorder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`${getApiBase()}/order/payment/${id}`, {
      method: "GET",
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.code !== "success" || !data.order) {
          throw new Error(data.message || "Không tải được thông tin đơn hàng.");
        }
        return data.order;
      })
      .then(setorder)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message || "Không kết nối được máy chủ.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (paymentStatus === "success" && order?.paymentMethodStatus) toast.success("Thanh toán thành công");
    if (paymentStatus === "success" && order && !order.paymentMethodStatus) toast.error("Chưa xác nhận được thanh toán.");
    if (paymentStatus === "failed") toast.error("Thanh toán chưa thành công. Bạn có thể thử lại.");
  }, [paymentStatus, order]);
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
  const pay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`${getApiBase()}/order/pay/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.code !== "success" || !data.paymentUrl) {
        throw new Error(data.message || "Không tạo được phiên thanh toán.");
      }
      const paymentUrl = new URL(data.paymentUrl);
      if (paymentUrl.protocol !== "https:" || !/(^|\.)vnpayment\.vn$/.test(paymentUrl.hostname)) {
        throw new Error("Địa chỉ thanh toán không hợp lệ.");
      }
      window.location.assign(paymentUrl.href);
    } catch (err) {
      toast.error(err.message || "Không thể kết nối cổng thanh toán.");
      setPaying(false);
    }
  };

  if (loading) return <div className="order-detail-page">Đang tải xác nhận đơn hàng...</div>;
  if (error || !order) return (
    <div className="order-detail-page">
      <p role="alert">{error || "Không tìm thấy đơn hàng."}</p>
      <Link href="/cart">Quay lại giỏ hàng</Link>
    </div>
  );

  return (<>
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
                      <img src={product.pictures?.[0]?.url || "/placeholder.svg"} alt={product.productName}></img>
                      <div className="inner-infor">
                        <div className="label">{product.productName}</div>
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
            <div>{order.note || "Không có"}</div>
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
            <button type="button" onClick={pay} disabled={paying}>{paying ? "ĐANG CHUYỂN HƯỚNG..." : "THANH TOÁN"}</button>
          </div>
        }
      </div>
    </div >

  </>)
}
