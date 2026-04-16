import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { buildRemoteImagePatterns } from "./src/libraries/remote-image-patterns";
import { buildSecurityHeaders } from "./src/libraries/security-headers";

const withNextIntl = createNextIntlPlugin();
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  outputFileTracingIncludes: {
    // Keep bundled DB CA files in the server output for path-based TLS config.
    "*": ["./certs/**/*"],
  },
  transpilePackages: [
    '@aws-sdk/client-s3',
    '@aws-sdk/client-ses',
    '@aws-sdk/s3-request-presigner',
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders({
          isDevelopment,
          isProduction,
        }),
      },
    ];
  },
  images: {
    remotePatterns: buildRemoteImagePatterns(
      process.env.EXTRA_REMOTE_IMAGE_URLS
    ),
  },
};

export default withNextIntl(nextConfig);
