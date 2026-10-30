// Dữ liệu mẫu để thử các trang Thống kê (UC_49, 53, 54, 55).
//
// Chạy:   npm run db:seed:statistic          (trong thư mục backend)
// Tạo ra: ~40 khách hàng, 10 sản phẩm, ~600 đơn trải đều 60 ngày gần nhất (giờ VN),
//         nếu bảng "Comment" đã tồn tại thì tạo thêm bình luận có rating.
// An toàn chạy lại nhiều lần: mọi dữ liệu mẫu đều có dấu hiệu riêng (email "seed.stat.*",
// slug "seed-stat-*") và được xóa sạch trước khi tạo lại. Không đụng dữ liệu thật.

import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Không chạy seed dữ liệu mẫu trên môi trường production');
}

const DAYS = 60;
const CUSTOMERS = 40;
const EMAIL_PREFIX = 'seed.stat.';
const SLUG_PREFIX = 'seed-stat-';

// Bộ sinh số ngẫu nhiên có hạt giống -> mỗi lần seed ra cùng một dữ liệu.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

// weight = độ phổ biến: bán chạy nhất đứng đầu, 2 sản phẩm cuối cố ý bán rất ít / không bán.
const PRODUCTS = [
  { name: 'Máy pha cà phê thông minh', price: 5760000, stock: 220, weight: 100 },
  { name: 'Nồi chiên không dầu', price: 2990000, stock: 310, weight: 85 },
  { name: 'Quạt điều hòa', price: 3000000, stock: 150, weight: 70 },
  { name: 'Máy lọc không khí', price: 3100000, stock: 130, weight: 58 },
  { name: 'Bếp từ hồng ngoại', price: 1890000, stock: 180, weight: 46 },
  { name: 'Máy nước nóng', price: 2700000, stock: 118, weight: 5 },
  { name: 'Máy sấy quần áo', price: 6400000, stock: 71, weight: 4 },
  { name: 'Máy hút bụi không dây', price: 4800000, stock: 84, weight: 3 },
  { name: 'Máy giặt cửa ngang', price: 9900000, stock: 96, weight: 2 },
  { name: 'Tủ lạnh Inverter', price: 12500000, stock: 142, weight: 0 }, // 0 = không có đơn nào
];

const COMMENTS = [
  'Sản phẩm dùng rất tốt, tiện lợi cho sinh viên.',
  'Máy đẹp, giao hàng nhanh.',
  'Đúng mô tả, đóng gói cẩn thận.',
  'Dùng ổn nhưng dây điện hơi ngắn.',
  'Giá hợp lý so với chất lượng.',
];

function pickWeighted() {
  const total = PRODUCTS.reduce((s, p) => s + p.weight, 0);
  let r = rand() * total;
  for (const p of PRODUCTS) {
    r -= p.weight;
    if (r < 0) return p;
  }
  return PRODUCTS[0];
}

const DAY_MS = 86400000;
const VN_OFFSET_MS = 7 * 3600 * 1000;

async function cleanup() {
  const like = `${EMAIL_PREFIX}%`;
  const slug = `${SLUG_PREFIX}%`;
  const hasComment = (
    await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'Comment'
      ) AS "exists"`
  )[0].exists;
  if (hasComment) {
    await prisma.$executeRaw`DELETE FROM "Comment" WHERE "userId" IN (SELECT id FROM "User" WHERE email LIKE ${like})`;
  }
  await prisma.$executeRaw`DELETE FROM "Order_contain_product" WHERE "orderId" IN
    (SELECT id FROM "Order" WHERE "customerId" IN (SELECT id FROM "User" WHERE email LIKE ${like}))`;
  await prisma.$executeRaw`DELETE FROM "Order" WHERE "customerId" IN (SELECT id FROM "User" WHERE email LIKE ${like})`;
  await prisma.$executeRaw`DELETE FROM "RecipientInfo" WHERE "customerId" IN (SELECT id FROM "User" WHERE email LIKE ${like})`;
  await prisma.$executeRaw`DELETE FROM "User" WHERE email LIKE ${like}`;
  await prisma.$executeRaw`DELETE FROM "Product" WHERE slug LIKE ${slug}`;
  await prisma.$executeRaw`DELETE FROM "Category" WHERE slug LIKE ${slug}`;
  return hasComment;
}

async function main() {
  const hasComment = await cleanup();

  // Vai trò CUSTOMER (dùng chung nếu đã có).
  await prisma.$executeRaw`
    INSERT INTO "Role" (code, name, description, "isSystem")
    VALUES ('CUSTOMER', 'Khách hàng', 'Khách mua hàng', true)
    ON CONFLICT (code) DO NOTHING`;
  const roleId = (await prisma.$queryRaw`SELECT id FROM "Role" WHERE code = 'CUSTOMER'`)[0].id;

  // Danh mục + sản phẩm.
  const catId = (
    await prisma.$queryRaw`
      INSERT INTO "Category" (name, slug, description, "isActive", "updatedAt")
      VALUES ('Điện gia dụng (mẫu)', ${SLUG_PREFIX + 'dien-gia-dung'}, 'Dữ liệu mẫu cho thống kê', true, NOW())
      RETURNING id`
  )[0].id;

  for (const [i, p] of PRODUCTS.entries()) {
    const rows = await prisma.$queryRaw`
      INSERT INTO "Product" ("categoryId", "productName", "oldPrice", "newPrice", description, status, slug, stock)
      VALUES (${catId}, ${p.name}, ${Math.round(p.price * 1.1)}, ${p.price}, 'Sản phẩm mẫu',
              'ACTIVE'::"ProductStatus", ${SLUG_PREFIX + (i + 1)}, ${p.stock})
      RETURNING id`;
    p.id = rows[0].id;
  }

  // Khách hàng: ngày tạo tài khoản rải đều trong DAYS ngày để "khách hàng mới" có số liệu.
  const hash = await bcrypt.hash('Seed@123', 10);
  const now = Date.now();
  const customers = [];
  for (let i = 1; i <= CUSTOMERS; i++) {
    const createdAt = new Date(now - randInt(0, DAYS - 1) * DAY_MS);
    const email = `${EMAIL_PREFIX}${i}@elechunitown.test`;
    const uid = (
      await prisma.$queryRaw`
        INSERT INTO "User" (email, "passwordHash", "fullName", "roleId", "createdAt", "updatedAt")
        VALUES (${email}, ${hash}, ${'Khách mẫu ' + i}, ${roleId}, ${createdAt}, ${createdAt})
        RETURNING id`
    )[0].id;
    const rid = (
      await prisma.$queryRaw`
        INSERT INTO "RecipientInfo" ("customerId", "recipientName", "recipientPhoneNumber", address, "isDefault")
        VALUES (${uid}, ${'Khách mẫu ' + i}, ${'09' + String(10000000 + i)}, 'KTX ĐHQG-HCM, Dĩ An, Bình Dương', true)
        RETURNING id`
    )[0].id;
    customers.push({ id: uid, recipientId: rid });
  }

  // Đơn hàng: mỗi ngày 6-14 đơn, giờ đặt 08:00-21:59 (giờ VN).
  const soldMap = new Map(PRODUCTS.map((p) => [p.id, 0]));
  const deliveredItems = []; // để tạo bình luận
  let orderCount = 0;

  for (let d = DAYS - 1; d >= 0; d--) {
    const nowVn = new Date(now + VN_OFFSET_MS);
    const dayStartVnUtcMs = Date.UTC(nowVn.getUTCFullYear(), nowVn.getUTCMonth(), nowVn.getUTCDate()) - d * DAY_MS;
    const perDay = randInt(6, 14);
    for (let k = 0; k < perDay; k++) {
      const vnMs = dayStartVnUtcMs + randInt(8 * 60, 21 * 60 + 59) * 60000;
      const orderDate = new Date(vnMs - VN_OFFSET_MS); // đổi giờ VN -> UTC để lưu
      if (orderDate.getTime() > now) continue; // không tạo đơn ở tương lai

      const roll = rand();
      const status = roll < 0.82 ? 'DELIVERED' : roll < 0.9 ? 'CANCELLED' : roll < 0.95 ? 'SHIPPING' : 'PENDING';
      const customer = customers[randInt(0, customers.length - 1)];

      const lineMap = new Map();
      for (let n = randInt(1, 3); n > 0; n--) {
        const p = pickWeighted();
        if (p.weight === 0) continue;
        lineMap.set(p.id, { p, qty: (lineMap.get(p.id)?.qty ?? 0) + randInt(1, 2) });
      }
      if (lineMap.size === 0) continue;

      const subtotal = [...lineMap.values()].reduce((s, l) => s + l.p.price * l.qty, 0);
      const shippingFee = subtotal >= 3000000 ? 0 : 30000;
      const discount = rand() < 0.2 ? Math.round(subtotal * 0.05) : 0;
      const totalCost = subtotal + shippingFee - discount;

      const orderId = (
        await prisma.$queryRaw`
          INSERT INTO "Order" ("customerId", "recipientId", "orderDate", status, "shippingFee", discount, subtotal, "totalCost")
          VALUES (${customer.id}, ${customer.recipientId}, ${orderDate}, ${status}::"OrderStatus",
                  ${shippingFee}, ${discount}, ${subtotal}, ${totalCost})
          RETURNING id`
      )[0].id;
      orderCount++;

      for (const { p, qty } of lineMap.values()) {
        await prisma.$executeRaw`
          INSERT INTO "Order_contain_product" ("orderId", "productId", quantity, price)
          VALUES (${orderId}, ${p.id}, ${qty}, ${p.price})`;
        if (status === 'DELIVERED') {
          soldMap.set(p.id, soldMap.get(p.id) + qty);
          deliveredItems.push({ p, userId: customer.id, at: new Date(orderDate.getTime() + 3 * DAY_MS) });
        }
      }
    }
  }

  // Cập nhật cột Product.sold (tổng đã bán) cho khớp.
  for (const [id, sold] of soldMap) {
    await prisma.$executeRaw`UPDATE "Product" SET sold = ${sold} WHERE id = ${id}`;
  }

  // Bình luận + rating (chỉ khi bảng Comment đã có trong database).
  let commentCount = 0;
  if (hasComment) {
    const sums = new Map();
    for (const it of deliveredItems) {
      if (rand() > 0.25 || it.at.getTime() > now) continue;
      const r = rand();
      const rating = r < 0.7 ? 5 : r < 0.88 ? 4 : r < 0.95 ? 3 : r < 0.98 ? 2 : 1;
      await prisma.$executeRaw`
        INSERT INTO "Comment" ("productId", "userId", content, rating, "isActive", "createdAt", "updatedAt")
        VALUES (${it.p.id}, ${it.userId}, ${COMMENTS[randInt(0, COMMENTS.length - 1)]}, ${rating}, true, ${it.at}, ${it.at})`;
      const s = sums.get(it.p.id) ?? { total: 0, n: 0 };
      sums.set(it.p.id, { total: s.total + rating, n: s.n + 1 });
      commentCount++;
    }
    for (const [id, s] of sums) {
      await prisma.$executeRaw`UPDATE "Product" SET rate = ${Math.round((s.total / s.n) * 10) / 10} WHERE id = ${id}`;
    }
  }

  console.log(
    `Seed thống kê xong: ${CUSTOMERS} khách, ${PRODUCTS.length} sản phẩm, ${orderCount} đơn` +
      (hasComment ? `, ${commentCount} bình luận` : ' (bỏ qua bình luận: chưa có bảng Comment)'),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
