import { AppError } from '../../common/error/AppError.js';
import * as repo from './statistic.repository.js';
import { resolveRange } from './statistic.schema.js';

/** % thay đổi so với kỳ trước. Kỳ trước = 0 thì trả null (tránh chia cho 0). */
function pctChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const pad = (n) => String(n).padStart(2, '0');

/** Liệt kê mọi mốc ngày (YYYY-MM-DD) hoặc tháng (YYYY-MM) trong khoảng from..to. */
function listBuckets(from, to, groupBy) {
  const out = [];
  if (groupBy === 'month') {
    let y = Number(from.slice(0, 4));
    let m = Number(from.slice(5, 7));
    const endKey = to.slice(0, 7);
    while (`${y}-${pad(m)}` <= endKey) {
      out.push(`${y}-${pad(m)}`);
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return out;
  }
  const d = new Date(`${from}T00:00:00Z`);
  const last = new Date(`${to}T00:00:00Z`);
  while (d <= last) {
    out.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** UC_49: doanh thu theo thời gian, điền 0 cho ngày/tháng không có đơn. */
export async function getRevenueSeries(query) {
  const range = resolveRange(query);
  const groupBy = query.groupBy ?? 'day';
  const rows = await repo.getRevenueBuckets(range.start, range.end, groupBy);
  const map = new Map(rows.map((r) => [r.bucket, r]));
  const series = listBuckets(range.from, range.to, groupBy).map((bucket) => ({
    date: bucket,
    revenue: map.get(bucket)?.revenue ?? 0,
    orders: map.get(bucket)?.orders ?? 0,
  }));
  return { from: range.from, to: range.to, groupBy, series };
}

/** UC_53: KPI tổng quan + so sánh với kỳ trước liền kề. */
export async function getDashboard(query) {
  const range = resolveRange(query);
  const [cur, prev, newCur, newPrev, activeProducts, daily, finance] = await Promise.all([
    repo.getSummary(range.start, range.end),
    repo.getSummary(range.prev.start, range.prev.end),
    repo.countNewCustomers(range.start, range.end),
    repo.countNewCustomers(range.prev.start, range.prev.end),
    repo.countActiveProducts(),
    repo.getRevenueBuckets(range.start, range.end, 'day'),
    repo.getFinance(),
  ]);

  const best = daily.reduce((b, r) => (!b || r.revenue > b.revenue ? r : b), null);

  return {
    period: { from: range.from, to: range.to },
    previousPeriod: { from: range.prev.from, to: range.prev.to },
    revenue: { value: cur.revenue, changePct: pctChange(cur.revenue, prev.revenue) },
    orders: {
      value: cur.orders,
      changePct: pctChange(cur.orders, prev.orders),
      changeAbs: cur.orders - prev.orders,
    },
    newCustomers: {
      value: newCur,
      changePct: pctChange(newCur, newPrev),
      changeAbs: newCur - newPrev,
    },
    averageOrderValue: cur.orders ? Math.round(cur.revenue / cur.orders) : 0,
    bestDay: best ? { date: best.bucket, revenue: best.revenue } : null,
    activeProducts,
    cashBalance: finance.cashBalance,
    totalExpense: finance.totalExpense,
  };
}

/** UC_54: sản phẩm bán chạy / bán chậm. */
export async function getTopProducts(query) {
  const range = resolveRange(query);
  const items = await repo.getTopProducts(range.start, range.end, query.limit);
  return { period: { from: range.from, to: range.to }, items };
}

export async function getSlowProducts(query) {
  const range = resolveRange(query);
  const items = await repo.getSlowProducts(range.start, range.end, query.limit);
  return { period: { from: range.from, to: range.to }, items };
}

/** UC_55: rating trung bình theo sản phẩm. */
export async function getRatings(query) {
  const range = resolveRange(query);
  try {
    const data = await repo.getRatingStats(range.start, range.end, query.limit);
    return { period: { from: range.from, to: range.to }, ...data };
  } catch (err) {
    if (err.code === 'NO_COMMENT_TABLE') {
      throw new AppError(
        501,
        'RATING_NOT_AVAILABLE',
        'Chưa có dữ liệu đánh giá (bảng Comment chưa được tạo trong database)',
      );
    }
    throw err;
  }
}

/** UC_55: danh sách đánh giá chi tiết của một sản phẩm (chỉ đọc). */
export async function getRatingReviews({ productId, rating, page, limit }) {
  const { items, total } = await repo.getProductReviews({
    productId,
    rating,
    skip: (page - 1) * limit,
    take: limit,
  });
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/** Chuyển số gốc của UC_50 thành các chỉ số lợi nhuận đã tính sẵn. */
function shapeProfit(t) {
  const totalCost = t.cogs + t.refunds + t.otherCosts;
  const profit = t.revenue - totalCost;
  return {
    revenue: t.revenue,
    cogs: t.cogs,
    refunds: t.refunds,
    otherCosts: t.otherCosts,
    totalCost,
    profit,
    marginPct: t.revenue ? Math.round((profit / t.revenue) * 1000) / 10 : null,
  };
}

/** UC_50: lợi nhuận = doanh thu - giá vốn nhập - chi phí phát sinh, kèm so sánh kỳ trước. */
export async function getProfit(query) {
  const range = resolveRange(query);
  const [cur, prev] = await Promise.all([
    repo.getProfitTotals(range.start, range.end),
    repo.getProfitTotals(range.prev.start, range.prev.end),
  ]);
  const current = shapeProfit(cur);
  const previous = shapeProfit(prev);
  return {
    period: { from: range.from, to: range.to },
    previousPeriod: { from: range.prev.from, to: range.prev.to },
    ...current,
    orders: cur.orders,
    changePct: pctChange(current.profit, previous.profit),
    previous: { profit: previous.profit, marginPct: previous.marginPct },
    // Số dòng hàng chưa có giá vốn nhập: càng nhiều thì lợi nhuận càng bị tính cao.
    itemsMissingCost: cur.itemsMissingCost,
  };
}

/** UC_51: thống kê theo danh mục / sản phẩm / nhân viên xử lý đơn. */
export async function getBreakdown(query) {
  const range = resolveRange(query);
  const rows = await repo.getBreakdown(range.start, range.end, query.groupBy ?? 'category', query.limit ?? 8);
  const items = rows.map((r) => {
    const profit = r.revenue - r.cogs;
    return {
      ...r,
      profit,
      marginPct: r.revenue ? Math.round((profit / r.revenue) * 1000) / 10 : null,
    };
  });
  return { period: { from: range.from, to: range.to }, groupBy: query.groupBy ?? 'category', items };
}

/** Gom toàn bộ dữ liệu cho báo cáo Excel (UC_52). */
export async function getReportData(query) {
  const base = { from: query.from, to: query.to };
  const [dashboard, revenue, top, slow, profit, byCategory, byStaff, ratings] = await Promise.all([
    getDashboard(base),
    getRevenueSeries({ ...base, groupBy: 'day' }),
    getTopProducts({ ...base, limit: 10 }),
    getSlowProducts({ ...base, limit: 10 }),
    getProfit(base),
    getBreakdown({ ...base, groupBy: 'category', limit: 50 }),
    getBreakdown({ ...base, groupBy: 'staff', limit: 50 }),
    // Bảng Comment có thể chưa tồn tại: báo cáo vẫn xuất bình thường, chỉ thiếu sheet đánh giá.
    getRatings({ ...base, limit: 50 }).catch(() => null),
  ]);
  return { dashboard, revenue, top, slow, profit, byCategory, byStaff, ratings };
}
