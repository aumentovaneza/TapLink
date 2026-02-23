import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function normalizeDatabaseUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "postgresql:" || url.protocol === "postgres:") {
      // Prevent prepared statement collisions when using transaction poolers (e.g. PgBouncer).
      if (url.searchParams.get("pgbouncer") !== "true") {
        url.searchParams.set("pgbouncer", "true");
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const rawDatabaseUrl = process.env.DATABASE_URL;
const usePgBouncerCompat = process.env.PRISMA_PGBOUNCER_COMPAT !== "false";
const databaseUrl = rawDatabaseUrl && usePgBouncerCompat ? normalizeDatabaseUrl(rawDatabaseUrl) : rawDatabaseUrl;

const prismaClientOptions = databaseUrl
  ? {
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    }
  : undefined;

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
