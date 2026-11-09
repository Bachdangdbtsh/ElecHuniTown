
import Link from "next/link";
import { FaStar } from "react-icons/fa6";
import { FaStarHalf } from "react-icons/fa";
import ListImages from "./swiper";
import ProductDescription from "./productDescription";
import RightPart from "./rightPart";
export const metadata = {
  title: "Trang sản phẩm",
};

export default async function ProductDetail({ params }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/detail/${id}`, {
    method: "POST",
    cache: "no-store",
  });

  // if (!res||res.code!="success") {
  //   return <div>Không tìm thấy danh mục (HTTP {res.status})</div>;
  // }

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
            <ListImages pictures={product.pictures}/>
          </div>
          <ProductDescription des={product.description} />
          <div className="comment">
            <div className="first-part">
              <div className="rate">
                <div className="title">Đánh giá</div>
                <div className="point">{product.rate}</div>
                <div className="list-star">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStarHalf />
                </div>
              </div>
              <div className="list-rate-tag">
                <div className="rate-tag active">Tất cả</div>
                <div className="rate-tag">
                  <div>5</div>
                  <FaStar />
                </div>
                <div className="rate-tag">
                  <div>4</div>
                  <FaStar />
                </div>
                <div className="rate-tag">
                  <div>3</div>
                  <FaStar />
                </div>
                <div className="rate-tag">
                  <div>2</div>
                  <FaStar />
                </div>
                <div className="rate-tag">
                  <div>1</div>
                  <FaStar />
                </div>
              </div>
            </div>
            <div className="write-review">
              <div className="title">Đánh giá sản phẩm tại đây</div>
              <div className="point">
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
              </div>
              <div className="des-part">
                <div className="des-title">Mô tả nhận xét</div>
                <form className="review-form">
                  <textarea placeholder="Nhập mô tả tại đây"></textarea>
                  <button>Gửi đánh giá</button>
                </form>
              </div>

            </div>
            <div className="other-review">
              {product.Comment.map((com,index) => {
                console.log(com);
                return (
                  <div className="review-detail" key={index}>
                    <div className="name">{com.User.fullName}</div>
                    <div className="point">
                      {Array.from({ length: Math.floor(com.rating ?? 0) }, (_, i) => (
                        <FaStar key={i} />
                      ))}
                    </div>
                    <div className="des-detail">{com.content}</div>
                  </div>
                )
              })}

            </div>
          </div>
        </div>
        <RightPart product={product}></RightPart>
      </div>
    </div>
  </>)
}
