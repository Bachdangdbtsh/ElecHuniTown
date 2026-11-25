'use client';

import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import AsyncSection from './AsyncSection';
import Pager from './Pager';
import { useApi } from '../_lib/useApi';
import { formatNumber } from '../_lib/format';

const PAGE_SIZE = 8;

const STAR_FILTERS = [
  { value: 'all', label: 'Tất cả sao' },
  { value: '5', label: '5★' },
  { value: '4', label: '4★' },
  { value: '3', label: '3★' },
  { value: '2', label: '2★' },
  { value: '1', label: '1★' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Chữ viết tắt cho avatar: chữ đầu của từ đầu và từ cuối có chữ cái (Nguyễn Văn A -> NA). */
function initials(name) {
  const words = (name ?? 'Khách hàng').trim().split(/\s+/).filter((word) => /\p{L}/u.test(word));
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

function Stars({ value = 0 }) {
  return (
    <span className="st-stars" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? 'on' : ''}>★</span>
      ))}
    </span>
  );
}

/** Modal danh sách bình luận của một sản phẩm, lọc theo số sao và phân trang 8 dòng/trang. */
export default function ReviewDetailModal({ product, onClose }) {
  const [rating, setRating] = useState('all');
  const [page, setPage] = useState(1);

  const state = useApi('/statistics/ratings/reviews', {
    productId: product.id,
    limit: PAGE_SIZE,
    page,
    ...(rating === 'all' ? {} : { rating }),
  });

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function changeRating(event) {
    setRating(event.target.value);
    setPage(1);
  }

  const pagination = state.data?.pagination;
  const total = pagination?.total ?? 0;
  const start = ((pagination?.page ?? 1) - 1) * PAGE_SIZE;

  return (
    <div className="st-modal-backdrop" onClick={onClose}>
      <div
        className="st-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="st-review-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="st-modal-head">
          <div className="st-modal-title-wrap">
            <h2 id="st-review-title" className="st-modal-title">Chi tiết Đánh giá: {product.name}</h2>
            {total > 0 && <p className="st-sub">{formatNumber(total)} đánh giá</p>}
          </div>
          <button type="button" className="st-modal-close" onClick={onClose} aria-label="Đóng">
            <FiX />
          </button>
        </header>

        <div className="st-modal-body">
          <div className="st-modal-toolbar">
            <p className="st-sub">Đánh giá của khách hàng cho sản phẩm này</p>
            <label className="st-review-filter">
              <span>Lọc:</span>
              <select value={rating} onChange={changeRating} aria-label="Lọc theo số sao">
                {STAR_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <AsyncSection
            state={state}
            minHeight={220}
            isEmpty={(d) => d.items.length === 0}
            emptyText="Chưa có đánh giá nào phù hợp bộ lọc."
          >
            {(d) => (
              <ul className="st-review-list">
                {d.items.map((comment) => (
                  <li key={comment.id} className="st-review-item">
                    <span className="st-review-avatar" aria-hidden="true">
                      {initials(comment.User?.fullName)}
                    </span>
                    <div className="st-review-main">
                      <div className="st-review-top">
                        <div>
                          <p className="st-review-name">{comment.User?.fullName ?? 'Khách hàng'}</p>
                          <Stars value={comment.rating ?? 0} />
                        </div>
                        <p className="st-review-date">{formatDate(comment.createdAt)}</p>
                      </div>
                      <p className="st-review-content">{comment.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AsyncSection>
        </div>

        {total > PAGE_SIZE && (
          <footer className="st-modal-foot">
            <p className="st-sub">
              Hiển thị {start + 1}–{Math.min(start + PAGE_SIZE, total)} trong {formatNumber(total)} đánh giá
              <span className="st-per-page"> · {PAGE_SIZE} đánh giá/trang</span>
            </p>
            <Pager page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
          </footer>
        )}
      </div>
    </div>
  );
}
