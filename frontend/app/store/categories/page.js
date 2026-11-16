import Link from 'next/link';
import { FiBox, FiGrid } from 'react-icons/fi';

export default function StoreCategoriesPage() {
  return (
    <section className="store-landing">
      <h1>Quản lý Danh mục Sản phẩm</h1>
      <p>Chọn chức năng quản lý danh mục hoặc sản phẩm bạn muốn thực hiện.</p>
      <div className="store-section-label">LỐI TẮT QUẢN LÝ SẢN PHẨM</div>
      <div className="store-landing-grid">
        <Link href="/store/categories/list" className="store-feature-card">
          <span className="store-feature-icon"><FiGrid /></span>
          <small>DANH MỤC</small>
          <h2>Quản lý danh mục</h2>
          <p>Phân loại, sắp xếp và quản lý danh mục để tổ chức sản phẩm khoa học, dễ dàng tìm kiếm.</p>
          <span className="store-feature-link">Mở chức năng <b>↗</b></span>
        </Link>
        <Link href="/store/categories/products" className="store-feature-card">
          <span className="store-feature-icon"><FiBox /></span>
          <small>SẢN PHẨM</small>
          <h2>Quản lý sản phẩm</h2>
          <p>Quản lý thông tin, cập nhật giá và thiết lập trạng thái hiển thị của từng sản phẩm.</p>
          <span className="store-feature-link">Mở chức năng <b>↗</b></span>
        </Link>
      </div>
      <div className="store-hint">ⓘ &nbsp; Chọn một chức năng để xem dữ liệu chi tiết và bắt đầu quản lý danh mục, sản phẩm.</div>
    </section>
  );
}
