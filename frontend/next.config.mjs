/** @type {import('next').NextConfig} */
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [{
      source: '/api/backend/:path*',
      destination: `${apiOrigin}/:path*`,
    }];
  },
};

export default nextConfig;
