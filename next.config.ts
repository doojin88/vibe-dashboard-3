import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Recharts를 클라이언트 사이드에서만 로드하도록 설정
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('recharts');
      } else if (typeof config.externals === 'object') {
        config.externals.recharts = 'commonjs recharts';
      }
    }
    return config;
  },
};

export default nextConfig;
