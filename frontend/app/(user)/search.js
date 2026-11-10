"use client";
import { useRouter } from "next/navigation";

/** Không dùng useSearchParams để tránh bắt buộc Suspense trên mọi trang layout. */
export default function Search() {
  const router = useRouter();
  return (
    <div className="search">
      <input
        placeholder="Tìm sản phẩm, danh mục"
        onKeyUp={(event) => {
          if (event.key === "Enter" && event.target.value !== "") {
            router.push(`/search?key=${encodeURIComponent(event.target.value)}`);
          }
        }}
      />
    </div>
  );
}
