import { z } from 'zod';
import { AppError } from '../../common/error/AppError.js';
import { MAX_RANGE_DAYS, TZ_OFFSET } from './statistic.constants.js';

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD');

// from, to: YYYY-MM-DD (cả hai đều tính trọn ngày, theo giờ Việt Nam).
// Không truyền thì mặc định là tháng hiện tại.
export const rangeQuery = z
  .object({
    from: dateStr.optional(),
    to: dateStr.optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: 'Ngày bắt đầu không được sau ngày kết thúc',
    path: ['from'],
  });

export const revenueQuery = z
  .object({
    from: dateStr.optional(),
    to: dateStr.optional(),
    groupBy: z.enum(['day', 'month']).default('day'),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: 'Ngày bắt đầu không được sau ngày kết thúc',
    path: ['from'],
  });

export const rankQuery = z
  .object({
    from: dateStr.optional(),
    to: dateStr.optional(),
    limit: z.coerce
      .number({ error: 'limit phải là số' })
      .int('limit phải là số nguyên')
      .min(1, 'limit tối thiểu là 1')
      .max(500, 'limit tối đa là 500')
      .default(5),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: 'Ngày bắt đầu không được sau ngày kết thúc',
    path: ['from'],
  });

// UC_51: gom theo danh mục, sản phẩm hoặc nhân viên xử lý đơn.
export const breakdownQuery = z
  .object({
    from: dateStr.optional(),
    to: dateStr.optional(),
    groupBy: z.enum(['category', 'product', 'staff']).default('category'),
    limit: z.coerce
      .number({ error: 'limit phải là số' })
      .int('limit phải là số nguyên')
      .min(1, 'limit tối thiểu là 1')
      .max(50, 'limit tối đa là 50')
      .default(8),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: 'Ngày bắt đầu không được sau ngày kết thúc',
    path: ['from'],
  });

// UC_55: danh sách đánh giá chi tiết của một sản phẩm trong trang Thống kê.
export const ratingReviewsQuery = z.object({
  productId: z.coerce.number().int().positive('productId không hợp lệ'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(8),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

// ---------- Tiện ích thời gian (giờ Việt Nam) ----------

const pad = (n) => String(n).padStart(2, '0');

function vnToday() {
  // Lấy ngày hiện tại theo giờ VN, bất kể múi giờ máy chủ.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // YYYY-MM-DD
}

function addDays(dateString, days) {
  const d = new Date(`${dateString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
}

/**
 * Đổi { from, to } (YYYY-MM-DD) thành khoảng nửa mở [start, end) kiểu Date (UTC),
 * kèm kỳ trước liền kề có cùng độ dài để so sánh %.
 */
export function resolveRange({ from, to }) {
  let f = from;
  let t = to;
  if (!f || !t) {
    const today = vnToday();
    const monthStart = `${today.slice(0, 7)}-01`;
    f = f ?? monthStart;
    t = t ?? today;
    if (f > t) t = f;
  }
  const length = daysBetween(f, t) + 1;
  if (length > MAX_RANGE_DAYS) {
    throw new AppError(
      400,
      'RANGE_TOO_LARGE',
      `Khoảng thời gian thống kê tối đa là ${MAX_RANGE_DAYS} ngày`,
    );
  }
  const prevFrom = addDays(f, -length);
  const prevTo = addDays(f, -1);
  const toDate = (d) => new Date(`${d}T00:00:00${TZ_OFFSET}`);
  return {
    from: f,
    to: t,
    start: toDate(f),
    end: toDate(addDays(t, 1)),
    prev: {
      from: prevFrom,
      to: prevTo,
      start: toDate(prevFrom),
      end: toDate(f),
    },
  };
}
