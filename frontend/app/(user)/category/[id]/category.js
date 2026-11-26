"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { BsArrowUpRightSquareFill } from "react-icons/bs";
import { BsFillArrowDownLeftSquareFill } from "react-icons/bs";
import Product from "../../component/product";
import { FaFilter } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBase } from "@/lib/apiBase";

export default function Category({ id }) {
  const router = useRouter();
  const handleParams = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key !== "page") params.delete("page");
    router.push(`/category/${id}?${params.toString()}`);
  };
  const removeParams = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/category/${id}?${params.toString()}`);
  };

  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page")) || 1;
  const tag = searchParams.get("tag")
  const sort = searchParams.get("sort")

  const [productList, setproductList] = useState([]);
  const [pagination, setpagination] = useState({});
  const [tags, settags] = useState([]);
  const [parent, setparent] = useState(null);
  const [children, setChildren] = useState([]);
  const [category, setcategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);

    const url = new URL(`/category/${id}`, getApiBase());
    if (sort) url.searchParams.append("sort", sort);
    if (tag) url.searchParams.append("tag", tag);
    if (page) url.searchParams.append("page", page);

    fetch(url, {
      method: "POST",
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setproductList(data.productList || []);
          settags(data.tags || []);
          setpagination(data.pagination || {});
          setparent(data.parent || null);
          setChildren(data.children || []);
          setcategory(data.category || null);
        } else {
          setNotFound(true);
          setproductList([]);
          settags([]);
          setpagination({});
          setparent(null);
          setChildren([]);
          setcategory(null);
        }
      })
      .catch(err => {
        if (err.name !== "AbortError") setNotFound(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id, sort, tag, page])

  if (!loading && notFound) {
    return (
      <div className="category-page" style={{ padding: "48px 0" }}>
        <div className="link-from-homepage">
          <Link href="/">Trang chủ</Link>
        </div>
        <p style={{ marginTop: "24px", color: "#64748b" }}>Không tìm thấy danh mục hoặc danh mục đang tạm ẩn.</p>
      </div>
    );
  }

  return (<>
    <div className="category-page">
      <div className="link-from-homepage">
        <Link href="/">Trang chủ</Link>
        {
          parent && <>
            <div>{">>"}</div>
            <Link href={`/category/${parent.id}`}>{parent.name}</Link>
          </>
        }
        {category && <>
          <div>{">>"}</div>
          <Link href={`/category/${category.id}`}><strong>{pagination.total ?? 0}</strong> {category.name}</Link>
        </>}
      </div>
      <div className="category-title">{category?.name}</div>
      {category?.description && <div className="description">{category.description}</div>}
      {children.length > 0 && (
        <div className="subcategories" style={{ marginTop: "18px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <strong style={{ fontSize: "14px", color: "#2F7562" }}>Danh mục con:</strong>
          {children.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${sub.id}`}
              style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid #bfd8c8", background: "#eaf3ed", color: "#174936", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}
      <div className="sort">
        <strong className="label">Sắp xếp:</strong>
        <div className="price-increase" onClick={() => handleParams("sort", "asc")}>
          <span>Giá tăng dần</span>
          <BsArrowUpRightSquareFill />
        </div>
        <div className="price-decrease" onClick={() => handleParams("sort", "desc")}>
          <span>Giá giảm dần</span>
          <BsFillArrowDownLeftSquareFill />
        </div>
        <div className="all-price" onClick={() => removeParams("sort")}>
          <span>Bỏ sắp xếp</span>
        </div>
      </div>
      <div className="filter">
        <div className="label">
          <span>Bộ lọc</span>
          <FaFilter />
        </div>
        <div className="list-tag">
          <div className="tag" onClick={() => removeParams("tag")}>Reset</div>
          {
            tags.map(tag => <div key={tag} className="tag" onClick={() => handleParams("tag", tag)}>{tag}</div>)
          }
        </div>
      </div>
      {loading ? (
        <p style={{ marginTop: "40px", color: "#64748b" }}>Đang tải sản phẩm...</p>
      ) : productList.length === 0 ? (
        <p style={{ marginTop: "40px", color: "#64748b" }}>Chưa có sản phẩm nào trong danh mục này.</p>
      ) : (
        <div className="list-product">
          {productList.map((p) => <Product data={p} key={p.id}></Product>)}
        </div>
      )}
      {(pagination.totalPage || 0) > 1 && <div className="pagination">
        <div className="inner-item">

          {/* Nút Trang trước */}
          <div
            onClick={() => { if (page > 1) handleParams("page", page - 1); }}
            style={{
              cursor: page > 1 ? "pointer" : "not-allowed",
              opacity: page > 1 ? 1 : 0.5
            }}
          >
            {"<<"}
          </div>

          {(() => {
            const total = pagination.totalPage || 1;
            const maxVisible = 4;
            let start = Math.max(1, page - Math.floor(maxVisible / 2));
            let end = start + maxVisible - 1;
            if (end > total) {
              end = total;
              start = Math.max(1, end - maxVisible + 1);
            }
            const pages = [];
            for (let i = start; i <= end; i++) {
              pages.push(i);
            }

            return pages.map((pageNumber) => (
              <div
                key={pageNumber}
                className={`page ${pagination.page === pageNumber ? "active" : ""}`}
                onClick={() => handleParams("page", pageNumber)}
                style={{ cursor: "pointer" }}
              >
                {pageNumber}
              </div>
            ));
          })()}

          {/* Nút Trang sau */}
          <div
            onClick={() => { if (page < (pagination.totalPage || 1)) handleParams("page", page + 1); }}
            style={{
              cursor: page < (pagination.totalPage || 1) ? "pointer" : "not-allowed",
              opacity: page < (pagination.totalPage || 1) ? 1 : 0.5
            }}
          >
            {">>"}
          </div>

        </div>
      </div>}
    </div>
  </>)
}
