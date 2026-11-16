"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { BsArrowUpRightSquareFill } from "react-icons/bs";
import { BsFillArrowDownLeftSquareFill } from "react-icons/bs";
import Product from "../component/product";
import { FaFilter } from "react-icons/fa";
import { useSearchParams, useRouter } from "next/navigation";

export default function ListProductSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = (searchParams.get("key"));
  const sort = (searchParams.get("sort"));
  const isFeature = (searchParams.get("isFeature"));
  const isSuggest = (searchParams.get("isSuggest"));
  const tag = (searchParams.get("tag"));
  const page = parseInt(searchParams.get("page")) || 1;

  const [productList, setproductList] = useState([]);
  const [title, settitle] = useState("");
  const [tags, settags] = useState([]);
  const [pagination, setpagination] = useState({});
  useEffect(() => {

    const url = new URL(`${(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_URL)}/search`);
    if (key) url.searchParams.append("key", key);
    if (isFeature) url.searchParams.append("isFeature", isFeature);
    if (isSuggest) url.searchParams.append("isSuggest", isSuggest);
    if (sort) url.searchParams.append("sort", sort);
    if (tag) url.searchParams.append("tag", tag);
    if (page) url.searchParams.append("page", page);

    fetch(url, {
      method: "POST"
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        if (data.code == "success") {
          setproductList(data.productList);
          settitle(data.title);
          settags(data.tags);
          setpagination(data.pagination);
          console.log(data.pagination);
        }
      })
  }, [key, isFeature, isSuggest, sort, tag,page])

  const handleParams = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/search?${params.toString()}`);
  };
  const removeParams = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.push(`/search?${params.toString()}`);
  };
  return (<>
    <div className="category-page">
      <div className="category-title">{title}</div>
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
      <div className="list-product">
        {productList.map((p, index) => <Product data={p} key={index}></Product>)}

      </div>
      <div className="pagination">
        <div className="inner-item">

          {/* Nút Trang trước */}
          <div
            onClick={() => handleParams("page", page - 1)}
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
            onClick={() => handleParams("page", page + 1)}
            style={{
              cursor: page < pagination.totalPages ? "pointer" : "not-allowed",
              opacity: page < pagination.totalPages ? 1 : 0.5
            }}
          >
            {">>"}
          </div>

        </div>
      </div>
    </div>
  </>)
  return <></>
}
