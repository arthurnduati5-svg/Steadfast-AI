import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
    NEXT_PUBLIC_BACKEND_URL: '',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Change destination to localhost, as it was proven resolvable by curl from within the environment
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

export default nextConfig;
