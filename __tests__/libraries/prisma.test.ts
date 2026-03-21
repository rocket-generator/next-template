jest.mock("@prisma/adapter-pg", () => ({
  __esModule: true,
  PrismaPg: jest.fn(),
}));

jest.mock("../../src/generated/prisma/client", () => ({
  __esModule: true,
  PrismaClient: jest.fn(),
}));

type PrismaPgModule = {
  PrismaPg: jest.Mock;
};

type GeneratedPrismaModule = {
  PrismaClient: jest.Mock;
};

const getPrismaPgMock = () =>
  (jest.requireMock("@prisma/adapter-pg") as PrismaPgModule).PrismaPg;

const getPrismaClientMock = () =>
  (jest.requireMock("../../src/generated/prisma/client") as GeneratedPrismaModule)
    .PrismaClient;

const loadPrismaModule = () =>
  require("@/libraries/prisma") as typeof import("@/libraries/prisma");

describe("prisma library", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.DATABASE_URL = "postgres://localhost:5432/template";
    (process.env as Record<string, string | undefined>).NODE_ENV =
      "development";

    delete (
      globalThis as typeof globalThis & {
        prisma?: unknown;
      }
    ).prisma;

    getPrismaPgMock().mockImplementation((options: { connectionString: string }) => ({
      type: "adapter",
      options,
    }));

    getPrismaClientMock().mockImplementation(
      ({ adapter }: { adapter: unknown }) => ({
        adapter,
        marker: "prisma-client",
        getMarker() {
          return this.marker;
        },
        user: {
          findUnique: jest.fn(),
        },
      })
    );
  });

  it("DATABASE_URL 未設定時に明示的なエラーを投げる", () => {
    delete process.env.DATABASE_URL;

    const { createPrismaClient } = loadPrismaModule();

    expect(() => createPrismaClient()).toThrow(
      "Missing DATABASE_URL. Please set DATABASE_URL before initializing Prisma Client."
    );
  });

  it("createPrismaClient が PrismaPg adapter で PrismaClient を初期化する", () => {
    const { createPrismaClient } = loadPrismaModule();
    const client = createPrismaClient("postgres://example.com:5432/app");

    expect(getPrismaPgMock()).toHaveBeenCalledWith({
      connectionString: "postgres://example.com:5432/app",
    });
    expect(getPrismaClientMock()).toHaveBeenCalledWith({
      adapter: {
        type: "adapter",
        options: {
          connectionString: "postgres://example.com:5432/app",
        },
      },
    });
    expect(client).toEqual(
      expect.objectContaining({
        marker: "prisma-client",
      })
    );
  });

  it("getPrismaClient が開発時 singleton を再利用する", () => {
    const { getPrismaClient } = loadPrismaModule();

    const first = getPrismaClient();
    const second = getPrismaClient();

    expect(first).toBe(second);
    expect(getPrismaClientMock()).toHaveBeenCalledTimes(1);
  });

  it("prisma proxy が関数を client に bind して返す", () => {
    const { prisma } = loadPrismaModule();
    const proxiedPrisma = prisma as unknown as {
      getMarker: () => string;
    };

    const getMarker = proxiedPrisma.getMarker;

    expect(getMarker()).toBe("prisma-client");
  });
});
