'use client';

import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiTrendingDown, FiTrendingUp, FiX } from 'react-icons/fi';
import AsyncSection from './AsyncSection';
import { formatCompactVnd, formatNumber } from '../_lib/format';
import { formatDate } from '../_lib/dates';

const PAGE_SIZE = 8;

/** Các số trang cần hiện: đầu, cuối và quanh trang hiện tại (có dấu "…" giữa các khoảng). */
function pageNumbers(current, total) {
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  return [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
}

/**
 * Bảng đầy đủ sản phẩm bán chạy / bán chậm (mở từ card ở trang Thống kê).
 * kind = 'top' -> cột Doanh thu; kind = 'slow' -> cột Tồn kho.
 */
export default function RankingModal({ kind, state, range, onClose }) {
  const [page, setPage] = useState(1);
  const isTop = kind === 'top';
  const items = state.data?.items ?? [];
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = items.slice(start, start + PAGE_SIZE);

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

  const title = isTop ? 'Sản phẩm bán chạy nhất' : 'Sản phẩm bán chậm';
  const orderText = isTop ? 'Xếp theo số lượng đã bán giảm dần' : 'Xếp theo số lượng đã bán tăng dần';

  return (
    <div className="st-modal-backdrop" onClick={onClose}>
      <div
        className="st-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="st-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="st-modal-head">
          <span className="st-modal-icon" aria-hidden="true">
            {isTop ? <FiTrendingUp /> : <FiTrendingDown />}
          </span>
          <div className="st-modal-title-wrap">
            <h2 id="st-modal-title" className="st-modal-title">{title}</h2>
            <p className="st-sub">
              {range ? `Kỳ thống kê: ${formatDate(range.from)} – ${formatDate(range.to)}` : ''}
            </p>
          </div>
          <button type="button" className="st-modal-close" onClick={onClose} aria-label="Đóng">
            <FiX />
          </button>
        </header>

        <div className="st-modal-body">
          <div className="st-modal-toolbar">
            <p className="st-sub">{orderText}</p>
            {total > 0 && <span className="st-badge">{formatNumber(total)} sản phẩm</span>}
          </div>

          <AsyncSection state={state} minHeight={220} isEmpty={(d) => d.items.length === 0} emptyText="Chưa có sản phẩm nào trong kỳ này.">
            {() => (
              <>
                <div className="st-modal-table-wrap">
                  <table className="st-modal-table">
                    <thead>
                      <tr>
                        <th scope="col">Hạng</th>
                        <th scope="col">Sản phẩm</th>
                        <th scope="col" className="num">Đã bán {isTop ? '↓' : '↑'}</th>
                        <th scope="col" className="num">{isTop ? 'Doanh thu' : 'Tồn kho'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((item, index) => {
                        const rank = start + index + 1;
                        return (
                          <tr key={item.id}>
                            <td>
                              <span className={rank === 1 ? 'st-rank-badge top1' : 'st-rank-badge'}>{rank}</span>
                            </td>
                            <td>
                              <p className="st-modal-prod-name">{item.name}</p>
                              <p className="st-modal-prod-sub">{item.category}</p>
                            </td>
                            <td className="num">{formatNumber(item.sold)}</td>
                            <td className="num">
                              {isTop ? `${formatCompactVnd(item.revenue)} ₫` : formatNumber(item.stock)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </AsyncSection>
        </div>

        {total > PAGE_SIZE && (
          <footer className="st-modal-foot">
            <p className="st-sub">
              Hiển thị {start + 1}–{Math.min(start + PAGE_SIZE, total)} trong {formatNumber(total)} sản phẩm
              <span className="st-per-page"> · {PAGE_SIZE} sản phẩm/trang</span>
            </p>
            <nav className="st-pager" aria-label="Phân trang">
              <button
                type="button"
                className="st-page-btn"
                onClick={() => setPage(safePage - 1)}
                disabled={safePage <= 1}
                aria-label="Trang trước"
              >
                <FiChevronLeft />
              </button>
              {pageNumbers(safePage, totalPages).map((n, index, list) => (
                <span key={n} className="st-page-slot">
                  {index > 0 && n - list[index - 1] > 1 && <span className="st-page-gap">…</span>}
                  <button
                    type="button"
                    className={n === safePage ? 'st-page-btn active' : 'st-page-btn'}
                    onClick={() => setPage(n)}
                    aria-current={n === safePage ? 'page' : undefined}
                  >
                    {n}
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="st-page-btn"
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= totalPages}
                aria-label="Trang sau"
              >
                <FiChevronRight />
              </button>
            </nav>
          </footer>
        )}
      </div>
    </div>
  );
}
