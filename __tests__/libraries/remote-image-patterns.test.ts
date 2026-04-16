import { buildRemoteImagePatterns } from "@/libraries/remote-image-patterns";

describe("remote image patterns", () => {
  it("既定パターンに LocalStack と AWS S3 を含む", () => {
    const patterns = buildRemoteImagePatterns();

    expect(patterns).toEqual(
      expect.arrayContaining([
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
      ])
    );
  });

  it("絶対 URL を protocol / hostname / port / pathname に分解する", () => {
    const patterns = buildRemoteImagePatterns(
      [
        "https://cdn.example.com",
        "https://images.example.com/account123/",
        "http://localhost:9000/my-bucket/",
      ].join(",")
    );

    expect(patterns).toEqual(
      expect.arrayContaining([
        {
          protocol: "https",
          hostname: "cdn.example.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "images.example.com",
          pathname: "/account123/**",
        },
        {
          protocol: "http",
          hostname: "localhost",
          port: "9000",
          pathname: "/my-bucket/**",
        },
      ])
    );
  });

  it("空の CSV 要素は無視する", () => {
    const patterns = buildRemoteImagePatterns(
      "https://cdn.example.com, ,https://images.example.com/account123/"
    );

    const customPatterns = patterns.filter(
      (pattern) =>
        pattern.hostname === "cdn.example.com" ||
        pattern.hostname === "images.example.com"
    );

    expect(customPatterns).toHaveLength(2);
  });

  it("http/https 以外の scheme は明示的エラーにする", () => {
    expect(() => buildRemoteImagePatterns("ftp://example.com/assets")).toThrow(
      'Unsupported remote image URL protocol "ftp:". Supported protocols are "http:" and "https:".'
    );
  });

  it("不正 URL は明示的エラーにする", () => {
    expect(() => buildRemoteImagePatterns("not-a-url")).toThrow(
      'Invalid remote image URL "not-a-url". Expected an absolute http(s) URL.'
    );
  });
});
