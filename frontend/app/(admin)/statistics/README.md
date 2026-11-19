# Trang Thống kê tài chính (UC_49, 50, 51, 52, 53, 54, 55)

URL: `/statistics`. Gọi backend qua `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:4000`), API trong `backend/src/modules/statistic`.

- `page.js`: ghép các khối, giữ khoảng ngày đang chọn.
- `_components/`: KpiPanel, RevenueChart (SVG tự vẽ, không cần thư viện), ProfitSection (lợi nhuận + bảng theo danh mục/sản phẩm/nhân viên), ProductRanking, RatingSection, PeriodPicker, ExportButton, AsyncSection (tải/lỗi/trống).
- `_lib/`: gọi API (`api.js`, `useApi.js`), định dạng VND/ngày (`format.js`, `dates.js`).
- Khung menu chung nằm ở `components/admin/` (sửa `nav.js` để bật menu cho trang khác).
