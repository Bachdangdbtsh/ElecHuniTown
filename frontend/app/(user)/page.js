
"use client";
import Product from "./component/product"
import Pagination from "./component/Pagination";
import { useEffect, useState } from "react";
export default function Home() {
  const [suggestPage, setSuggestPage] = useState(1);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/backend?suggestPage=${suggestPage}`, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    })
      .then(res => { if (!res.ok) throw new Error('Không tải được sản phẩm'); return res.json(); })
      .then(setProducts)
      .catch(err => { if (err.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [suggestPage])
  return (
    <>
      <div className="homepage">
        {error && <p role="alert">Không tải được sản phẩm. Vui lòng thử lại.</p>}
        <div className="feature-product">
          <h2 className="title"><span aria-hidden="true">✦</span> Sản phẩm hot <span aria-hidden="true">✦</span></h2>
          <div className="list-feature-product">
            {products?.featureProducts?.map((p) => (
              <Product data={p} key={p.id} />
            ))}
          </div>
        </div>
        <div className="suggest-product">
          <div className="title">Gợi ý cho bạn</div>
          <div className="list-suggest-product">
            {products?.suggestProducts?.map((p) => (
              <Product data={p} key={p.id} />
            ))}
          </div>
          <Pagination page={suggestPage} totalPages={products?.suggestTotalPages ?? 0} onChange={(page) => { setError(false); setSuggestPage(page); }} label="Phân trang gợi ý" />
        </div>

      </div>
    </>
  )
}
