/**
 * Base URL backend — dùng chung cho account SPA và (tuỳ chọn) shopping.
 * Ưu tiên NEXT_PUBLIC_API_URL, fallback NEXT_PUBLIC_URL, rồi localhost.
 */
export function getApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_URL ||
    'http://localhost:4000'
  );
}
