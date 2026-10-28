// Tiện ích ngày theo giờ Việt Nam. Ngày luôn ở dạng chuỗi YYYY-MM-DD (khớp API backend).

const TZ = 'Asia/Ho_Chi_Minh';
const pad = (n) => String(n).padStart(2, '0');

export function todayVN() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
}

export const PRESETS = [
  { key: 'thisMonth', label: 'Tháng này' },
  { key: 'lastMonth', label: 'Tháng trước' },
  { key: 'last30', label: '30 ngày qua' },
  { key: 'custom', label: 'Tùy chọn' },
];

/** Khoảng ngày { from, to } của một mục chọn nhanh. 'custom' giữ nguyên khoảng hiện tại. */
export function presetRange(key, current) {
  const today = todayVN();
  if (key === 'lastMonth') {
    const firstThis = `${today.slice(0, 7)}-01`;
    const lastDayPrev = addDays(firstThis, -1);
    return { from: `${lastDayPrev.slice(0, 7)}-01`, to: lastDayPrev };
  }
  if (key === 'last30') return { from: addDays(today, -29), to: today };
  if (key === 'custom' && current) return current;
  return { from: `${today.slice(0, 7)}-01`, to: today }; // thisMonth
}

/** Kỳ liền trước, cùng độ dài (giống cách backend tính "so với kỳ trước"). */
export function previousRange({ from, to }) {
  const length = daysBetween(from, to) + 1;
  return { from: addDays(from, -length), to: addDays(from, -1) };
}

/** 'YYYY-MM-DD' -> 'dd/MM/YYYY' */
export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** 'YYYY-MM-DD' -> 'dd/MM' */
export function formatDayMonth(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}
