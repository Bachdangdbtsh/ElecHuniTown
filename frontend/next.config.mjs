/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tắt Cache Components (Next 16) — tránh lỗi prerender cookies()/useSearchParams/new Date
  // trên layout mua hàng + admin khi chưa gắn Suspense đầy đủ.
  cacheComponents: false,
  allowedDevOrigins: ['192.168.100.185', 'localhost'],
};

export default nextConfig;
