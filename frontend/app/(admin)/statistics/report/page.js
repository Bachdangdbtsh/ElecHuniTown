'use client';

import { Suspense, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiDownload, FiPrinter } from 'react-icons/fi';
import { useApi } from '../_lib/useApi';
import { apiDownload } from '../_lib/api';
import { formatCompactVnd, formatNumber, formatPct, formatVnd } from '../_lib/format';
import { formatDate, formatDayMonth, presetRange } from '../_lib/dates';
import './report.css';

const PAPER_MARGINS = {
  default: '12mm',
  narrow: '6mm',
  none: '0mm',
};

const ZOOM_OPTIONS = [75, 100, 125];
const COPIES = [1, 2, 3, 4, 5];

// Ngày lập chỉ tính trên trình duyệt để server/client khớp nhau khi hydrate.
let printedAtLabel;
const getClientPrintedAt = () =>
  (printedAtLabel ??= new Date().toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }));
const getServerPrintedAt = () => '';
const subscribeNone = () => () => {};

function useReportRange() {
  const params = useSearchParams();
  const from = params.get('from');
  const to = params.get('to');
  return useMemo(() => (from && to ? { from, to } : presetRange('thisMonth')), [from, to]);
}

function monthLabelOf(range) {
  const [year, month] = range.to.split('-');
  return `THÁNG ${month}/${year}`;
}

function RevenueSpark({ series }) {
  const data = series ?? [];
  if (data.length === 0) return <p className="rp-empty">Chưa có dữ liệu doanh thu trong kỳ.</p>;

  const W = 640;
  const H = 180;
  const padL = 48;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const x = (i) => padL + (i * (W - padL - padR)) / Math.max(data.length - 1, 1);
  const y = (value) => padT + (H - padT - padB) * (1 - value / max);

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H - padB} L${padL},${H - padB} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(r * (data.length - 1)));

  return (
    <svg className="rp-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ doanh thu theo ngày">
      {yTicks.map((r) => (
        <g key={r}>
          <line x1={padL} x2={W - padR} y1={y(max * r)} y2={y(max * r)} className="rp-chart-grid" />
          <text x={padL - 8} y={y(max * r) + 3} textAnchor="end" className="rp-chart-label">
            {formatCompactVnd(max * r)}
          </text>
        </g>
      ))}
      <path d={area} className="rp-chart-area" />
      <path d={line} className="rp-chart-line" />
      {[...new Set(xTicks)].map((i) => (
        <text key={i} x={x(i)} y={H - 4} textAnchor="middle" className="rp-chart-label">
          {formatDayMonth(data[i].date)}
        </text>
      ))}
      <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} className="rp-chart-axis" />
    </svg>
  );
}

function RatingBlock({ state }) {
  const overall = state.data?.overall;
  const average = overall?.average ?? 0;
  const stars = Math.round(average);

  return (
    <div className="rp-rating">
      <p className="rp-rating-score">
        {average ? average.toFixed(1).replace('.', ',') : '—'}
        <span>/5</span>
      </p>
      <p className="rp-stars" aria-label={`${average} trên 5 sao`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= stars ? 'on' : ''}>★</span>
        ))}
      </p>
      <div className="rp-rating-info">
        <p className="rp-rating-label">Điểm đánh giá trung bình</p>
        <p className="rp-sub">Dựa trên {formatNumber(overall?.total ?? 0)} đánh giá đã ghi nhận</p>
        {overall?.newInRange > 0 && <p className="rp-rating-delta">+{formatNumber(overall.newInRange)} đánh giá trong kỳ</p>}
      </div>
    </div>
  );
}

function ProductTable({ items, kind }) {
  const isTop = kind === 'top';
  if (!items || items.length === 0) {
    return <p className="rp-empty">Chưa có dữ liệu sản phẩm trong kỳ.</p>;
  }
  return (
    <table className="rp-table">
      <thead>
        <tr>
          <th scope="col">Hạng</th>
          <th scope="col">Sản phẩm</th>
          <th scope="col" className="num">Đã bán {isTop ? '↓' : '↑'}</th>
          <th scope="col" className="num">{isTop ? 'Doanh thu' : 'Tồn kho'}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.id}>
            <td>
              <span className={index === 0 ? 'rp-rank top1' : 'rp-rank'}>{index + 1}</span>
            </td>
            <td>
              <p className="rp-prod-name">{item.name}</p>
              <p className="rp-prod-sub">{item.category}</p>
            </td>
            <td className="num">{formatNumber(item.sold)}</td>
            <td className="num">{isTop ? `${formatCompactVnd(item.revenue)} ₫` : formatNumber(item.stock)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReportHeader({ monthLabel }) {
  return (
    <header className="rp-page-head">
      <div>
        <p className="rp-brand">ElecHuniTown</p>
        <p className="rp-brand-sub">BÁO CÁO QUẢN TRỊ CỬA HÀNG</p>
      </div>
      <span className="rp-period-badge">{monthLabel}</span>
    </header>
  );
}

function ReportPageOne({ range, monthLabel, dashboard, revenue, ratings, skip }) {
  const d = dashboard.data;
  const bestDay = d?.bestDay;

  return (
    <article className={skip ? 'rp-page rp-page-skip' : 'rp-page'}>
      <ReportHeader monthLabel={monthLabel} />

      <div className="rp-section-head">
        <p className="rp-eyebrow">TỔNG QUAN HIỆU SUẤT</p>
        <h2 className="rp-h1">Báo cáo tài chính tháng</h2>
        <p className="rp-sub">Kỳ báo cáo: {formatDate(range.from)} – {formatDate(range.to)}</p>
      </div>

      <div className="rp-kpis">
        <div className="rp-kpi rp-kpi-primary">
          <p className="rp-kpi-label">Tổng doanh thu</p>
          <p className="rp-kpi-value">{d ? `${formatCompactVnd(d.revenue.value)} ₫` : '…'}</p>
          <p className="rp-kpi-change">
            {d ? `${d.revenue.changePct >= 0 ? '↑' : '↓'} ${formatPct(d.revenue.changePct)} so với tháng trước` : 'Đang tải…'}
          </p>
        </div>
        <div className="rp-kpi">
          <p className="rp-kpi-label">Tổng số đơn hàng</p>
          <p className="rp-kpi-value">{d ? formatNumber(d.orders.value) : '…'}</p>
          <p className="rp-kpi-change">
            {d
              ? `${d.orders.changePct >= 0 ? '↑' : '↓'} ${formatPct(d.orders.changePct)} · ${d.orders.changeAbs >= 0 ? '+' : ''}${formatNumber(d.orders.changeAbs)} đơn`
              : 'Đang tải…'}
          </p>
        </div>
        <div className="rp-kpi">
          <p className="rp-kpi-label">Khách hàng mới</p>
          <p className="rp-kpi-value">{d ? formatNumber(d.newCustomers.value) : '…'}</p>
          <p className="rp-kpi-change">
            {d
              ? `${d.newCustomers.changePct >= 0 ? '↑' : '↓'} ${formatPct(d.newCustomers.changePct)} · ${d.newCustomers.changeAbs >= 0 ? '+' : ''}${formatNumber(d.newCustomers.changeAbs)} khách`
              : 'Đang tải…'}
          </p>
        </div>
      </div>

      <div className="rp-inline-row">
        <span>Tổng khách hàng ghi nhận đến cuối kỳ</span>
        <strong>—</strong>
      </div>

      <section className="rp-block">
        <div className="rp-block-head">
          <h3 className="rp-h3">Doanh thu theo thời gian</h3>
          <span className="rp-unit">VND</span>
        </div>
        <p className="rp-sub">Tổng doanh số theo ngày trong kỳ báo cáo</p>
        <RevenueSpark series={revenue.data?.series} />
      </section>

      <div className="rp-strip">
        <div>
          <p className="rp-kpi-label">Giá trị đơn trung bình</p>
          <p className="rp-strip-value">{formatVnd(d?.averageOrderValue)}</p>
        </div>
        <div>
          <p className="rp-kpi-label">Ngày bán tốt nhất</p>
          <p className="rp-strip-value">
            {bestDay ? `${formatDate(bestDay.date)} · ${formatCompactVnd(bestDay.revenue)} ₫` : '—'}
          </p>
        </div>
      </div>
      <p className="rp-caption">Số liệu lấy từ đơn hàng đã giao trong kỳ; đơn vị tiền tệ VND.</p>

      <RatingBlock state={ratings} />

      <footer className="rp-page-foot">
        <span>ElecHuniTown · Thống kê tài chính · Đơn vị tiền tệ: VND</span>
        <span>Trang 1/2</span>
      </footer>
    </article>
  );
}

function ReportPageTwo({ range, monthLabel, dashboard, top, slow, skip }) {
  return (
    <article className={skip ? 'rp-page rp-page-skip' : 'rp-page'}>
      <ReportHeader monthLabel={monthLabel} />

      <div className="rp-section-head">
        <h2 className="rp-h1">Hiệu suất sản phẩm</h2>
        <p className="rp-sub">Kỳ báo cáo: tháng {monthLabel.replace('THÁNG ', '')}</p>
        <p className="rp-products-count">{formatNumber(dashboard.data?.activeProducts)} sản phẩm đang bán</p>
      </div>

      <section className="rp-block rp-block-tight">
        <div className="rp-block-head">
          <h3 className="rp-h3">Top 5 sản phẩm bán chạy nhất</h3>
          <span className="rp-unit">Số lượng giảm dần</span>
        </div>
        <ProductTable items={top.data?.items} kind="top" />
      </section>

      <section className="rp-block rp-block-tight">
        <div className="rp-block-head">
          <h3 className="rp-h3">Top 5 sản phẩm bán chậm</h3>
          <span className="rp-unit">Số lượng tăng dần</span>
        </div>
        <ProductTable items={slow.data?.items} kind="slow" />
      </section>

      <p className="rp-caption">
        Nguồn: ElecHuniTown — dữ liệu bán hàng và tồn kho trong kỳ {formatDate(range.from)} – {formatDate(range.to)}.
      </p>

      <footer className="rp-page-foot">
        <span>ElecHuniTown · Thống kê tài chính · Đơn vị tiền tệ: VND</span>
        <span>Trang 2/2</span>
      </footer>
    </article>
  );
}

function ReportPreview() {
  const range = useReportRange();
  const dashboard = useApi('/statistics/dashboard', range);
  const revenue = useApi('/statistics/revenue', { ...range, groupBy: 'day' });
  const top = useApi('/statistics/top-products', { ...range, limit: 5 });
  const slow = useApi('/statistics/slow-products', { ...range, limit: 5 });
  const ratings = useApi('/statistics/ratings', { ...range, limit: 50 });

  const [orientation, setOrientation] = useState('portrait');
  const [pageMargin, setPageMargin] = useState('default');
  const [printPages, setPrintPages] = useState('all');
  const [copies, setCopies] = useState(1);
  const [scale, setScale] = useState('fit');
  const [zoom, setZoom] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const printedAt = useSyncExternalStore(subscribeNone, getClientPrintedAt, getServerPrintedAt);

  const monthLabel = monthLabelOf(range);
  const [year, month] = range.to.split('-');
  const fileName = `Bao_cao_tai_chinh_${month}_${year}`;
  const backQuery = new URLSearchParams(range).toString();

  async function downloadXlsx() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await apiDownload(`/statistics/export?${backQuery}`, `${fileName}.xlsx`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function printReport() {
    window.print();
  }

  const skipFirst = printPages !== 'all' && printPages !== '1';
  const skipSecond = printPages !== 'all' && printPages !== '2';

  return (
    <div className={`rp-root rp-${orientation}`}>
      <style>{`@media print { @page { size: A4 ${orientation}; margin: ${PAPER_MARGINS[pageMargin]}; } }`}</style>

      <header className="rp-head">
        <div className="rp-head-left">
          <Link href={`/statistics?${backQuery}`} className="rp-back">
            <FiArrowLeft /> Quay lại
          </Link>
          <div>
            <h1 className="rp-title">{fileName}</h1>
            <p className="rp-sub">Xem trước báo cáo: Kỳ báo cáo tháng {month}/{year}</p>
          </div>
        </div>
        <span className="rp-tag">
          2 trang · A4 {orientation === 'portrait' ? 'dọc' : 'ngang'}
        </span>
      </header>

      <div className="rp-toolbar">
        <div className="rp-toolbar-group">
          <span className="rp-toolbar-label">Lưu dưới dạng:</span>
          <button
            type="button"
            className="rp-chip"
            onClick={printReport}
            title="Mở hộp thoại in của trình duyệt và chọn Lưu thành PDF"
          >
            PDF
          </button>
          <button type="button" className="rp-chip" onClick={downloadXlsx} disabled={busy}>
            {busy ? 'Đang xuất…' : 'XLSX'}
          </button>
        </div>
        <div className="rp-toolbar-right">
          <label className="rp-zoom">
            <span className="rp-toolbar-label">Thu phóng</span>
            <select value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>
              {ZOOM_OPTIONS.map((value) => (
                <option key={value} value={value}>{value}%</option>
              ))}
            </select>
          </label>
          <button type="button" className="rp-btn rp-btn-ghost" onClick={downloadXlsx} disabled={busy}>
            <FiDownload /> Tải xuống
          </button>
          <button type="button" className="rp-btn rp-btn-dark" onClick={printReport}>
            <FiPrinter /> In
          </button>
        </div>
      </div>
      <p className="rp-hint" role="status" aria-live="polite">{error}</p>

      <div className="rp-layout">
        <div className="rp-preview">
          <div className="rp-pages" style={{ zoom: zoom / 100 }}>
            <ReportPageOne
              range={range}
              monthLabel={monthLabel}
              dashboard={dashboard}
              revenue={revenue}
              ratings={ratings}
              skip={skipFirst}
            />
            <ReportPageTwo
              range={range}
              monthLabel={monthLabel}
              dashboard={dashboard}
              top={top}
              slow={slow}
              skip={skipSecond}
            />
          </div>
        </div>

        <aside className="rp-settings" aria-labelledby="rp-settings-title">
          <h2 id="rp-settings-title" className="rp-settings-title">Thiết lập in</h2>

          <label className="rp-field">
            <span>Máy in</span>
            <select defaultValue="default">
              <option value="default">Máy in mặc định</option>
            </select>
          </label>

          <label className="rp-field">
            <span>Trang cần in</span>
            <select value={printPages} onChange={(event) => setPrintPages(event.target.value)}>
              <option value="all">Tất cả · 2 trang</option>
              <option value="1">Trang 1</option>
              <option value="2">Trang 2</option>
            </select>
          </label>

          <div className="rp-field">
            <span>Khổ giấy</span>
            <div className="rp-field-row">
              <select defaultValue="a4" aria-label="Khổ giấy">
                <option value="a4">A4</option>
              </select>
              <select value={orientation} onChange={(event) => setOrientation(event.target.value)} aria-label="Hướng giấy">
                <option value="portrait">Dọc</option>
                <option value="landscape">Ngang</option>
              </select>
            </div>
          </div>

          <label className="rp-field">
            <span>Số bản in</span>
            <select value={copies} onChange={(event) => setCopies(Number(event.target.value))}>
              {COPIES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label className="rp-field">
            <span>Lề trang</span>
            <select value={pageMargin} onChange={(event) => setPageMargin(event.target.value)}>
              <option value="default">Mặc định</option>
              <option value="narrow">Hẹp</option>
              <option value="none">Không lề</option>
            </select>
          </label>

          <label className="rp-field">
            <span>Tỷ lệ</span>
            <select value={scale} onChange={(event) => setScale(event.target.value)}>
              <option value="fit">Vừa trang giấy</option>
              <option value="100">100%</option>
            </select>
          </label>

          <div className="rp-settings-note">
            <p><strong>Tổng số trang</strong><span>{printPages === 'all' ? '2 trang A4' : '1 trang A4'}</span></p>
            <p>
              Kỳ báo cáo: tháng {month}/{year}. Ngày lập: {printedAt || '—'}. In từ hộp thoại in của trình duyệt khi báo cáo.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ReportPreviewPage() {
  return (
    <Suspense fallback={<p className="rp-loading">Đang tải báo cáo…</p>}>
      <ReportPreview />
    </Suspense>
  );
}
