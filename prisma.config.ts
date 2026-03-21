import "dotenv/config";
import { defineConfig, env } from "prisma/config";

function resolveDatasourceConfig() {
  // `prisma generate` does not need a live datasource URL, but migration and
  // introspection commands still do.
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  return {
    url: env("DATABASE_URL"),
  };
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: resolveDatasourceConfig(),
});
