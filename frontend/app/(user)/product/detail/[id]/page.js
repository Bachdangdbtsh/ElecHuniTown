
import Link from "next/link";
import { FaStar } from "react-icons/fa6";
import { FaStarHalf } from "react-icons/fa";
import { BsBox2 } from "react-icons/bs";
import { FaTicketSimple } from "react-icons/fa6";
import ListImages from "./swiper";
import ProductDescription from "./productDescription";
export const metadata = {
  title: "Trang sản phẩm",
};
export default function ProductDetail() {
  
  return (<>
    <div className="product-detail-page">
      <div className="link-from-category">
        <Link href="#">Máy cạo râu</Link>
        <div>{">>"}</div>
        <Link href="#">Máy cạo râu Coclear</Link>
      </div>
      <div className="content">
        <div className="left-part">
          <div className="list-images">
            <ListImages/>
          </div>
          <ProductDescription/>
          <div className="comment">
            <div className="first-part">
              <div className="rate">
                <div className="title">Đánh giá</div>
                <div className="point">0</div>
                <div className="list-star">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStarHalf />
                </div>
              </div>
              <div className="list-rate-tag">
                <div className="rate-tag active">Tất cả</div>
                <div className="rate-tag">
                  <div>5</div>
                  <FaStar />
                </div>
                <div className="rate-tag">
                  <div>4</div>
                  <FaStar />
                </div>
                <div className="rate-tag">
                  <div>3</div>
                  <FaStar />
                </div>
                <div className="rate-tag">
                  <div>2</div>
                  <FaStar />
                </div>
                <div className="rate-tag">
                  <div>1</div>
                  <FaStar />
                </div>
              </div>
            </div>
            <div className="write-review">
              <div className="title">Đánh giá sản phẩm tại đây</div>
              <div className="point">
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
              </div>
              <div className="des-part">
                <div className="des-title">Mô tả nhận xét</div>
                <form className="review-form">
                  <textarea placeholder="Nhập mô tả tại đây"></textarea>
                  <button>Gửi đánh giá</button>
                </form>
              </div>

            </div>
            <div className="other-review">
              <div className="review-detail">
                <div className="name">Nguyễn Văn A</div>
                <div className="point">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
                <div className="des-detail">Sản phẩm sử dụng tốt</div>
              </div>
            </div>
          </div>
        </div>
        <div className="right-part">
          <div className="product-name">Máy cạo râu khô và ướt Coclear CS007</div>
          <div className="in-row">
            <div className="rate">
              <div className="point">4.9</div>
              <FaStar color="#FFD600" />
            </div>
            <div className="number-review">10 đánh giá</div>
            <div className="sold-number"><strong>Đã bán: 15.9k</strong></div>
          </div>
          <div className="price">
            <div className="current-price">
              <div className="new-price">2.590.000đ</div>
              <div className="discount">-30%</div>
            </div>
            <div className="old-price">13.650.000đ</div>
          </div>
          <div className="product-infor">
            <div className="status infor-detail">
              <BsBox2 />
              <span>Còn hàng</span>
            </div>
            <div className="infor-detail">
              <FaTicketSimple />
              <div>Mã sản phẩm:<strong className="product-id">28T000001</strong></div>
            </div>
          </div>
          <div className="quantity">
            <div className="quantity-input">
              <div className="label">Số lượng</div>
              <input type="number" defaultValue="1"></input>
            </div>
            <div className="quantity-detail">
              <div className="number">1 x </div>
              <div className="price">10.000.000 </div>
            </div>
          </div>
          <div className="total">
            <div className="title">Tổng cộng</div>
            <div className="total-price">10.000.000đ</div>
          </div>
          <button className="add-cart">Thêm vào giỏ hàng</button>
        </div>
      </div>
    </div>
  </>)
}