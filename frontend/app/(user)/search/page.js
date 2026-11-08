import { Suspense } from "react";
import ListProductSearch from "./listProductSearch";
export const metadata = {
  title: "Trang kết quả tìm kiếm",
};

export default async function CategoryPage() {

  return (
    <Suspense fallback={<div>Đang tải ...</div>}>
      <ListProductSearch/>
    </Suspense>
  );
}