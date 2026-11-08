
import Link from "next/link";
import ListImages from "./swiper";
import ProductDescription from "./productDescription";
import RightPart from "./rightPart";
import Comment from "./comment";
export const metadata = {
  title: "Trang sản phẩm",
};

export default async function ProductDetail({ params }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/product/detail/${id}`, {
    method: "POST",
    cache: "no-store",
  });

  const data = await res.json();
  const product = data.product;
  console.log(data);

  return (<>
    <div className="product-detail-page">
      <div className="link-from-category">
        <Link href={`/category/${product.category?.id}`}>{product.category?.name}</Link>
        <div>{">>"}</div>
        <Link href={`/product/detail/${product.id}`}>{product.productName}</Link>
      </div>
      <div className="content">
        <div className="left-part">
          <div className="list-images">
            <ListImages pictures={product.pictures} />
          </div>
          <ProductDescription des={product.description} />
          <Comment product={product}/>
        </div>
        <RightPart product={product}></RightPart>
      </div>
    </div>
  </>)
}