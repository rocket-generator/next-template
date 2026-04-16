import {
  buildCsp,
  buildSecurityHeaders,
} from "@/libraries/security-headers";

describe("security headers", () => {
  describe("buildCsp", () => {
    it("development では unsafe-eval と http/ws 接続を許可する", () => {
      const csp = buildCsp({
        isDevelopment: true,
        isProduction: false,
      });

      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
      expect(csp).toContain("img-src 'self' data: blob: https: http:");
      expect(csp).toContain("connect-src 'self' https: http: ws: wss:");
    });

    it("production では unsafe-eval と汎用 http/ws を許可しない", () => {
      const csp = buildCsp({
        isDevelopment: false,
        isProduction: true,
      });

      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).not.toContain("http:");
      expect(csp).not.toContain(" ws:");
      expect(csp).not.toContain(" wss:");
    });

    it("共通の制約ディレクティブを含む", () => {
      const csp = buildCsp({
        isDevelopment: false,
        isProduction: true,
      });

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
    });
  });

  describe("buildSecurityHeaders", () => {
    it("production では HSTS を含む", () => {
      const headers = buildSecurityHeaders({
        isDevelopment: false,
        isProduction: true,
      });

      expect(headers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          }),
        ])
      );
    });

    it("development では HSTS を含まない", () => {
      const headers = buildSecurityHeaders({
        isDevelopment: true,
        isProduction: false,
      });

      expect(headers).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "Strict-Transport-Security",
          }),
        ])
      );
    });

    it("必須のヘッダを揃える", () => {
      const headers = buildSecurityHeaders({
        isDevelopment: false,
        isProduction: true,
      });

      expect(headers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "Content-Security-Policy" }),
          expect.objectContaining({
            key: "X-Content-Type-Options",
            value: "nosniff",
          }),
          expect.objectContaining({
            key: "X-Frame-Options",
            value: "DENY",
          }),
          expect.objectContaining({
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          }),
          expect.objectContaining({
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          }),
        ])
      );
    });
  });
});
