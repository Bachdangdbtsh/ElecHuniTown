"use client"
import { useEffect,useState } from "react";
import Link from "next/link";
import { BsArrowUpRightSquareFill } from "react-icons/bs";
import { BsFillArrowDownLeftSquareFill } from "react-icons/bs";
import Product from "../../component/product";
import { FaFilter } from "react-icons/fa";

export default function Category({data}) {
  const category=data.category;
  return (<>
    <div className="category-page">
      <div className="link-from-homepage">
        <Link href="/">Trang chủ</Link>
        <div>{">>"}</div>
        <Link href="#">{data.parent?.name}</Link>
        <div>{">>"}</div>
        <Link href={`/category/${category.id}`}><strong>{data.count}</strong> {category?.name}</Link>
      </div>
      <div className="category-title">{category?.name}</div>
      <div className="description">{category?.description}</div>
      <div className="sort">
        <strong className="label">Sắp xếp:</strong>
        <div className="price-increase">
          <span>Giá tăng dần</span>
          <BsArrowUpRightSquareFill />
        </div>
        <div className="price-decrease">
          <span>Giá giảm dần</span>
          <BsFillArrowDownLeftSquareFill />
        </div>
      </div>
      <div className="filter">
        <div className="label">
          <span>Bộ lọc</span>
          <FaFilter />
        </div>
        <div className="list-tag">
          <div className="tag">Công suất cao</div>
          <div className="tag">Tích hợp tông đơ</div>
        </div>
      </div>
      <div className="list-product">
        {data.productList.map((p,index)=><Product data={p} key={index}></Product>)}
        
      </div>
      <div className="pagination">
        <div className="inner-item">
          <div>{"<<"}</div>
          <div className="page active">1</div>
          <div className="page">2</div>
          <div className="page">3</div>
          <div className="page">4</div>
          <div>{">>"}</div>
        </div>

      </div>
    </div>
  </>)
}