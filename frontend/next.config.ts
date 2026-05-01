import type {NextConfig} from 'next';

const shouldIgnoreBuildErrors =
  process.env.SKIP_STRICT_BUILD === 'true' && process.env.NODE_ENV !== 'production';
const backendTarget =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://127.0.0.1:8080';
const distDir = process.env.NODE_ENV === 'development' ? '.next-dev' : '.next';

const nextConfig: NextConfig = {
  /* config options here */
  distDir,
  typescript: {
    ignoreBuildErrors: shouldIgnoreBuildErrors,
  },
  eslint: {
    ignoreDuringBuilds: shouldIgnoreBuildErrors,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || '',
  },
  async rewrites() {
    return [
      {
        source: '/api/voice/:path*',
        destination: `${backendTarget.replace(/\/$/, '')}/api/voice/:path*`,
      },
    ];
  },
};

export default nextConfig;
