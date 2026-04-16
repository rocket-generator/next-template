import type { NextConfig } from "next";

type RemotePattern = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number];

const DEFAULT_REMOTE_IMAGE_PATTERNS: RemotePattern[] = [
  {
    protocol: "http",
    hostname: "localstack",
    port: "4566",
    pathname: "/**",
  },
  {
    protocol: "http",
    hostname: "localhost",
    port: "4566",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "*.s3.amazonaws.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "*.s3.*.amazonaws.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "s3.amazonaws.com",
    pathname: "/**",
  },
];

const normalizeRemoteImagePathname = (pathname: string) => {
  if (!pathname || pathname === "/") {
    return "/**";
  }

  return `${pathname.replace(/\/+$/, "")}/**`;
};

const parseRemoteImageUrl = (value: string): RemotePattern => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `Invalid remote image URL "${value}". Expected an absolute http(s) URL.`
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(
      `Unsupported remote image URL protocol "${url.protocol}". Supported protocols are "http:" and "https:".`
    );
  }

  return {
    protocol: url.protocol.slice(0, -1) as "http" | "https",
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
    pathname: normalizeRemoteImagePathname(url.pathname),
  };
};

export function buildRemoteImagePatterns(
  extraRemoteImageUrls?: string
): RemotePattern[] {
  const extraPatterns = (extraRemoteImageUrls ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map(parseRemoteImageUrl);

  return [...DEFAULT_REMOTE_IMAGE_PATTERNS, ...extraPatterns];
}
