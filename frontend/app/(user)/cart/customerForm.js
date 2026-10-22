"use client";
import { useEffect } from "react";
import JustValidate from "just-validate";

export default function CustomerInfor() {
  useEffect(() => {
    const formEl = document.querySelector("#customer-infor-form");
    if (!formEl) return;

    const validator = new JustValidate("#customer-infor-form", {
      errorLabelCssClass: "my-error-message", // class tuỳ chỉnh cho label lỗi
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
        const fd = new FormData(form);

        const name    = fd.get("name");
        const phone   = fd.get("phone");
        const address = fd.get("address");
        const note    = fd.get("note");

        let paymentMethod = "money";
        form.querySelectorAll(".paymentMethod").forEach((item) => {
          if (item.checked) paymentMethod = item.value;
        });

        console.log({ name, phone, address, note, paymentMethod });
      });
  }, []);

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
      <div className="field">
        <input
          className="input-text"
          type="text"
          id="address"
          name="address"
          placeholder="Địa chỉ"
        />
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
              value="momo"
            />
            <label htmlFor="momo">Ví MoMo</label>
          </div>
          <div className="method-detail">
            <input
              type="radio"
              id="bank"
              className="paymentMethod"
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