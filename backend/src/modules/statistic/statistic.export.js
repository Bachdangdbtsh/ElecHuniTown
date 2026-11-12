import ExcelJS from 'exceljs';

const VND = '#,##0';
const PCT = '0.0"%"';
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8FE3A9' } }; // màu thứ cấp của giao diện quản lý
const HEADER_FONT = { bold: true, color: { argb: 'FF1E293B' } };

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
}

/** Một sheet xếp hạng doanh thu / giá vốn / lợi nhuận dùng chung cho danh mục và nhân viên. */
function addBreakdownSheet(wb, title, firstColumn, data, withOrders) {
  const sheet = wb.addWorksheet(title);
  sheet.columns = [
    { header: firstColumn, key: 'label', width: 34 },
    ...(withOrders ? [{ header: 'Số đơn', key: 'orders', width: 12 }] : []),
    ...(withOrders ? [] : [{ header: 'Đã bán', key: 'sold', width: 12 }]),
    { header: 'Doanh thu (VND)', key: 'revenue', width: 20, style: { numFmt: VND } },
    { header: 'Giá vốn (VND)', key: 'cogs', width: 20, style: { numFmt: VND } },
    { header: 'Lợi nhuận (VND)', key: 'profit', width: 20, style: { numFmt: VND } },
    { header: 'Tỷ suất (%)', key: 'marginPct', width: 14, style: { numFmt: PCT } },
  ];
  styleHeader(sheet.getRow(1));
  data.items.forEach((r) => sheet.addRow({ ...r, marginPct: r.marginPct ?? null }));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return sheet;
}

/** Dựng workbook báo cáo tài chính (UC_52). Số tiền là số thật, có định dạng VND. */
export async function buildReportWorkbook({ dashboard, revenue, top, slow, profit, byCategory, byStaff, ratings }) {
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

  // --- Sheet 5: Lợi nhuận (UC_50)
  if (profit) {
    const s5 = wb.addWorksheet('Lợi nhuận');
    s5.columns = [
      { header: 'Chỉ số', key: 'k', width: 32 },
      { header: 'Giá trị', key: 'v', width: 22 },
      { header: 'So với kỳ trước (%)', key: 'p', width: 22 },
    ];
    styleHeader(s5.getRow(1));
    s5.addRow({ k: 'Kỳ báo cáo', v: `${profit.period.from} → ${profit.period.to}` });
    s5.addRow({ k: 'Doanh thu (VND)', v: profit.revenue });
    s5.addRow({ k: 'Giá vốn hàng bán (VND)', v: profit.cogs });
    s5.addRow({ k: 'Hoàn tiền cho khách (VND)', v: profit.refunds });
    s5.addRow({ k: 'Chi phí phát sinh khác (VND)', v: profit.otherCosts });
    s5.addRow({ k: 'Tổng chi phí (VND)', v: profit.totalCost });
    s5.addRow({ k: 'Lợi nhuận (VND)', v: profit.profit, p: profit.changePct });
    s5.addRow({ k: 'Tỷ suất lợi nhuận (%)', v: profit.marginPct ?? null });
    [3, 4, 5, 6, 7, 8].forEach((row) => {
      s5.getCell(`B${row}`).numFmt = VND;
    });
    s5.getCell('B9').numFmt = PCT;
    if (profit.itemsMissingCost > 0) {
      s5.addRow({ k: 'Dòng hàng chưa có giá vốn nhập', v: profit.itemsMissingCost });
    }
  }

  // --- Sheet 6: Theo danh mục (UC_51)
  if (byCategory) addBreakdownSheet(wb, 'Theo danh mục', 'Danh mục', byCategory, false);

  // --- Sheet 7: Theo nhân viên xử lý đơn (UC_51)
  if (byStaff) addBreakdownSheet(wb, 'Theo nhân viên', 'Nhân viên xử lý đơn', byStaff, true);

  // --- Sheet 8: Đánh giá sản phẩm (UC_55)
  if (ratings) {
    const s8 = wb.addWorksheet('Đánh giá');
    s8.columns = [
      { header: 'Sản phẩm', key: 'name', width: 40 },
      { header: 'Điểm trung bình', key: 'average', width: 16, style: { numFmt: '0.0' } },
      { header: 'Số đánh giá', key: 'total', width: 14 },
      { header: '5 sao', key: 's5', width: 10 },
      { header: '4 sao', key: 's4', width: 10 },
      { header: '3 sao', key: 's3', width: 10 },
      { header: '2 sao', key: 's2', width: 10 },
      { header: '1 sao', key: 's1', width: 10 },
    ];
    styleHeader(s8.getRow(1));
    s8.addRow({
      name: `Tổng thể (${ratings.period.from} → ${ratings.period.to})`,
      average: ratings.overall.average,
      total: ratings.overall.total,
      ...ratings.overall.distribution,
    });
    ratings.products.forEach((p) => s8.addRow({ ...p, ...p.distribution }));
    s8.views = [{ state: 'frozen', ySplit: 1 }];
  }

  return wb;
}
