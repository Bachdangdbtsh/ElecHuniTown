"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { BsArrowUpRightSquareFill } from "react-icons/bs";
import { BsFillArrowDownLeftSquareFill } from "react-icons/bs";
import Product from "../../component/product";
import { FaFilter } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";

export default function Category({ id }) {
  const router = useRouter();
  const handleParams = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/category/${id}?${params.toString()}`);
  };
  const removeParams = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
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
  const [category, setcategory] = useState(null);
  useEffect(() => {

    const url = new URL(`${(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_URL)}/category/${id}`);
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
          settags(data.tags);
          setpagination(data.pagination);
          setparent(data.parent);
          setcategory(data.category);
          console.log(data.pagination);
        }
      })
  }, [id, sort, tag, page])
  // const category = data.category;
  return (<>
    <div className="category-page">
      <div className="link-from-homepage">
        <Link href="/">Trang chủ</Link>
        {
          parent && <>
            <div>{">>"}</div>
            <Link href="#">{parent?.name}</Link>
          </>
        }
        <div>{">>"}</div>
        <Link href={`/category/${category?.id}`}><strong>{pagination.total}</strong> {category?.name}</Link>
      </div>
      <div className="category-title">{category?.name}</div>
      <div className="description">{category?.description}</div>
      <div className="sort">
        <strong className="label">Sắp xếp:</strong>
        <div className="price-increase" onClick={() => handleParams("sort", "desc")}>
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
            tags.map(tag => <div className="tag" onClick={() => handleParams("tag", tag)}>{tag}</div>)
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
}