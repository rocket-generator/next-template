jest.mock("better-auth/cookies", () => ({
  __esModule: true,
  getSessionCookie: jest.fn(),
}));

jest.mock("next/server", () => ({
  __esModule: true,
  NextResponse: {
    redirect: jest.fn((url: URL) => ({
      type: "redirect",
      url,
    })),
    next: jest.fn(() => ({
      type: "next",
    })),
  },
}));

import { proxy } from "@/proxy";

type BetterAuthCookiesModule = {
  getSessionCookie: jest.Mock;
};

type NextServerModule = {
  NextResponse: {
    redirect: jest.Mock;
    next: jest.Mock;
  };
};

const getSessionCookieMock = () =>
  (jest.requireMock("better-auth/cookies") as BetterAuthCookiesModule)
    .getSessionCookie;

const getNextResponseMocks = () =>
  (jest.requireMock("next/server") as NextServerModule).NextResponse;

const createRequest = (pathname: string) =>
  ({
    nextUrl: {
      pathname,
    },
    url: `http://localhost:3000${pathname}`,
  }) as Parameters<typeof proxy>[0];

describe("proxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("public path はセッション cookie がなくても通過させる", () => {
    getSessionCookieMock().mockReturnValue(null);

    const response = proxy(createRequest("/verify-email"));

    expect(getNextResponseMocks().next).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      type: "next",
    });
  });

  it("private path で cookie がなければ /signin へ redirect する", () => {
    getSessionCookieMock().mockReturnValue(null);

    const response = proxy(createRequest("/dashboard"));

    expect(getNextResponseMocks().redirect).toHaveBeenCalledTimes(1);

    const redirectUrl = getNextResponseMocks().redirect.mock.calls[0][0] as URL;
    expect(redirectUrl.pathname).toBe("/signin");
    expect(redirectUrl.searchParams.get("callback_url")).toBe(
      "http://localhost:3000/dashboard"
    );
    expect(response).toEqual({
      type: "redirect",
      url: redirectUrl,
    });
  });

  it("private path でも cookie があれば通過させる", () => {
    getSessionCookieMock().mockReturnValue("session-cookie");

    const response = proxy(createRequest("/dashboard"));

    expect(getNextResponseMocks().next).toHaveBeenCalledTimes(1);
    expect(getNextResponseMocks().redirect).not.toHaveBeenCalled();
    expect(response).toEqual({
      type: "next",
    });
  });
});
