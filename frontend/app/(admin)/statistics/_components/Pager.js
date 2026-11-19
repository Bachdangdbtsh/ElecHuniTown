'use client';

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/** Các số trang cần hiện: đầu, cuối và quanh trang hiện tại (khoảng hở hiển thị bằng "…"). */
export function pageNumbers(current, total) {
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  return [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
}

export default function Pager({ page, totalPages, onChange }) {
  const pages = pageNumbers(page, totalPages);

  return (
    <nav className="st-pager" aria-label="Phân trang">
      <button
        type="button"
        className="st-page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Trang trước"
      >
        <FiChevronLeft />
      </button>
      {pages.map((n, index, list) => (
        <span key={n} className="st-page-slot">
          {index > 0 && n - list[index - 1] > 1 && <span className="st-page-gap">…</span>}
          <button
            type="button"
            className={n === page ? 'st-page-btn active' : 'st-page-btn'}
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        </span>
      ))}
      <button
        type="button"
        className="st-page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Trang sau"
      >
        <FiChevronRight />
      </button>
    </nav>
  );
}
