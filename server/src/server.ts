import { buildApp } from "./app";
import { loadConfig } from "./lib/config";
import { prisma } from "./lib/prisma";

async function start(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  const shutdown = async () => {
    app.log.info("Shutting down server...");
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });
  } catch (error) {
    app.log.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void start();
