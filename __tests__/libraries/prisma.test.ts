jest.mock("@prisma/adapter-pg", () => ({
  __esModule: true,
  PrismaPg: jest.fn(),
}));

jest.mock("../../src/generated/prisma/client", () => ({
  __esModule: true,
  PrismaClient: jest.fn(),
}));

jest.mock("node:fs", () => ({
  __esModule: true,
  readFileSync: jest.fn(),
}));

type PrismaPgModule = {
  PrismaPg: jest.Mock;
};

type GeneratedPrismaModule = {
  PrismaClient: jest.Mock;
};

type FsModule = {
  readFileSync: jest.Mock;
};

const getPrismaPgMock = () =>
  (jest.requireMock("@prisma/adapter-pg") as PrismaPgModule).PrismaPg;

const getPrismaClientMock = () =>
  (jest.requireMock("../../src/generated/prisma/client") as GeneratedPrismaModule)
    .PrismaClient;

const getReadFileSyncMock = () =>
  (jest.requireMock("node:fs") as FsModule).readFileSync;

const loadPrismaModule = () =>
  require("@/libraries/prisma") as typeof import("@/libraries/prisma");

describe("prisma library", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.DATABASE_URL = "postgres://localhost:5432/template";
    (process.env as Record<string, string | undefined>).NODE_ENV =
      "development";
    delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
    delete process.env.DATABASE_SSL_CA_PATH;
    delete process.env.DATABASE_SSL_CA;

    delete (
      globalThis as typeof globalThis & {
        prisma?: unknown;
      }
    ).prisma;

    getPrismaPgMock().mockImplementation(
      (options: { connectionString: string; ssl?: unknown }) => ({
        type: "adapter",
        options,
      })
    );

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

  describe("SSL 設定", () => {
    it("sslmode=require のとき rejectUnauthorized:true で TLS を有効化する", () => {
      const { createPrismaClient } = loadPrismaModule();

      createPrismaClient("postgres://example.com:5432/app?sslmode=require");

      expect(getPrismaPgMock()).toHaveBeenCalledWith({
        connectionString: "postgres://example.com:5432/app",
        ssl: { rejectUnauthorized: true },
      });
    });

    it("DATABASE_SSL_REJECT_UNAUTHORIZED=false で rejectUnauthorized を false に上書きする", () => {
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = "false";
      const { createPrismaClient } = loadPrismaModule();

      createPrismaClient("postgres://example.com:5432/app?sslmode=require");

      expect(getPrismaPgMock()).toHaveBeenCalledWith({
        connectionString: "postgres://example.com:5432/app",
        ssl: { rejectUnauthorized: false },
      });
    });

    it("should reject invalid DATABASE_SSL_REJECT_UNAUTHORIZED values", () => {
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = "False";
      const { createPrismaClient } = loadPrismaModule();

      expect(() =>
        createPrismaClient("postgres://example.com:5432/app?sslmode=require")
      ).toThrow(
        'Invalid boolean environment variable DATABASE_SSL_REJECT_UNAUTHORIZED: expected "true" or "false"'
      );
    });

    it("sslmode=disable のとき ssl:false を設定する", () => {
      const { createPrismaClient } = loadPrismaModule();

      createPrismaClient("postgres://example.com:5432/app?sslmode=disable");

      expect(getPrismaPgMock()).toHaveBeenCalledWith({
        connectionString: "postgres://example.com:5432/app",
        ssl: false,
      });
    });

    it("sslmode=prefer はサポート外として明示的エラーを投げる", () => {
      const { createPrismaClient } = loadPrismaModule();

      expect(() =>
        createPrismaClient("postgres://example.com:5432/app?sslmode=prefer")
      ).toThrow(
        'Unsupported sslmode "prefer". Supported values are "disable" and "require".'
      );
    });

    it("未知の sslmode はサポート外として明示的エラーを投げる", () => {
      const { createPrismaClient } = loadPrismaModule();

      expect(() =>
        createPrismaClient(
          "postgres://example.com:5432/app?sslmode=accept_invalid_certs"
        )
      ).toThrow(
        'Unsupported sslmode "accept_invalid_certs". Supported values are "disable" and "require".'
      );
    });

    it("DATABASE_SSL_CA_PATH が指定されると ca にファイル内容が渡る", () => {
      process.env.DATABASE_SSL_CA_PATH = "/etc/ssl/rds-ca.pem";
      getReadFileSyncMock().mockReturnValue("CA_CONTENT");
      const { createPrismaClient } = loadPrismaModule();

      createPrismaClient("postgres://example.com:5432/app?sslmode=require");

      expect(getReadFileSyncMock()).toHaveBeenCalledWith(
        "/etc/ssl/rds-ca.pem",
        "utf8"
      );
      expect(getPrismaPgMock()).toHaveBeenCalledWith({
        connectionString: "postgres://example.com:5432/app",
        ssl: { rejectUnauthorized: true, ca: "CA_CONTENT" },
      });
    });

    it("sslmode が URL から剥がれてから PrismaPg へ渡る", () => {
      const { createPrismaClient } = loadPrismaModule();

      createPrismaClient(
        "postgres://example.com:5432/app?sslmode=require&application_name=test"
      );

      expect(getPrismaPgMock()).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString:
            "postgres://example.com:5432/app?application_name=test",
        })
      );
    });

    it("sslmode が無ければ ssl オプションを渡さない（ローカル開発互換）", () => {
      const { createPrismaClient } = loadPrismaModule();

      createPrismaClient("postgres://localhost:5432/app");

      expect(getPrismaPgMock()).toHaveBeenCalledWith({
        connectionString: "postgres://localhost:5432/app",
      });
    });

    it("DATABASE_SSL_CA（本文インライン）が渡ると ca に設定される", () => {
      process.env.DATABASE_SSL_CA =
        "-----BEGIN CERTIFICATE-----\nINLINE_PEM\n-----END CERTIFICATE-----";
      const { createPrismaClient } = loadPrismaModule();

      createPrismaClient("postgres://example.com:5432/app?sslmode=require");

      expect(getPrismaPgMock()).toHaveBeenCalledWith({
        connectionString: "postgres://example.com:5432/app",
        ssl: {
          rejectUnauthorized: true,
          ca: "-----BEGIN CERTIFICATE-----\nINLINE_PEM\n-----END CERTIFICATE-----",
        },
      });
      expect(getReadFileSyncMock()).not.toHaveBeenCalled();
    });

    it("DATABASE_SSL_CA の \\n エスケープは実改行に戻される", () => {
      process.env.DATABASE_SSL_CA =
        "-----BEGIN CERTIFICATE-----\\nESCAPED_PEM\\n-----END CERTIFICATE-----";
      const { createPrismaClient } = loadPrismaModule();

      createPrismaClient("postgres://example.com:5432/app?sslmode=require");

      expect(getPrismaPgMock()).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: expect.objectContaining({
            ca: "-----BEGIN CERTIFICATE-----\nESCAPED_PEM\n-----END CERTIFICATE-----",
          }),
        })
      );
    });

    it("DATABASE_SSL_CA が DATABASE_SSL_CA_PATH より優先される", () => {
      process.env.DATABASE_SSL_CA = "INLINE_WINS";
      process.env.DATABASE_SSL_CA_PATH = "/etc/ssl/unused.pem";
      const { createPrismaClient } = loadPrismaModule();

      createPrismaClient("postgres://example.com:5432/app?sslmode=require");

      expect(getReadFileSyncMock()).not.toHaveBeenCalled();
      expect(getPrismaPgMock()).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: expect.objectContaining({ ca: "INLINE_WINS" }),
        })
      );
    });
  });
});
