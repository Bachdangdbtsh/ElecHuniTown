'use client';

export default function ProductCart({ item, onQuantityChange }) {
  return (
    <>
      <div className="infor-product">
        <img src={item.image || '/placeholder.png'} alt="" />
        <div className="inner-infor">
          <div className="label">{item.productName}</div>
          <div className="product-id">Mã sản phẩm: <strong>{item.id}</strong></div>
          <div className="new-price product-id">Giá sản phẩm: <strong className="color-red">{item.newPrice.toLocaleString('vi-VN')} đ</strong></div>
          <div className="old-price product-id">Giá niêm yết: <strong>{item.oldPrice?.toLocaleString('vi-VN')} đ</strong></div>
        </div>
      </div>
      <div className="inner-quantity">
        <label className="label" htmlFor={`quantity-${item.id}`}>Số lượng</label>
        <input id={`quantity-${item.id}`} type="number" min="1" max={item.stock} value={item.quantity} onChange={(event) => onQuantityChange(event.target.value)} />
        <div className="price"><span>{item.quantity} x </span><span className="hl">{item.newPrice.toLocaleString('vi-VN')} đ</span></div>
      </div>
    </>
  );
}
