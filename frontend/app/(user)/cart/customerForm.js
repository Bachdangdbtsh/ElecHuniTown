"use client";
import { useEffect, useRef } from "react";
import JustValidate from "just-validate";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CustomerInfor() {
  const validatorRef = useRef(null);
  const router=useRouter();
  const order = () => {
    const formEl = document.querySelector("#customer-infor-form");
    if (!formEl) return;
    if (validatorRef.current) return;
    console.log("khởi tạo")

    const validator = new JustValidate("#customer-infor-form", {
      errorLabelCssClass: "my-error-message",
    });

    validator
      .addField("#name", [
        { rule: "required", errorMessage: "Vui lòng nhập họ và tên" },
      ])
      .addField("#phone", [
        { rule: "required", errorMessage: "Vui lòng nhập số điện thoại" },
      ])
      .addField("#address", [
        { rule: "required", errorMessage: "Vui lòng nhập địa chỉ giao hàng" },
      ])
      .onSuccess((event) => {
        const form = event.target;
        const name = form.name.value;
        const phone = form.phone.value;
        const address = form.address.value;
        const note = form.note.value;
        const addressType = form.addressType.value;

        let paymentMethod = "money";
        form.querySelectorAll(".paymentMethod").forEach((item) => {
          if (item.checked) paymentMethod = item.value;
        });

        const cart = JSON.parse(localStorage.getItem("cart") || []);
        const cartChecked = cart.filter((p) => p.selected == true);

        fetch('/api/backend/order/create', {
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
        .then(res=>res.json())
        .then(data=>{
          if(data.code=="success"){
            toast.success(data.message);
            const remainCart=cart.filter((p) => p.selected !==true);
            localStorage.setItem("cart",JSON.stringify(remainCart));
            router.push(`/order/payment/${data.newOrder.id}`)
          }
          if(data.code=="error"){
            toast(data.message);
          }
        })

      });
    validatorRef.current = validator;
    return () => {
      const errorLabels = formEl.querySelectorAll(".my-error-message");
      errorLabels.forEach((label) => label.remove());
    };
  }
  useEffect(order, []);

  return (
    <form className="inner-form" id="customer-infor-form">
      {/* Hàng 1: name + phone, mỗi input bọc trong .field */}
      <div className="inrow">
        <div className="field">
          <input
            className="input-text"
            type="text"
            id="name"
            name="name"
            placeholder="Họ và tên"
          />
        </div>
        <div className="field">
          <input
            className="input-text"
            type="text"
            id="phone"
            name="phone"
            placeholder="Số điện thoại"
          />
        </div>
      </div>

      {/* address */}
      <div className="inrow">
        <div className="field">
          <input
            className="input-text"
            type="text"
            id="address"
            name="address"
            placeholder="Địa chỉ"
          />
        </div>

        <div className="field">
          <select
            className="input-text"
            id="addressType"
            name="addressType"
          >
            <option value="">Chọn loại địa chỉ</option>
            <option value="home">Nhà riêng</option>
            <option value="company">Công ty</option>
          </select>

        </div>
      </div>

      {/* note */}
      <div className="field">
        <textarea
          className="input-text"
          id="note"
          name="note"
          placeholder="Ghi chú"
        ></textarea>
      </div>

      {/* phương thức thanh toán */}
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
            <label htmlFor="money">Thanh toán tiền mặt khi đi tour</label>
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
        <button type="submit" form="customer-infor-form">
          ĐẶT HÀNG
        </button>
      </div>
    </form>
  );
}
