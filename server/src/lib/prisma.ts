import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const REQUIRED_DELEGATES = ["user", "tag", "profile", "order"] as const;

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

function hasRequiredDelegates(client: PrismaClient): boolean {
  const record = client as unknown as Record<string, unknown>;
  return REQUIRED_DELEGATES.every((delegate) => typeof record[delegate] !== "undefined");
}

const cachedClient = globalForPrisma.prisma;
const shouldReuseCached = cachedClient ? hasRequiredDelegates(cachedClient) : false;

if (cachedClient && !shouldReuseCached) {
  // A stale client (e.g. before a schema change) can be missing delegates like `order`.
  void cachedClient.$disconnect().catch(() => {});
}

export const prisma = shouldReuseCached && cachedClient ? cachedClient : new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
