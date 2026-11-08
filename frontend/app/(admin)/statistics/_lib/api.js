const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, signal) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { credentials: 'include', signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.', { code: 'NETWORK' });
  }
  return res;
}

async function toError(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* phản hồi không phải JSON */
  }
  return new ApiError(body?.message ?? `Lỗi máy chủ (${res.status})`, { code: body?.code, status: res.status });
}

/** GET trả về phần `data` của { code: 'success', data }. */
export async function apiGet(path, signal) {
  const res = await request(path, signal);
  if (!res.ok) throw await toError(res);
  const body = await res.json();
  return body.data;
}

/** Tải file (kèm cookie đăng nhập) rồi cho trình duyệt lưu xuống. */
export async function apiDownload(path, fallbackName) {
  const res = await request(path);
  if (!res.ok) throw await toError(res);
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
