'use client';

import { useEffect, useState } from 'react';
import Product from '../component/product';
import Pagination from '../component/Pagination';

export default function SearchResults({ query }) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    fetch(`/api/backend/search?key=${encodeURIComponent(query)}&page=${page}&limit=12`, {
      method: 'POST', credentials: 'include', signal: controller.signal,
    })
      .then((response) => { if (!response.ok) throw new Error('Không tìm kiếm được'); return response.json(); })
      .then(setResult)
      .catch((err) => { if (err.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [query, page]);

  return (
    <main className="search-page">
      <h1>Kết quả tìm kiếm{query ? `: ${query}` : ''}</h1>
      {!query && <p>Nhập tên sản phẩm hoặc danh mục vào ô tìm kiếm phía trên.</p>}
      {error && <p role="alert">Không tìm kiếm được. Vui lòng thử lại.</p>}
      {result && result.productList.length === 0 && <p>Không tìm thấy sản phẩm phù hợp.</p>}
      <div className="search-product-grid">
        {result?.productList?.map((product) => <Product data={product} key={product.id} />)}
      </div>
      <Pagination page={page} totalPages={result?.pagination?.totalPage ?? 0} onChange={(nextPage) => { setError(false); setResult(null); setPage(nextPage); }} label="Phân trang kết quả tìm kiếm" />
    </main>
  );
}
