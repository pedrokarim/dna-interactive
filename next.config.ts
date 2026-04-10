import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'herobox-img.yingxiong.com',
      },
    ],
  },
  // Optimisation SEO
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Allow bfcache by removing no-store on HTML pages.
        // Excludes API routes, _next assets and static files (which keep their own cache rules).
        source: '/((?!api|_next/|.*\\..*).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
