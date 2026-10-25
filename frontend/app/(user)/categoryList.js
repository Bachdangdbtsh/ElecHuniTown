"use client";
import { FaListUl } from "react-icons/fa";
import { useEffect, useState } from "react"
import Link from "next/link";
export default function CategoryList() {
  const [categories, setcategories] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [children, setchildren] = useState(null);
  useEffect(() => {
    fetch("http://localhost:4000/header/category/list", {
      method: "POST",
    })
      .then(res => res.json())
      .then(data => {
        setcategories(data.categories);
        setActiveId(data.categories?.[0]?.id ?? null);
        setchildren(data.categories?.[0]?.children ?? null);
      })
  }, [])
  return (categories &&
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
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`category-item ${activeId === cat.id ? "active" : ""
                      }`}
                    onMouseEnter={() => setActiveId(cat.id)}
                    onClick={() => {
                      setActiveId(cat.id);
                      setchildren(cat.children);
                    }}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>

              <div className="category-list-more--right">
                {children.length === 0 ? (
                  <p className="category-empty">Danh mục này chưa có mục con</p>
                ) : (
                  children.map((child) => (
                    <Link
                      key={child.id}
                      className="category-card"
                      href={`/category/${child.id}`}
                    >
                      <img
                        className="card-image"
                        src={child.imageUrl || "/placeholder.jpg"}
                        alt={child.name}
                      />
                      <div className="card-label">{child.name}</div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
          {categories?.map((p, index) => <Link className="category" href={`/category/${p.id}`} link={index} key={index}>{p.name}</Link>)}
        </div>
      </div></>
  )
}