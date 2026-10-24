
"use client";
import Link from "next/link";
import Product from "./component/product"
import { useEffect, useState, useRef } from "react";
export default function Home() {
  const [featureProducts, setfeatureProducts] = useState(null);
  const [suggestProducts, setsuggestProducts] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (featureProducts != null && suggestProducts != null)
      return;
    fetch("http://localhost:4000/", {
      method: "POST",
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        setfeatureProducts(data.featureProducts);
        setsuggestProducts(data.suggestProducts);
      })
  }, [])
  return (
    <>
      <div className="homepage">
        <div className="feature-product">
          <div className="title">Sản phẩm hot</div>
          <div className="list-feature-product">
            {featureProducts?.map((p) => (
              <Product data={p} key={p.id} />
            ))}
          </div>
          <div className="view-more">
            <Link href="#" className="view-more-button">Xem thêm</Link>

          </div>
        </div>
        <div className="suggest-product">
          <div className="title">Gợi ý cho bạn</div>
          <div className="list-suggest-product">
            {suggestProducts?.map((p) => (
              <Product data={p} key={p.id} />
            ))}
          </div>
          <div className="view-more">
            <Link href="#" className="view-more-button">Xem thêm</Link>
          </div>
        </div>

      </div>
    </>
  )
}