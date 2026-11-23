'use client';

import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import AsyncSection from './AsyncSection';
import { formatCompactVnd, formatNumber } from '../_lib/format';

/**
 * Danh sách xếp hạng sản phẩm. kind = 'top' (bán chạy: hiện doanh thu) hoặc 'slow' (bán chậm: hiện tồn kho).
 * Thanh ngang thể hiện số đã bán so với sản phẩm cao nhất trong danh sách.
 * Bấm vào card để mở bảng đầy đủ (RankingModal).
 */
export default function ProductRanking({ title, subtitle, state, kind, productCount, onOpen }) {
  function handleClick(event) {
    // Bỏ qua khi bấm vào nút bên trong (vd. "Thử lại" của khối lỗi).
    if (event.target.closest('button, a')) return;
    onOpen?.();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen?.();
    }
  }

  return (
    <section
      className="st-panel st-rank-card"
      aria-labelledby={`rank-${kind}`}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label={`Mở bảng đầy đủ: ${title}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="st-rank-band">
        <div className="st-rank-band-text">
          <h3 id={`rank-${kind}`} className="st-rank-band-title">
            {title}
          </h3>
          <p className="st-rank-band-sub">{subtitle}</p>
        </div>
        <div className="st-rank-band-side">
          {productCount != null && (
            <span className="st-rank-count">{formatNumber(productCount)} sản phẩm đang bán</span>
          )}
          <span className="st-rank-band-icon" aria-hidden="true">
            {kind === 'top' ? <FiTrendingUp /> : <FiTrendingDown />}
          </span>
        </div>
      </div>
      <AsyncSection
        state={state}
        minHeight={260}
        isEmpty={(d) => d.items.length === 0}
        emptyText="Chưa có sản phẩm nào để xếp hạng."
      >
        {(d) => {
          const max = Math.max(...d.items.map((i) => i.sold), 1);
          return (
            <ol className="st-rank">
              {d.items.map((item, idx) => (
                <li key={item.id}>
                  <span className="st-rank-no">{idx + 1}</span>
                  <div className="st-rank-body">
                    <p className="st-rank-name">{item.name}</p>
                    <p className="st-rank-cat">{item.category}</p>
                    <div className="st-bar" aria-hidden="true">
                      <span className={kind === 'top' ? 'st-bar-fill' : 'st-bar-fill st-bar-slow'} style={{ width: `${(item.sold / max) * 100}%` }} />
                    </div>
                  </div>
                  <div className="st-rank-nums">
                    <p>
                      Đã bán <strong>{formatNumber(item.sold)}</strong>
                    </p>
                    <p className="st-rank-meta">
                      {kind === 'top' ? `Doanh thu ${formatCompactVnd(item.revenue)} ₫` : `Tồn kho ${formatNumber(item.stock)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          );
        }}
      </AsyncSection>
    </section>
  );
}
