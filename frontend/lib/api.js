const BASE = '/api/backend';

export class ApiError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, options = {}) {
  let res;
  const { body, headers = {}, ...customConfig } = options;
  const config = {
    method: options.method || (body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
    ...customConfig,
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    res = await fetch(`${BASE}${path}`, config);
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
  // Backend AppError: { code, message }; success wrapper: { { code: 'success', data }
  const message =
    body?.message ||
    body?.error ||
    (res.status === 401
      ? 'Bạn chưa đăng nhập hoặc phiên đã hết hạn'
      : res.status === 403
        ? 'Bạn không có quyền thực hiện thao tác này'
        : `Lỗi máy chủ (${res.status})`);
  return new ApiError(message, { code: body?.code, status: res.status });
}

export async function apiGet(path, signal) {
  const res = await request(path, { signal });
  if (!res.ok) throw await toError(res);
  const body = await res.json();
  return body.data;
}

export async function apiFetch(path, options = {}) {
  const res = await request(path, options);
  if (!res.ok) throw await toError(res);
  const body = await res.json();
  return body.data;
}

export async function apiPost(path, body) {
  const res = await request(path, { method: 'POST', body });
  if (!res.ok) throw await toError(res);
  const json = await res.json();
  return json.data;
}

export async function apiPut(path, body) {
  const res = await request(path, { method: 'PUT', body });
  if (!res.ok) throw await toError(res);
  const json = await res.json();
  return json.data;
}

export async function apiPatch(path, body) {
  const res = await request(path, { method: 'PATCH', body });
  if (!res.ok) throw await toError(res);
  const json = await res.json();
  return json.data;
}

export async function apiDelete(path) {
  const res = await request(path, { method: 'DELETE' });
  if (!res.ok) throw await toError(res);
  const json = await res.json();
  return json.data;
}
