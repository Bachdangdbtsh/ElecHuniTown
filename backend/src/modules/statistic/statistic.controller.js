import { AppError } from '../../common/error/AppError.js';
import * as service from './statistic.service.js';
import { buildReportWorkbook } from './statistic.export.js';
import { rangeQuery, revenueQuery, rankQuery, breakdownQuery, ratingReviewsQuery } from './statistic.schema.js';

function parse(schema, query) {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Tham số không hợp lệ');
  }
  return result.data;
}

const ok = (res, data) => res.json({ code: 'success', data });

// Express 5 tự chuyển lỗi của hàm async sang errorHandler nên không cần try/catch.

export async function dashboard(req, res) {
  ok(res, await service.getDashboard(parse(rangeQuery, req.query)));
}

export async function revenue(req, res) {
  ok(res, await service.getRevenueSeries(parse(revenueQuery, req.query)));
}

export async function topProducts(req, res) {
  ok(res, await service.getTopProducts(parse(rankQuery, req.query)));
}

export async function slowProducts(req, res) {
  ok(res, await service.getSlowProducts(parse(rankQuery, req.query)));
}

export async function ratings(req, res) {
  ok(res, await service.getRatings(parse(rankQuery, req.query)));
}

export async function ratingReviews(req, res) {
  ok(res, await service.getRatingReviews(parse(ratingReviewsQuery, req.query)));
}

export async function profit(req, res) {
  ok(res, await service.getProfit(parse(rangeQuery, req.query)));
}

export async function breakdown(req, res) {
  ok(res, await service.getBreakdown(parse(breakdownQuery, req.query)));
}

export async function exportExcel(req, res) {
  const query = parse(rangeQuery, req.query);
  const data = await service.getReportData(query);
  const wb = await buildReportWorkbook(data);
  const { from, to } = data.dashboard.period;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Bao_cao_tai_chinh_${from}_${to}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}
