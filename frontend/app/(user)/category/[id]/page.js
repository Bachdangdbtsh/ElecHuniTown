import Link from "next/link";
import { BsArrowUpRightSquareFill } from "react-icons/bs";
import { BsFillArrowDownLeftSquareFill } from "react-icons/bs";
import Product from "../../component/product";
import { FaFilter } from "react-icons/fa";
export default function Category() {
  return (<>
    <div className="category-page">
      <div className="link-from-homepage">
        <Link href="/">Trang chủ</Link>
        <div>{">>"}</div>
        <Link href="#">Làm đẹp, chăm sóc cá nhân</Link>
        <div>{">>"}</div>
        <Link href="#"><strong>41</strong> Máy cạo râu</Link>
      </div>
      <div className="category-title">Máy cạo râu</div>
      <div className="description">Máy cạo râu là thiết bị không thể thiếu trong chăm sóc cá nhân của nhiều người, giúp việc cạo râu trở nên nhanh chóng và tiện lợi hơn. Với sự phát triển công nghệ, máy cạo râu ngày càng đa dạng về kiểu dáng, tính năng và phù hợp với nhiều nhu cầu sử dụng khác nhau, trở thành lựa chọn phổ biến trong cuộc sống hiện đại.   </div>
      <div className="sort">
        <strong className="label">Sắp xếp:</strong>
        <div className="price-increase">
          <span>Giá tăng dần</span>
          <BsArrowUpRightSquareFill />
        </div>
        <div className="price-decrease">
          <span>Giá giảm dần</span>
          <BsFillArrowDownLeftSquareFill />
        </div>
      </div>
      <div className="filter">
        <div className="label">
          <span>Bộ lọc</span>
          <FaFilter />
        </div>
        <div className="list-tag">
          <div className="tag">Công suất cao</div>
          <div className="tag">Tích hợp tông đơ</div>
        </div>
      </div>
      <div className="list-product">
        <Product></Product>
      </div>
      <div className="pagination">
        <div className="inner-item">
          <div>{"<<"}</div>
          <div className="page active">1</div>
          <div className="page">2</div>
          <div className="page">3</div>
          <div className="page">4</div>
          <div>{">>"}</div>
        </div>

      </div>
    </div>
  </>)
}