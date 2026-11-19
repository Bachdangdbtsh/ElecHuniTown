'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useApi } from './_lib/useApi';
import { formatDate, presetRange, previousRange } from './_lib/dates';
import PeriodPicker from './_components/PeriodPicker';
import ExportButton from './_components/ExportButton';
import KpiPanel from './_components/KpiPanel';
import RevenueChart from './_components/RevenueChart';
import RevenueSidePanel from './_components/RevenueSidePanel';
import ProfitSection from './_components/ProfitSection';
import RankingModal from './_components/RankingModal';
import ReviewDetailModal from './_components/ReviewDetailModal';
import ProductRanking from './_components/ProductRanking';
import RatingSection from './_components/RatingSection';

// Khoảng ngày mặc định (tháng này) chỉ tính trên trình duyệt: server trả null để không lệch giờ khi hydrate.
let defaultRange;
const subscribeNone = () => () => {};
const getClientRange = () => {
  if (defaultRange) return defaultRange;
  // Quay lại từ trang xem trước báo cáo: giữ đúng kỳ báo cáo trên URL.
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const to = params.get('to');
  defaultRange = from && to ? { from, to } : presetRange('thisMonth');
  return defaultRange;
};
const getServerRange = () => null;

export default function StatisticsPage() {
  const [picked, setRange] = useState(null);
  const [groupBy, setGroupBy] = useState('category');
  // null = đóng modal; 'top' | 'slow' = đang mở bảng đầy đủ tương ứng.
  const [openRank, setOpenRank] = useState(null);
  // Sản phẩm đang mở modal chi tiết đánh giá (null = đóng).
  const [reviewProduct, setReviewProduct] = useState(null);
  const initial = useSyncExternalStore(subscribeNone, getClientRange, getServerRange);
  const range = picked ?? initial;

  const prev = range ? previousRange(range) : null;
  const month = range ? range.to.split('-')[1] : '';

  const dashboard = useApi('/statistics/dashboard', range);
  const revenue = useApi('/statistics/revenue', range && { ...range, groupBy: 'day' });
  const prevRevenue = useApi('/statistics/revenue', prev && { ...prev, groupBy: 'day' });
  const top = useApi('/statistics/top-products', range && { ...range, limit: 5 });
  const slow = useApi('/statistics/slow-products', range && { ...range, limit: 5 });
  const ratings = useApi('/statistics/ratings', range && { ...range, limit: 5 });
  const profit = useApi('/statistics/profit', range);
  const breakdown = useApi('/statistics/breakdown', range && { ...range, groupBy, limit: 8 });
  // Bảng đầy đủ chỉ tải khi mở modal (limit tối đa backend cho phép).
  const topAll = useApi('/statistics/top-products', openRank === 'top' && range ? { ...range, limit: 500 } : null);
  const slowAll = useApi('/statistics/slow-products', openRank === 'slow' && range ? { ...range, limit: 500 } : null);

  return (
    <div className="st-page">
      <header className="st-head">
        <div>
          <h1 className="st-h1">Thống kê tài chính</h1>
          <p className="st-sub">
            Tổng quan hiệu suất{range ? ` từ ${formatDate(range.from)} đến ${formatDate(range.to)}` : ''}
          </p>
        </div>
        <div className="st-tools">
          <PeriodPicker range={range} onChange={setRange} />
          <ExportButton range={range} />
          <Link className="st-btn" href={range ? `/statistics/report?${new URLSearchParams(range)}` : '/statistics/report'}>
            Xem trước báo cáo
          </Link>
        </div>
      </header>

      <KpiPanel state={dashboard} />

      <section className="st-section" aria-labelledby="sec-revenue">
        <h2 id="sec-revenue" className="st-h2">
          Doanh thu theo thời gian
        </h2>
        <p className="st-sub">Tổng doanh số theo ngày, so với kỳ liền trước cùng độ dài</p>
        <div className="st-revenue-layout">
          <div className="st-panel st-revenue-panel">
            <RevenueChart revenueState={revenue} previousState={prevRevenue} bestDate={dashboard.data?.bestDay?.date} />
          </div>
          <RevenueSidePanel state={dashboard} month={month} />
        </div>
      </section>

      <section className="st-section" aria-labelledby="sec-profit">
        <h2 id="sec-profit" className="st-h2">
          Thống kê lợi nhuận
        </h2>
        <p className="st-sub">Doanh thu trừ giá vốn nhập hàng, tiền hoàn trả và chi phí phát sinh</p>
        <ProfitSection
          profitState={profit}
          breakdownState={breakdown}
          groupBy={groupBy}
          onChangeGroupBy={setGroupBy}
        />
      </section>

      <section className="st-section" aria-labelledby="sec-sales">
        <h2 id="sec-sales" className="st-h2">
          Thống kê doanh số
        </h2>
        <p className="st-sub">So sánh tốc độ bán và xác định cơ hội hàng tồn kho</p>
        <div className="st-two">
          <ProductRanking
            title="Sản phẩm bán chạy nhất"
            subtitle="Số lượng bán cao nhất trong kỳ"
            state={top}
            kind="top"
            productCount={dashboard.data?.activeProducts}
            onOpen={() => setOpenRank('top')}
          />
          <ProductRanking
            title="Sản phẩm bán chậm"
            subtitle="Tỷ lệ bán thấp nhất trong kỳ"
            state={slow}
            kind="slow"
            productCount={dashboard.data?.activeProducts}
            onOpen={() => setOpenRank('slow')}
          />
        </div>
      </section>

      <section className="st-section" aria-labelledby="sec-rating">
        <h2 id="sec-rating" className="st-h2">
          Thống kê đánh giá
        </h2>
        <p className="st-sub">Cảm nhận về sản phẩm từ đánh giá của khách hàng</p>
        <RatingSection state={ratings} onOpenProduct={setReviewProduct} />
      </section>

      {openRank === 'top' && (
        <RankingModal kind="top" state={topAll} range={range} onClose={() => setOpenRank(null)} />
      )}
      {openRank === 'slow' && (
        <RankingModal kind="slow" state={slowAll} range={range} onClose={() => setOpenRank(null)} />
      )}
      {reviewProduct && (
        <ReviewDetailModal product={reviewProduct} onClose={() => setReviewProduct(null)} />
      )}
    </div>
  );
}
