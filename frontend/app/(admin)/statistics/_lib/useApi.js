'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from './api';

/**
 * Gọi GET khi `params` đổi. Giữ dữ liệu cũ trong lúc tải kỳ mới để giao diện không nháy.
 * params = null -> chưa gọi (dùng khi còn chờ khoảng ngày).
 *
 * Trạng thái được suy ra từ "khóa" của lần gọi (đường dẫn + tham số + số lần thử lại),
 * nên không cần setState đồng bộ trong effect.
 */
export function useApi(path, params) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const query = params ? new URLSearchParams(params).toString() : null;
  const key = query === null ? null : `${path}?${query}#${tick}`;

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    apiGet(`${path}?${query}`, controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResult({ key, data: null, error });
      });
    return () => controller.abort();
  }, [key, path, query]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  if (key === null) return { status: 'idle', data: null, error: null, reload };
  if (result.key === key) {
    return result.error
      ? { status: 'error', data: null, error: result.error, reload }
      : { status: 'success', data: result.data, error: null, reload };
  }
  // Đang tải: giữ dữ liệu của lần trước (nếu có).
  return { status: 'loading', data: result.error ? null : result.data, error: null, reload };
}
