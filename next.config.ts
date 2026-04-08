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
};

export default withNextIntl(nextConfig);
