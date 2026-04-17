jest.mock("@/libraries/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/repositories/prisma_repository", () => ({
  ...jest.requireActual("@/repositories/prisma_repository"),
  getPrismaModel: jest.fn(() => ({
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  })),
}));

describe("UserRepository storage provider integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      STORAGE_PROVIDER: "s3-compatible",
      S3_COMPATIBLE_ENDPOINT: "https://storage.example.test",
      SYSTEM_AWS_S3_REGION: "auto",
      SYSTEM_AWS_ACCESS_KEY_ID: "compat-key",
      SYSTEM_AWS_SECRET_ACCESS_KEY: "compat-secret",
      SYSTEM_AWS_S3_BUCKET: "compat-bucket",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("s3-compatible 設定でも UserRepository を構築できる", () => {
    const { UserRepository } =
      require("@/repositories/user_repository") as typeof import("@/repositories/user_repository");

    expect(() => new UserRepository()).not.toThrow();
  });
});
