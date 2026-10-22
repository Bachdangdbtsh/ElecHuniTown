

import Link from "next/link";
import Product from "./component/product"
export default function Home() {
  return (
    <>
      <div className="homepage">
        <div className="feature-product">
          <div className="title">Sản phẩm hot</div>
          <div className="list-feature-product">
           <Product></Product>
          </div>
          <div className="view-more">
            <Link href="#" className="view-more-button">Xem thêm</Link>

          </div>
        </div>
        <div className="suggest-product">
          <div className="title">Gợi ý cho bạn</div>
          <div className="list-suggest-product">
           <Product></Product>
          </div>
          <div className="view-more">
            <Link href="#" className="view-more-button">Xem thêm</Link>
          </div>
        </div>

      </div>
    </>
  )
}