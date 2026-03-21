jest.mock("better-auth", () => ({
  __esModule: true,
  betterAuth: jest.fn(),
}));

jest.mock("better-auth/adapters/prisma", () => ({
  __esModule: true,
  prismaAdapter: jest.fn(),
}));

jest.mock("better-auth/next-js", () => ({
  __esModule: true,
  nextCookies: jest.fn(),
  toNextJsHandler: jest.fn(),
}));

jest.mock("next/headers", () => ({
  __esModule: true,
  headers: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock("@/libraries/email", () => ({
  __esModule: true,
  createEmailServiceInstance: jest.fn(() => ({
    sendPasswordResetEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
  })),
}));

jest.mock("@/libraries/hash", () => ({
  __esModule: true,
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.mock("@/libraries/prisma", () => ({
  __esModule: true,
  prisma: {},
}));

type BetterAuthModule = {
  betterAuth: jest.Mock;
};

type PrismaAdapterModule = {
  prismaAdapter: jest.Mock;
};

type BetterAuthNextJsModule = {
  nextCookies: jest.Mock;
  toNextJsHandler: jest.Mock;
};

type NextHeadersModule = {
  headers: jest.Mock;
};

type NextNavigationModule = {
  redirect: jest.Mock;
  notFound: jest.Mock;
};

const getBetterAuthMock = () =>
  (jest.requireMock("better-auth") as BetterAuthModule).betterAuth;

const getPrismaAdapterMock = () =>
  (jest.requireMock("better-auth/adapters/prisma") as PrismaAdapterModule)
    .prismaAdapter;

const getBetterAuthNextJsMocks = () =>
  jest.requireMock("better-auth/next-js") as BetterAuthNextJsModule;

const getHeadersMock = () =>
  (jest.requireMock("next/headers") as NextHeadersModule).headers;

const getNavigationMocks = () =>
  jest.requireMock("next/navigation") as NextNavigationModule;

const loadAuthModule = () =>
  require("@/libraries/auth") as typeof import("@/libraries/auth");

describe("auth helpers", () => {
  let mockGetSession: jest.Mock;
  let mockSignOut: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.BETTER_AUTH_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    delete process.env.AUTH_SECRET;
    delete process.env.BETTER_AUTH_BASE_URL;

    mockGetSession = jest.fn();
    mockSignOut = jest.fn();

    getBetterAuthMock().mockReturnValue({
      api: {
        getSession: mockGetSession,
        signOut: mockSignOut,
      },
    });

    getPrismaAdapterMock().mockReturnValue("prisma-adapter");

    const nextJsMocks = getBetterAuthNextJsMocks();
    nextJsMocks.nextCookies.mockReturnValue("next-cookies-plugin");
    nextJsMocks.toNextJsHandler.mockReturnValue({
      GET: jest.fn(),
      POST: jest.fn(),
    });

    getHeadersMock().mockResolvedValue(
      new Headers([["x-forwarded-host", "example.test"]])
    );

    const navigationMocks = getNavigationMocks();
    navigationMocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    navigationMocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  it("auth が Better Auth へ query を渡し、permissions を正規化する", async () => {
    const expiresAt = new Date("2026-03-22T08:30:00.000Z");
    mockGetSession.mockResolvedValue({
      user: {
        id: "user-1",
        email: "alice@example.com",
        name: "Alice",
        permissions: ["admin", 1, null, "editor"],
      },
      session: {
        expiresAt,
      },
    });

    const { auth } = loadAuthModule();
    const result = await auth({
      headers: new Headers({ cookie: "session=abc" }),
      disableCookieCache: true,
      disableRefresh: false,
    });

    expect(mockGetSession).toHaveBeenCalledTimes(1);

    const call = mockGetSession.mock.calls[0][0] as {
      headers: Headers;
      query: Record<string, boolean>;
    };

    expect(call.headers.get("cookie")).toBe("session=abc");
    expect(call.query).toEqual({
      disableCookieCache: true,
      disableRefresh: false,
    });

    expect(result).toEqual({
      user: {
        id: "user-1",
        email: "alice@example.com",
        name: "Alice",
        permissions: ["admin", "editor"],
      },
      expiresAt,
    });
  });

  it("auth がセッション未取得時に null を返す", async () => {
    mockGetSession.mockResolvedValue(null);

    const { auth } = loadAuthModule();
    const result = await auth({
      headers: new Headers({ accept: "application/json" }),
    });

    expect(result).toBeNull();
    expect(mockGetSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      query: undefined,
    });
  });

  it("requireAuthSession が未認証時に /signin へ redirect する", async () => {
    mockGetSession.mockResolvedValue(null);

    const { requireAuthSession } = loadAuthModule();

    await expect(requireAuthSession()).rejects.toThrow("NEXT_REDIRECT");

    expect(getNavigationMocks().redirect).toHaveBeenCalledWith("/signin");
    expect(mockGetSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      query: {
        disableRefresh: true,
      },
    });
  });

  it("requireAdminSession が admin 権限なしで notFound する", async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: "user-2",
        email: "editor@example.com",
        name: "Editor",
        permissions: ["editor"],
      },
      session: {
        expiresAt: new Date("2026-03-22T09:00:00.000Z"),
      },
    });

    const { requireAdminSession } = loadAuthModule();

    await expect(requireAdminSession()).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getNavigationMocks().notFound).toHaveBeenCalledTimes(1);
  });
});
