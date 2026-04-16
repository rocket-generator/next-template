import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

type SslObject = { rejectUnauthorized: boolean; ca?: string };
type SslOption = false | SslObject | undefined;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL. Please set DATABASE_URL before initializing Prisma Client."
    );
  }

  return databaseUrl;
}

function resolveSslCa(): string | undefined {
  // Inline PEM (preferred on serverless: Amplify / Vercel / Cloudflare).
  // Accepts either real newlines or escaped \n (env UIs often mangle them).
  const inline = process.env.DATABASE_SSL_CA;
  if (inline) {
    return inline.includes("\\n") ? inline.replace(/\\n/g, "\n") : inline;
  }

  const caPath = process.env.DATABASE_SSL_CA_PATH;
  if (caPath) {
    return readFileSync(caPath, "utf8");
  }

  return undefined;
}

function resolveSslOption(sslMode: string | null): SslOption {
  if (sslMode === null) {
    return undefined;
  }
  if (sslMode === "disable") {
    return false;
  }

  const ssl: SslObject = {
    rejectUnauthorized:
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
  };

  const ca = resolveSslCa();
  if (ca) {
    ssl.ca = ca;
  }

  return ssl;
}

export function createPrismaClient(
  connectionString: string = getDatabaseUrl()
): PrismaClient {
  // pg driver interprets sslmode=verify-full on the URL strictly and
  // fails on managed services like RDS, so strip sslmode and drive TLS
  // via the ssl option instead.
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  const cleanedUrl = url.toString();

  const ssl = resolveSslOption(sslMode);
  const adapterOptions =
    ssl === undefined
      ? { connectionString: cleanedUrl }
      : { connectionString: cleanedUrl, ssl };

  const adapter = new PrismaPg(adapterOptions);

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
