import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify, { type FastifyInstance } from "fastify";

import type { AppConfig } from "./lib/config";
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { analyticsRoutes } from "./routes/analytics";
import { eventRoutes } from "./routes/events";
import { profileRoutes } from "./routes/profiles";
import { tagRoutes } from "./routes/tags";

function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  const allowedOrigins = parseCorsOrigins(config.CORS_ORIGIN);

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"), false);
    },
  });

  await app.register(jwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  });

  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(tagRoutes);
  await app.register(profileRoutes, { prefix: "/profiles" });
  await app.register(eventRoutes, { prefix: "/events" });
  await app.register(analyticsRoutes, { prefix: "/analytics" });
  await app.register(adminRoutes, { prefix: "/admin" });

  return app;
}
