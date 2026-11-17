/** @type {import('next').NextConfig} */
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
  // Tắt Cache Components (Next 16) — tránh lỗi prerender cookies()/useSearchParams/new Date
  // trên layout mua hàng + admin khi chưa gắn Suspense đầy đủ.
  cacheComponents: false,
  allowedDevOrigins: ['192.168.100.185', 'localhost'],
};

export default nextConfig;
