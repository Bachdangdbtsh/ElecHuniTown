"use client";
import { FaListUl } from "react-icons/fa";
import { useEffect, useState } from "react"
import Link from "next/link";
import Image from "next/image";
export default function CategoryList() {
  const [categories, setcategories] = useState(null);
  const [activeId, setActiveId] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/backend/header/category/list", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error("Không tải được danh mục");
        return res.json();
      })
      .then(data => {
        const loadedCategories = Array.isArray(data.categories) ? data.categories : [];
        setcategories(loadedCategories);
        setActiveId(loadedCategories[0]?.id ?? null);
      })
      .catch(err => {
        if (err.name !== "AbortError") setcategories([]);
      });
    return () => controller.abort();
  }, [])
  const activeCategory = categories?.find((category) => category.id === activeId) || categories?.[0];
  const currentChildren = Array.isArray(activeCategory?.children) ? activeCategory.children : [];
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
                  <Link
                    key={cat.id}
                    href={`/category/${cat.id}`}
                    className={`category-item ${activeId === cat.id ? "active" : ""
                      }`}
                    onMouseEnter={() => setActiveId(cat.id)}
                    onFocus={() => setActiveId(cat.id)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              <div className="category-list-more--right">
                {currentChildren.length === 0 ? (
                  <div className="category-empty">
                    <p>Danh mục này chưa có mục con.</p>
                    {activeCategory && <Link href={`/category/${activeCategory.id}`}>
                      Xem toàn bộ sản phẩm của danh mục này →
                    </Link>}
                  </div>
                ) : (
                  currentChildren.map((child) => (
                    <Link
                      key={child.id}
                      className="category-card"
                      href={`/category/${child.id}`}
                    >
                      <Image
                        className="card-image"
                        src={child.imageUrl || "/placeholder.svg"}
                        alt={child.name}
                        width={100}
                        height={80}
                        unoptimized
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
