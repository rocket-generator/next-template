import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  transpilePackages: [
    '@aws-sdk/client-s3',
    '@aws-sdk/client-ses',
    '@aws-sdk/s3-request-presigner',
  ],
  images: {
    remotePatterns: [
      // LocalStack (Development)
      {
        protocol: 'http',
        hostname: 'localstack',
        port: '4566',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4566',
        pathname: '/**',
      },
      // AWS S3 (Production)
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
