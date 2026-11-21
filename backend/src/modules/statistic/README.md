# Module `statistic` (Thống kê) — UC_49, 52, 53, 54, 55

Tất cả API dùng `GET`, trả `{ "code": "success", "data": ... }`. Tiền là số nguyên VND.
`from`, `to` có dạng `YYYY-MM-DD`, tính trọn ngày theo giờ Việt Nam; bỏ trống = từ đầu tháng đến hôm nay.

| Endpoint | UC | Tham số | Dữ liệu trả về (`data`) |
|---|---|---|---|
| `/statistics/dashboard` | 53 | `from`, `to` | `revenue`, `orders`, `newCustomers` (mỗi cái có `value`, `changePct` so với kỳ trước liền kề, `null` nếu kỳ trước = 0), `averageOrderValue`, `bestDay`, `activeProducts` |
| `/statistics/revenue` | 49 | `from`, `to`, `groupBy=day\|month` | `series: [{ date, revenue, orders }]`, đã điền 0 cho mốc không có đơn |
| `/statistics/top-products` | 54 | `from`, `to`, `limit` (1-50, mặc định 5) | `items: [{ id, name, category, sold, revenue }]` |
| `/statistics/slow-products` | 54 | `from`, `to`, `limit` | `items: [{ id, name, category, sold, stock }]` (có cả sản phẩm bán 0) |
| `/statistics/ratings` | 55 | `from`, `to`, `limit` | `overall { average, total, newInRange, distribution }`, `products[]`. Trả 501 nếu chưa có bảng `Comment` |
| `/statistics/export` | 52 | `from`, `to` | File `.xlsx` (4 sheet: Tổng quan, Doanh thu theo ngày, Bán chạy, Bán chậm) |

## Quy ước tính (sửa trong `statistic.constants.js`)
- Chỉ đơn `DELIVERED` cũ và `DELIVERED_CONFIRMED` được tính; thời điểm tính là `Order.orderDate`.
- Doanh thu = tổng `Order.totalCost` (đã gồm phí vận chuyển, đã trừ giảm giá).
- "Khách hàng mới" = `User` có vai trò mã `CUSTOMER` tạo trong kỳ.
- Bán chạy/chậm tính theo kỳ từ `Order_contain_product`, không dùng cột `Product.sold` (tổng cả đời).

## Phân quyền
Mã quyền: `STATISTIC_VIEW`, `STATISTIC_EXPORT`. Guard đọc `req.user.permissions`;
chưa có auth thì dev cho qua (có cảnh báo), production trả 401.

## Dữ liệu mẫu
`npm run db:seed:statistic` (xem `prisma/seed-statistic.js`).
