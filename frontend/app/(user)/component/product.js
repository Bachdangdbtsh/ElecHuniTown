import { BsLightningChargeFill } from "react-icons/bs";
import { FaStar } from "react-icons/fa";
import Link from "next/link";
export default function Product({data}) {
  console.log(data);
   if(!data){
    return(<></>);
  }
 const discount=Math.round((data.oldPrice-data.newPrice)/data.oldPrice*100); 
  const addCart = (e) => {
    e.stopPropagation();
    e.preventDefault(); 
  };
 
  return (<>
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
          data.tags.map((p,index)=><div className="tag" key={index} >{p.tag}</div>)
        }
      </div>
      <div className="price">
        <div className="old-price"> {data.oldPrice.toLocaleString("vi-VN")} đ</div>
        <div className="new-price"> {data.newPrice.toLocaleString("vi-VN")} đ</div>
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

    </Link>
  </>)
}