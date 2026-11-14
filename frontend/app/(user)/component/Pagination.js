'use client';

export default function Pagination({ page, totalPages, onChange, label = 'Phân trang sản phẩm' }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="shop-pagination" aria-label={label}>
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Trang trước">&lt;&lt;</button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
        <button type="button" key={number} onClick={() => onChange(number)} aria-label={`Trang ${number}`} aria-current={number === page ? 'page' : undefined} className={number === page ? 'active' : ''}>{number}</button>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Trang sau">&gt;&gt;</button>
    </nav>
  );
}
