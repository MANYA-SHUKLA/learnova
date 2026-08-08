import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  transpilePackages: [
    '@learnova/ui',
    '@learnova/shared',
    '@learnova/types',
    '@learnova/constants',
  ],
  experimental: {
    optimizePackageImports: ['lucide-react', '@learnova/ui', 'recharts'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);
