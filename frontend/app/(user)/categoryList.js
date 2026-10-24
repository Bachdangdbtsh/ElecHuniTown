"use client";
import { FaListUl } from "react-icons/fa";
import { useEffect,useState } from "react"
import Link from "next/link";
export default function CategoryList() {
  const [listCategory,setlistCatogy]=useState(null);
  useEffect(()=>{
    fetch("http://localhost:4000/header/category/list",{
      method:"POST",
    })
    .then(res=>res.json())
    .then(data=>{
      console.log(data);
      setlistCatogy(data.categories);
    })
  },[])
  return (
    <>
      <div className="category-list">
        <div className="container">
          <div className="category-more">
            <div className="label">
              <FaListUl />
              <span>Danh mục</span>
            </div>
            <div className="category-list-more">
              <div className="category-list-more--left">
                <div className="category-item">Điện tử, điện lạnh</div>
                <div className="category-item">Điện tử, điện lạnh</div>
              </div>
              <div className="category-list-more--right">
                <Link className="category-card" href="#">
                  <img className="card-image" src="/tulanh.jpg"></img>
                  <div className="card-label">Tủ lạnh</div>
                </Link>
              </div>
            </div>
          </div>
          {listCategory?.map((p,index)=><Link className="category" href={`/category/${p.id}`} link={index} key={index}>{p.categoryName}</Link>)}
        </div>
      </div></>
  )
}