export type SecurityHeader = {
  key: string;
  value: string;
};

export type SecurityHeadersEnv = {
  isDevelopment: boolean;
  isProduction: boolean;
};

const joinDirective = (name: string, values: string[]) =>
  `${name} ${values.join(" ")}`;

export function buildCsp(env: SecurityHeadersEnv): string {
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  const imgSrc = ["'self'", "data:", "blob:", "https:"];
  const connectSrc = ["'self'", "https:"];

  if (env.isDevelopment) {
    scriptSrc.push("'unsafe-eval'");
    imgSrc.push("http:");
    connectSrc.push("http:", "ws:", "wss:");
  }

  return [
    joinDirective("default-src", ["'self'"]),
    joinDirective("base-uri", ["'self'"]),
    joinDirective("form-action", ["'self'"]),
    joinDirective("frame-ancestors", ["'none'"]),
    joinDirective("object-src", ["'none'"]),
    joinDirective("script-src", scriptSrc),
    joinDirective("style-src", ["'self'", "'unsafe-inline'"]),
    joinDirective("img-src", imgSrc),
    joinDirective("font-src", ["'self'", "data:"]),
    joinDirective("connect-src", connectSrc),
  ].join("; ");
}

export function buildSecurityHeaders(
  env: SecurityHeadersEnv
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    {
      key: "Content-Security-Policy",
      value: buildCsp(env),
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
  ];

  if (env.isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}
