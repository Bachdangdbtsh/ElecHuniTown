'use client';

import AsyncSection from './AsyncSection';
import { formatNumber } from '../_lib/format';

const STARS = [5, 4, 3, 2, 1];

function Distribution({ distribution, total }) {
  return (
    <ul className="st-dist">
      {STARS.map((s) => {
        const count = distribution[s] ?? 0;
        const pct = total ? (count / total) * 100 : 0;
        return (
          <li key={s}>
            <span className="st-dist-star">{s}★</span>
            <span className="st-bar" aria-hidden="true">
              <span className="st-bar-fill" style={{ width: `${pct}%` }} />
            </span>
            <span className="st-dist-pct">{Math.round(pct)}%</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function RatingSection({ state }) {
  // Backend trả 501 khi chưa có bảng Comment: đây là "chưa có dữ liệu", không phải lỗi.
  const notReady = state.status === 'error' && state.error?.code === 'RATING_NOT_AVAILABLE';
  const view = notReady ? { ...state, status: 'success', data: { notReady: true } } : state;

  return (
    <AsyncSection
      state={view}
      minHeight={260}
      isEmpty={(d) => d.notReady || d.overall.total === 0}
      emptyText="Chưa có đánh giá nào từ khách hàng."
    >
      {(d) => (
        <div className="st-rating">
          <div className="st-panel st-rating-overall">
            <p className="st-kpi-label">Đánh giá tổng thể</p>
            <p className="st-rating-score">
              {d.overall.average.toFixed(1).replace('.', ',')}
              <span className="st-rating-of"> /5</span>
            </p>
            <p className="st-sub">Dựa trên {formatNumber(d.overall.total)} đánh giá</p>
            <Distribution distribution={d.overall.distribution} total={d.overall.total} />
            <p className="st-sub">+{formatNumber(d.overall.newInRange)} đánh giá trong kỳ</p>
          </div>

          <div className="st-panel st-rating-products">
            <p className="st-kpi-label">Đánh giá theo sản phẩm</p>
            <ul className="st-prod-rating">
              {d.products.map((p) => (
                <li key={p.id}>
                  <p className="st-rank-name">{p.name}</p>
                  <p className="st-prod-score">
                    <strong>{p.average.toFixed(1).replace('.', ',')}</strong>/5
                  </p>
                  <p className="st-rank-meta">{formatNumber(p.total)} đánh giá</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AsyncSection>
  );
}
