# Module `statistic` (Thống kê) — UC_49, 50, 51, 52, 53, 54, 55

Tất cả API dùng `GET`, trả `{ "code": "success", "data": ... }`. Tiền là số nguyên VND.
`from`, `to` có dạng `YYYY-MM-DD`, tính trọn ngày theo giờ Việt Nam; bỏ trống = từ đầu tháng đến hôm nay.

| Endpoint | UC | Tham số | Dữ liệu trả về (`data`) |
|---|---|---|---|
| `/statistics/dashboard` | 53 | `from`, `to` | `revenue`, `orders`, `newCustomers` (mỗi cái có `value`, `changePct` so với kỳ trước liền kề, `null` nếu kỳ trước = 0), `averageOrderValue`, `bestDay`, `activeProducts` |
| `/statistics/revenue` | 49 | `from`, `to`, `groupBy=day\|month` | `series: [{ date, revenue, orders }]`, đã điền 0 cho mốc không có đơn |
| `/statistics/profit` | 50 | `from`, `to` | `revenue` (tổng tiền đơn đã giao), `cogs` (giá vốn), `refunds` (đã hoàn), `otherCosts` (hàng hỏng đã duyệt), `totalCost`, `profit`, `marginPct`, `changePct`/`previous` so với kỳ trước, `itemsMissingCost` |
| `/statistics/breakdown` | 51 | `from`, `to`, `groupBy=category\|product\|staff`, `limit` (1-50, mặc định 8) | `items: [{ id, label, sublabel, orders?, sold?, revenue, cogs, profit, marginPct }]` |
| `/statistics/top-products` | 54 | `from`, `to`, `limit` (1-50, mặc định 5) | `items: [{ id, name, category, sold, revenue }]` |
| `/statistics/slow-products` | 54 | `from`, `to`, `limit` | `items: [{ id, name, category, sold, stock }]` (có cả sản phẩm bán 0) |
| `/statistics/ratings` | 55 | `from`, `to`, `limit` | `overall { average, total, newInRange, distribution }`, `products[]`. Trả 501 nếu chưa có bảng `Comment` |
| `/statistics/export` | 52 | `from`, `to` | File `.xlsx` (8 sheet: Tổng quan, Doanh thu theo ngày, Bán chạy, Bán chậm, Lợi nhuận, Theo danh mục, Theo nhân viên, Đánh giá) |

## Quy ước tính (sửa trong `statistic.constants.js`)
- Chỉ đơn `DELIVERED` được tính; thời điểm tính là `Order.orderDate` (schema chưa có `deliveredAt`).
- Doanh thu = tổng `Order.totalCost` (đã gồm phí vận chuyển, đã trừ giảm giá).
- "Khách hàng mới" = `User` có vai trò mã `CUSTOMER` tạo trong kỳ.
- Bán chạy/chậm tính theo kỳ từ `Order_contain_product`, không dùng cột `Product.sold` (tổng cả đời).
- Giá vốn (UC_50) = bình quân gia quyền `StockReceiptItem.unitCost` của các phiếu nhập **đã duyệt** tạo trước cuối kỳ, nhân với số lượng bán.
- Chi phí phát sinh (UC_50) = tiền hoàn của yêu cầu `REFUNDED` trong kỳ + giá trị hàng hỏng của phiếu xuất `DAMAGED` đã duyệt.
- Doanh thu ở UC_51 được phân bổ từ `Order.totalCost` theo tỷ lệ giá trị hàng, nên tổng các dòng khớp đúng doanh thu UC_49/UC_50.

## Phân quyền
Mã quyền: `STATISTIC_VIEW`, `STATISTIC_EXPORT`. Guard đọc `req.user.permissions`;
chưa có auth thì dev cho qua (có cảnh báo), production trả 401.

## Dữ liệu mẫu
`npm run db:seed:statistic` (xem `prisma/seed-statistic.js`).
