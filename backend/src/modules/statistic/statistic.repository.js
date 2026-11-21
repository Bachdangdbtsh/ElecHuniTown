import { prisma } from '../../lib/prisma.js';
import { COUNTED_ORDER_STATUS, CUSTOMER_ROLE_CODE, TZ } from './statistic.constants.js';

// Prisma trả COUNT/SUM của PostgreSQL dạng BigInt/Decimal -> ép về number cho JSON.
// Tiền lưu bằng số nguyên VND nên Number() là an toàn (< 2^53).
const num = (v) => (v === null || v === undefined ? 0 : Number(v));

const STATUS = COUNTED_ORDER_STATUS;

export async function getFinance() {
  const finance = await prisma.finance.findUnique({ where: { id: 1 } });
  return {
    cashBalance: num(finance?.cashBalance),
    totalExpense: num(finance?.totalExpense),
  };
}

/** Tổng doanh thu + số đơn trong khoảng [start, end). */
export async function getSummary(start, end) {
  const rows = await prisma.$queryRaw`
    SELECT COALESCE(SUM(o."totalCost"), 0)::float8 AS revenue,
           COUNT(*)::int AS orders
    FROM "Order" o
    WHERE o.status IN (${STATUS}::"OrderStatus", 'DELIVERED_CONFIRMED'::"OrderStatus")
      AND o."orderDate" >= ${start} AND o."orderDate" < ${end}`;
  return { revenue: num(rows[0].revenue), orders: num(rows[0].orders) };
}

/** Số khách hàng mới (tài khoản vai trò CUSTOMER tạo trong kỳ). */
export async function countNewCustomers(start, end) {
  const rows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS n
    FROM "User" u
    JOIN "Role" r ON r.id = u."roleId"
    WHERE r.code = ${CUSTOMER_ROLE_CODE}
      AND u."createdAt" >= ${start} AND u."createdAt" < ${end}`;
  return num(rows[0].n);
}

/** Số sản phẩm đang bán (ACTIVE). */
export async function countActiveProducts() {
  const rows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS n FROM "Product" WHERE status = 'ACTIVE'::"ProductStatus"`;
  return num(rows[0].n);
}

/**
 * Doanh thu gom theo ngày hoặc tháng (giờ Việt Nam).
 * Chỉ trả các mốc có đơn; service sẽ điền 0 cho các mốc trống.
 * orderDate lưu UTC (timestamp không múi giờ) nên phải đổi UTC -> giờ VN trước khi gom.
 */
export async function getRevenueBuckets(start, end, groupBy) {
  const unit = groupBy === 'month' ? 'month' : 'day';
  const fmt = unit === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
  const rows = await prisma.$queryRaw`
    SELECT to_char(date_trunc(${unit}, (o."orderDate" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}), ${fmt}) AS bucket,
           SUM(o."totalCost")::float8 AS revenue,
           COUNT(*)::int AS orders
    FROM "Order" o
    WHERE o.status IN (${STATUS}::"OrderStatus", 'DELIVERED_CONFIRMED'::"OrderStatus")
      AND o."orderDate" >= ${start} AND o."orderDate" < ${end}
    GROUP BY 1
    ORDER BY 1`;
  return rows.map((r) => ({ bucket: r.bucket, revenue: num(r.revenue), orders: num(r.orders) }));
}

/** Top sản phẩm bán chạy trong kỳ (theo số lượng, hòa thì theo doanh thu). */
export async function getTopProducts(start, end, limit) {
  const rows = await prisma.$queryRaw`
    SELECT p.id,
           p."productName" AS name,
           c.name AS category,
           SUM(i.quantity)::int AS sold,
           SUM(i.quantity::float8 * i.price)::float8 AS revenue
    FROM "Order_contain_product" i
    JOIN "Order" o ON o.id = i."orderId"
    JOIN "Product" p ON p.id = i."productId"
    JOIN "Category" c ON c.id = p."categoryId"
    WHERE o.status IN (${STATUS}::"OrderStatus", 'DELIVERED_CONFIRMED'::"OrderStatus")
      AND o."orderDate" >= ${start} AND o."orderDate" < ${end}
    GROUP BY p.id, p."productName", c.name
    ORDER BY sold DESC, revenue DESC, p.id ASC
    LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    sold: num(r.sold),
    revenue: num(r.revenue),
  }));
}

/**
 * Top sản phẩm bán chậm trong kỳ: tính cả sản phẩm bán 0 cái (LEFT JOIN),
 * sắp theo số bán tăng dần, hòa thì ưu tiên tồn kho cao hơn.
 */
export async function getSlowProducts(start, end, limit) {
  const rows = await prisma.$queryRaw`
    SELECT p.id,
           p."productName" AS name,
           c.name AS category,
           COALESCE(s.sold, 0)::int AS sold,
           p.stock::int AS stock
    FROM "Product" p
    JOIN "Category" c ON c.id = p."categoryId"
    LEFT JOIN (
      SELECT i."productId", SUM(i.quantity) AS sold
      FROM "Order_contain_product" i
      JOIN "Order" o ON o.id = i."orderId"
      WHERE o.status IN (${STATUS}::"OrderStatus", 'DELIVERED_CONFIRMED'::"OrderStatus")
        AND o."orderDate" >= ${start} AND o."orderDate" < ${end}
      GROUP BY i."productId"
    ) s ON s."productId" = p.id
    WHERE p.status = 'ACTIVE'::"ProductStatus"
    ORDER BY sold ASC, p.stock DESC, p.id ASC
    LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    sold: num(r.sold),
    stock: num(r.stock),
  }));
}

/**
 * Điểm đánh giá. Đọc từ bảng "Comment" (model của nhánh TrangMuaHang).
 * Ném lỗi có code 'NO_COMMENT_TABLE' nếu bảng chưa tồn tại trong DB.
 */
export async function getRatingStats(start, end, limit) {
  try {
    const overall = await prisma.$queryRaw`
      SELECT COALESCE(AVG(rating), 0)::float8 AS avg,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE rating = 5)::int AS s5,
             COUNT(*) FILTER (WHERE rating = 4)::int AS s4,
             COUNT(*) FILTER (WHERE rating = 3)::int AS s3,
             COUNT(*) FILTER (WHERE rating = 2)::int AS s2,
             COUNT(*) FILTER (WHERE rating = 1)::int AS s1,
             COUNT(*) FILTER (WHERE "createdAt" >= ${start} AND "createdAt" < ${end})::int AS in_range
      FROM "Comment"
      WHERE "isActive" = true AND rating IS NOT NULL`;
    const products = await prisma.$queryRaw`
      SELECT p.id,
             p."productName" AS name,
             AVG(cm.rating)::float8 AS avg,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE cm.rating = 5)::int AS s5,
             COUNT(*) FILTER (WHERE cm.rating = 4)::int AS s4,
             COUNT(*) FILTER (WHERE cm.rating = 3)::int AS s3,
             COUNT(*) FILTER (WHERE cm.rating = 2)::int AS s2,
             COUNT(*) FILTER (WHERE cm.rating = 1)::int AS s1
      FROM "Comment" cm
      JOIN "Product" p ON p.id = cm."productId"
      WHERE cm."isActive" = true AND cm.rating IS NOT NULL
      GROUP BY p.id, p."productName"
      ORDER BY total DESC, avg DESC, p.id ASC
      LIMIT ${limit}`;
    const dist = (r) => ({ 5: num(r.s5), 4: num(r.s4), 3: num(r.s3), 2: num(r.s2), 1: num(r.s1) });
    const o = overall[0];
    return {
      overall: {
        average: Math.round(num(o.avg) * 10) / 10,
        total: num(o.total),
        newInRange: num(o.in_range),
        distribution: dist(o),
      },
      products: products.map((r) => ({
        id: r.id,
        name: r.name,
        average: Math.round(num(r.avg) * 10) / 10,
        total: num(r.total),
        distribution: dist(r),
      })),
    };
  } catch (err) {
    const msg = String(err?.message ?? '');
    if (err?.code === '42P01' || err?.meta?.code === '42P01' || /relation "Comment" does not exist/i.test(msg)) {
      const e = new Error('Bảng Comment chưa tồn tại');
      e.code = 'NO_COMMENT_TABLE';
      throw e;
    }
    throw err;
  }
}
