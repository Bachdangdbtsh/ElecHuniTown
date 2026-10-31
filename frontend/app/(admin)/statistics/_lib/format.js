const nf = new Intl.NumberFormat('vi-VN');

export const formatNumber = (n) => nf.format(n ?? 0);

/** 2138976500 -> "2.138.976.500 ₫" */
export const formatVnd = (n) => `${nf.format(Math.round(n ?? 0))} ₫`;

/** Dạng ngắn cho trục biểu đồ và ô hẹp: 2138976500 -> "2,14 tỷ", 98410500 -> "98,4 tr". */
export function formatCompactVnd(n) {
  const v = Math.abs(n ?? 0);
  const trim = (x, digits) => x.toFixed(digits).replace('.', ',').replace(/,?0+$/, '');
  if (v >= 1e9) return `${trim(n / 1e9, 2)} tỷ`;
  if (v >= 1e6) return `${trim(n / 1e6, 1)} tr`;
  if (v >= 1e3) return `${trim(n / 1e3, 0)} k`;
  return String(Math.round(n ?? 0));
}

/** 12.84 -> "12,8%"; null (kỳ trước = 0) -> "—" */
export function formatPct(p) {
  if (p === null || p === undefined) return '—';
  return `${Math.abs(p).toFixed(1).replace('.', ',')}%`;
}
