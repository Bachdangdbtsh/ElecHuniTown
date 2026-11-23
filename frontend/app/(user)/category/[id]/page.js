import { Suspense } from "react";
import Category from "./category";

export const metadata = {
  title: "Trang danh mục",
};

async function CategoryLoader({ id }) {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/category/${id}`, {
    method: "POST",
    cache: "no-store",       
  });

  // if (!res||res.code!="success") {
  //   return <div>Không tìm thấy danh mục (HTTP {res.status})</div>;
  // }

  const result = await res.json();
  return <Category data={result} />;
}

export default async function CategoryPage({ params }) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Đang tải danh mục...</div>}>
      <Category id={id}/>
    </Suspense>
  );
}
