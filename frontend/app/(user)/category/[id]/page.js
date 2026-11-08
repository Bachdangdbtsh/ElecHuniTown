import { Suspense } from "react";
import Category from "./category";

export const metadata = {
  title: "Trang danh mục",
};

export default async function CategoryPage({ params }) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Đang tải danh mục...</div>}>
      <Category id={id}/>
    </Suspense>
  );
}