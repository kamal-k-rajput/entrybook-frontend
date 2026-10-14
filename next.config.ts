import path from 'node:path';
import type { NextConfig } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://entrybook.greenworldlighting.com';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd()),
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${target}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
