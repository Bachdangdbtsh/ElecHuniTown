import { BsLightningChargeFill } from "react-icons/bs";
import { FaStar } from "react-icons/fa";

export default function Product({ data }) {
  return (<>
    <div className="product">
      <img className="image" src="/tulanh.jpg"></img>
      <div className="discount">
        <BsLightningChargeFill color="#FFCB06" />
        <div className="label">
          GIẢM -30%
        </div>
      </div>
      <div className="product-name">Ấm đun nước</div>
      <div className="list-tag">
        <div className="tag">Công suất cao</div>
        <div className="tag">Công suất cao</div>
      </div>
      <div className="price">
        <div className="old-price"> 13.650.000 đ</div>
        <div className="new-price"> 2.590.000 đ</div>
      </div>
      <div className="add-cart">Thêm vào giỏ hàng</div>
      <div className="product-footer">
        <div className="rate">
          <div className="point">4.9</div>
          <FaStar color="#FFD600" />
        </div>
        <div className="sold">
          Đã bán 15.9k
        </div>
      </div>

    </div>
  </>)
}