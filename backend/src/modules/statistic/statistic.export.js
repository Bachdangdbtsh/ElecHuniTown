import ExcelJS from 'exceljs';

const VND = '#,##0';
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8FE3A9' } }; // màu thứ cấp của giao diện quản lý
const HEADER_FONT = { bold: true, color: { argb: 'FF1E293B' } };

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
}

/** Dựng workbook báo cáo tài chính (UC_52). Số tiền là số thật, có định dạng VND. */
export async function buildReportWorkbook({ dashboard, revenue, top, slow }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ElecHuniTown';
  wb.created = new Date();

  // --- Sheet 1: Tổng quan
  const s1 = wb.addWorksheet('Tổng quan');
  s1.columns = [
    { header: 'Chỉ số', key: 'k', width: 32 },
    { header: 'Giá trị', key: 'v', width: 22 },
    { header: 'So với kỳ trước (%)', key: 'p', width: 22 },
  ];
  styleHeader(s1.getRow(1));
  s1.addRow({ k: 'Kỳ báo cáo', v: `${dashboard.period.from} → ${dashboard.period.to}` });
  s1.addRow({ k: 'Tổng doanh thu (VND)', v: dashboard.revenue.value, p: dashboard.revenue.changePct });
  s1.addRow({ k: 'Tổng số đơn hàng', v: dashboard.orders.value, p: dashboard.orders.changePct });
  s1.addRow({ k: 'Khách hàng mới', v: dashboard.newCustomers.value, p: dashboard.newCustomers.changePct });
  s1.addRow({ k: 'Giá trị đơn trung bình (VND)', v: dashboard.averageOrderValue });
  s1.addRow({
    k: 'Ngày bán tốt nhất',
    v: dashboard.bestDay ? `${dashboard.bestDay.date} · ${dashboard.bestDay.revenue.toLocaleString('vi-VN')} VND` : '—',
  });
  s1.addRow({ k: 'Số sản phẩm đang bán', v: dashboard.activeProducts });
  s1.getCell('B3').numFmt = VND;
  s1.getCell('B6').numFmt = VND;

  // --- Sheet 2: Doanh thu theo ngày
  const s2 = wb.addWorksheet('Doanh thu theo ngày');
  s2.columns = [
    { header: 'Ngày', key: 'date', width: 16 },
    { header: 'Doanh thu (VND)', key: 'revenue', width: 20, style: { numFmt: VND } },
    { header: 'Số đơn', key: 'orders', width: 12 },
  ];
  styleHeader(s2.getRow(1));
  revenue.series.forEach((r) => s2.addRow(r));
  s2.views = [{ state: 'frozen', ySplit: 1 }];

  // --- Sheet 3: Bán chạy
  const s3 = wb.addWorksheet('Bán chạy');
  s3.columns = [
    { header: 'Hạng', key: 'rank', width: 8 },
    { header: 'Sản phẩm', key: 'name', width: 38 },
    { header: 'Danh mục', key: 'category', width: 22 },
    { header: 'Đã bán', key: 'sold', width: 12 },
    { header: 'Doanh thu (VND)', key: 'revenue', width: 20, style: { numFmt: VND } },
  ];
  styleHeader(s3.getRow(1));
  top.items.forEach((r, i) => s3.addRow({ rank: i + 1, ...r }));

  // --- Sheet 4: Bán chậm
  const s4 = wb.addWorksheet('Bán chậm');
  s4.columns = [
    { header: 'Hạng', key: 'rank', width: 8 },
    { header: 'Sản phẩm', key: 'name', width: 38 },
    { header: 'Danh mục', key: 'category', width: 22 },
    { header: 'Đã bán', key: 'sold', width: 12 },
    { header: 'Tồn kho', key: 'stock', width: 12 },
  ];
  styleHeader(s4.getRow(1));
  slow.items.forEach((r, i) => s4.addRow({ rank: i + 1, ...r }));

  return wb;
}
