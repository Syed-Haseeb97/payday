import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

// Content-Security-Policy configuration:
// - script-src: 'unsafe-eval' is only allowed in development for Fast Refresh / HMR; removed in production.
//   'unsafe-inline' is required for Next.js App Router bootstrap inline chunk scripts.
// - connect-src: Restricted to 'self' because all LLM and Supabase interactions happen strictly server-side.
// - img-src: Restricted to 'self' and data: (data: URI required for client-rendered UPI QR code canvases).
// - style-src: Allows 'self', 'unsafe-inline', and Google Fonts CSS (required for Tailwind v4 and dynamic CSS variable updates).
// - font-src: Allows 'self' and Google Fonts static asset hosts.
const cspHeader = `
  default-src 'self';
  script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        source: '/pay/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, no-store, no-referrer',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
