import type { NextConfig } from "next";

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

export default nextConfig;
