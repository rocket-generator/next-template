import { PrismaClient } from "../generated/prisma";

// Avoid multiple instances of Prisma Client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Edge Runtime環境では常に新しいインスタンスを作成
const isEdgeRuntime = typeof global === "undefined";

export const prisma = isEdgeRuntime
  ? new PrismaClient()
  : global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production" && !isEdgeRuntime) {
  global.prisma = prisma;
}
