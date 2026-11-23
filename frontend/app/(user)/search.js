"use client";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";

/** Không dùng useSearchParams để tránh bắt buộc Suspense trên mọi trang layout. */
export default function Search() {
  const router = useRouter();
  return (
    <form className="search" role="search" onSubmit={(event) => {
      event.preventDefault();
      const query = new FormData(event.currentTarget).get("q")?.toString().trim();
      if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
    }}>
      <input
        name="q"
        type="search"
        aria-label="Tìm sản phẩm, danh mục"
        placeholder="Tìm sản phẩm, danh mục"
      />
      <button type="submit" aria-label="Tìm kiếm"><FiSearch size={20} /></button>
    </form>
  );
}
