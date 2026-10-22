import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
export default function OrderDetail() {
  return (<>
    <div className="order-detail-page">
      <div className="cart-page">
        <div className="cart">
          <div className="inner-label">
            <div className="title">ĐƠN HÀNG 2610084PB3NWGA</div>
            <Link href="#" className="return">
              <span>Quay lại mua hàng</span>
              <FaChevronRight />
            </Link>
          </div>
          <div className="list-product">
            <div className="inner-product">
              <div className="infor-product">
                <img src="/tulanh.jpg" alt=""></img>
                <div className="inner-infor">
                  <div className="label">Máy cạo râu khô và ướt Coclear CS007</div>
                  <div className="product-id">Mã sản phẩm: <strong>123456789</strong></div>
                </div>
              </div>
              <div className="inner-quantity">
                <div className="label">Số Lượng </div>
                <input type="number" value={1} readOnly></input>
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


      </div>
      <div className="order-infor">
        <div className="inner-title">Thông tin đơn hàng</div>
        <div className="infor-detail">
          <div>Lê Minh Anh</div>
          <div>0335677719</div>
          <div>Ký túc xá khu A, TPHCM</div>
          <div className="inrow">
            <div className="hl">Ghi chú</div>
            <div>Đóng gói sản phẩm cẩn thận</div>
          </div>
          <div className="inrow">
            <div className="hl">Tình trạng đơn hàng</div>
            <div>Đã giao hàng thành công</div>
          </div>
        </div>
        <div className="payment">
          <button>THANH TOÁN</button>
        </div>
      </div>
    </div >

  </>)
}