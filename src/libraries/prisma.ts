import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL. Please set DATABASE_URL before initializing Prisma Client."
    );
  }

  return databaseUrl;
}

export function createPrismaClient(
  connectionString: string = getDatabaseUrl()
): PrismaClient {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  // pg driver の sslmode 解釈が verify-full 扱いになり RDS 等で失敗するため、
  // URL からは除去し ssl オプションで直接制御
  url.searchParams.delete("sslmode");
  const cleanedUrl = url.toString();

  const adapter = new PrismaPg(
    sslMode
      ? { connectionString: cleanedUrl, ssl: { rejectUnauthorized: false } }
      : { connectionString: cleanedUrl }
  );

  return new PrismaClient({ adapter });
}

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

let prismaClient: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  const client = globalForPrisma.prisma ?? createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  prismaClient = client;
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = client[property as keyof PrismaClient];

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});
