/**
 * Chuẩn hóa số điện thoại dạng: 0901234567 -> "+84 90 123 4567"
 */
export function formatPhoneNumber(phone) {
  if (!phone) return 'Chưa cập nhật';
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('84') && clean.length === 11) {
    return `+84 ${clean.slice(2, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  if (clean.startsWith('0') && clean.length === 10) {
    return `+84 ${clean.slice(1, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return phone;
}

/**
 * Định dạng mốc thời gian dạng ISO -> "dd/MM/yyyy HH:mm"
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}