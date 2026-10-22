import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import CustomerInfor from "./customerForm";
export default function Cart() {
  return (<>
    <div className="cart-page">
      <div className="cart">
        <div className="inner-label">
          <div className="title">Giỏ Hàng</div>
          <Link href="#" className="return">
            <span>Quay lại mua hàng</span>
            <FaChevronRight />
          </Link>
        </div>
        <div className="list-product">
          <div className="inner-product">
            <div className="inner-sign">
              <IoMdClose color="#828282" />
              <input type="checkbox"></input>
            </div>
            <div className="infor-product">
              <img src="/tulanh.jpg" alt=""></img>
              <div className="inner-infor">
                <div className="label">Máy cạo râu khô và ướt Coclear CS007</div>
                <div className="product-id">Mã sản phẩm: <strong>123456789</strong></div>
              </div>
            </div>
            <div className="inner-quantity">
              <div className="label">Số Lượng </div>
              <input type="number" defaultValue={1}></input>
              <div className="price">
                <span>1 x </span>
                <span className="hl">10.000.000</span>
              </div>
            </div>
          </div>
        </div>

        <div className="total">
          <div className="inner-total">
            <div className="total-label">Tổng tiền:</div>
            <div className="price">15.070.000 đ</div>
          </div>
          <div className="inner-total">
            <div className="total-label">Giảm:</div>
            <div className="price">-5.070.000 đ</div>
          </div>
          <div className="inner-total">
            <div className="total-label">Thanh toán:</div>
            <div className="hl">17.070.000 đ</div>
          </div>
        </div>
      </div>

      <div className="customer-infor">
        <div className="inner-title">Thông Tin Khách Hàng</div>
        <CustomerInfor/>

      </div>
    </div >

  </>)
}