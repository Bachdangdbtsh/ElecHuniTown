import { BsLightningChargeFill } from "react-icons/bs";
import { FaStar } from "react-icons/fa";
import Link from "next/link";

import {addCart} from "./editCart";
export default function Product({ data }) {
  if (!data) {
    return (<></>);
  }
  const discount = Math.round((data.oldPrice - data.newPrice) / data.oldPrice * 100);
  const addCartFormat = (e) => {
    e.stopPropagation();
    e.preventDefault();
    addCart(data, 1);
  };

  return (<>
    <div className="product-wrapper">
      <Link className="product" href={`/product/detail/${data.id}`}>
        <img className="image" src={data.pictures?.[0]?.url ?? "/placeholder.png"}></img>
        <div className="discount">
          <BsLightningChargeFill color="#FFCB06" />
          <div className="label">
            GIẢM -{discount}%
          </div>
        </div>
        <div className="product-name">{data.productName}</div>
        <div className="list-tag">
          {
            data.tags.map((p, index) => <div className="tag" key={index} >{p.tag}</div>)
          }
        </div>
        <div className="price">
          <div className="old-price"> {data.oldPrice.toLocaleString("vi-VN")} đ</div>
          <div className="new-price"> {data.newPrice.toLocaleString("vi-VN")} đ</div>
        </div>
      </Link>
      <div className="add-cart" onClick={(e) => { addCartFormat(e) }}>Thêm vào giỏ hàng</div>
        <div className="product-footer">
          <div className="rate">
            <div className="point">{data.rate}</div>
            <FaStar color="#FFD600" />
          </div>
          <div className="sold">
            Đã bán {data.sold}
          </div>
        </div>
    </div>
  </>)
}