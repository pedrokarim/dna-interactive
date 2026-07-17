import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [70, 75],
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
    // CSP "enforcée" : uniquement les directives qui NE restreignent PAS le
    // chargement des scripts/styles/images → aucun risque de casser le rendu
    // Next, tout en fermant clickjacking (frame-ancestors), injection de <base>,
    // détournement de formulaire et plugins (object-src). Pas de default-src ici
    // (sinon il servirait de fallback à script-src et casserait les scripts Next).
    const cspEnforced = [
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    // CSP complète en Report-Only : restreint réellement les sources mais ne
    // bloque rien (les violations sont seulement rapportées en console). À
    // valider sur toutes les features (builds, maps, reCAPTCHA, OG) puis à
    // promouvoir en `Content-Security-Policy`. 'unsafe-inline' requis tant que
    // Next injecte des scripts/styles inline (upgrade nonce-based = suivi).
    const cspReportOnly = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google.com https://www.gstatic.com",
      "frame-src https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        // En-têtes de sécurité (défense en profondeur) sur toutes les routes.
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS : force HTTPS pendant 2 ans, sous-domaines inclus, éligible preload.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: cspEnforced },
          { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
        ],
      },
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
