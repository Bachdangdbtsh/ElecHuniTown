"use client";
import { useEffect, useRef, useState } from "react";
import JustValidate from "just-validate";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerInfor({ recipientInfos = [], isLogin }) {
  const validatorRef = useRef(null);
  const router = useRouter();

  // 1. Lưu trạng thái địa chỉ đang được chọn (Mặc định chọn cái isDefault hoặc cái đầu tiên)
  const [selectedAddress, setSelectedAddress] = useState(() => {
    if (!recipientInfos || recipientInfos.length === 0) return null;
    const defaultAddr = recipientInfos.find((addr) => addr.isDefault);
    return defaultAddr || recipientInfos[0];
  });

  const order = () => {
    const formEl = document.querySelector("#customer-infor-form");
    if (!formEl) return;
    if (validatorRef.current) return;

    const validator = new JustValidate("#customer-infor-form", {
      errorLabelCssClass: "my-error-message",
    });

    validator
      .addField("#name", [{ rule: "required", errorMessage: "Vui lòng nhập họ và tên" }])
      .addField("#phone", [{ rule: "required", errorMessage: "Vui lòng nhập số điện thoại" }])
      .addField("#address", [{ rule: "required", errorMessage: "Vui lòng nhập địa chỉ giao hàng" }])
      .onSuccess((event) => {
        const form = event.target;
        const name = form.name.value;
        const phone = form.phone.value;
        const address = form.address.value;
        const note = form.note.value;
        const addressType = form.addressType.value;

        // Lấy phương thức thanh toán
        let paymentMethod = "money";
        form.querySelectorAll(".paymentMethod").forEach((item) => {
          if (item.checked) paymentMethod = item.value;
        });

        // Lấy giỏ hàng từ LocalStorage
        const cartString = localStorage.getItem("cart");
        const cart = cartString ? JSON.parse(cartString) : [];
        const cartChecked = cart.filter((p) => p.selected === true);

        if (cartChecked.length === 0) {
          toast.error("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
          return;
        }

        // Gọi API tạo đơn hàng
        fetch(`${process.env.NEXT_PUBLIC_URL}/order/create`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name, phone, address, note, paymentMethod,
            cart: cartChecked,
            addressType,
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.code === "success") {
            toast.success(data.message);
            const remainCart = cart.filter((p) => p.selected !== true);
            localStorage.setItem("cart", JSON.stringify(remainCart));
            router.push(`/order/payment/${data.newOrder.id}`);
          } else {
            toast.error(data.message || "Có lỗi xảy ra khi đặt hàng");
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error("Lỗi kết nối đến server");
        });
      });

    validatorRef.current = validator;
    
    return () => {
      const errorLabels = formEl.querySelectorAll(".my-error-message");
      errorLabels.forEach((label) => label.remove());
    };
  };

  useEffect(order, []);

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
    <div className="checkout-container">
      {/* HIỂN THỊ ĐỊA CHỈ NẾU ĐÃ ĐĂNG NHẬP VÀ CÓ ĐỊA CHỈ */}
      {isLogin && recipientInfos.length > 0 && (
        <div className="address-list-section" style={{ marginBottom: "20px", paddingLeft:"20px" }}>
          <h3>Chọn địa chỉ giao hàng</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop:"20px" }}>
            {recipientInfos.map((addr) => (
              <div 
                key={addr.id} 
                onClick={() => setSelectedAddress(addr)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: selectedAddress?.id === addr.id ? "#f9f9f9" : "white"
                }}
              >
                <div style={{ fontWeight: "bold" }}>
                  {addr.recipientName} | {addr.recipientPhoneNumber}
                  {addr.isDefault && <span style={{ color: "red", marginLeft: "10px" }}>[Mặc định]</span>}
                </div>
                <div style={{ fontSize: "14px", color: "#666", marginTop:"10px"  }}>{addr.address}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORM ĐIỀN THÔNG TIN */}
      <form className="inner-form" id="customer-infor-form">
        <div className="inrow">
          <div className="field">
            <input className="input-text" type="text" id="name" name="name" placeholder="Họ và tên" />
          </div>
          <div className="field">
            <input className="input-text" type="text" id="phone" name="phone" placeholder="Số điện thoại" />
          </div>
        </div>

        {/* address */}
        <div className="inrow">
          <div className="field">
            <input className="input-text" type="text" id="address" name="address" placeholder="Địa chỉ" />
          </div>
          <div className="field">
            <select className="input-text" id="addressType" name="addressType">
              <option value="">Chọn loại địa chỉ</option>
              <option value="home">Nhà riêng</option>
              <option value="company">Công ty</option>
            </select>
          </div>
        </div>

        {/* note */}
        <div className="field">
          <textarea className="input-text" id="note" name="note" placeholder="Ghi chú"></textarea>
        </div>

        {/* PHƯƠNG THỨC THANH TOÁN */}
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
            <div className="method-detail">
              <input
                type="radio"
                id="momo"
                className="paymentMethod"
                name="paymentMethod"
                value="momo"
              />
              <label htmlFor="momo">Ví MoMo</label>
            </div>
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

        <div className="order">
          <button type="submit" form="customer-infor-form">ĐẶT HÀNG</button>
        </div>
      </form>
    </div>
  );
}