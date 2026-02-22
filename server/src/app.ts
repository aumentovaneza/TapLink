import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify, { type FastifyInstance } from "fastify";
import type { IncomingMessage, ServerResponse } from "node:http";

import { loadConfig, type AppConfig } from "./lib/config";
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

function originMatchesPattern(origin: string, pattern: string): boolean {
  if (pattern === "*") {
    return true;
  }

  if (!pattern.startsWith("*.")) {
    return origin === pattern;
  }

  // Supports wildcard hosts, e.g. "*.vercel.app".
  try {
    const originUrl = new URL(origin);
    const suffix = pattern.slice(1); // ".vercel.app"
    return originUrl.hostname.endsWith(suffix);
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.length === 0) {
    return true;
  }

  return allowedOrigins.some((pattern) => originMatchesPattern(origin, pattern));
}

export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  const allowedOrigins = parseCorsOrigins(config.CORS_ORIGIN);

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin, allowedOrigins)) {
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

let vercelAppPromise: Promise<FastifyInstance> | null = null;

async function getVercelApp(): Promise<FastifyInstance> {
  if (!vercelAppPromise) {
    vercelAppPromise = (async () => {
      const config = loadConfig();
      const app = await buildApp(config);
      await app.ready();
      return app;
    })();
  }

  return vercelAppPromise;
}

// Vercel Node.js runtime entrypoint.
export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    const app = await getVercelApp();
    app.server.emit("request", request, response);
  } catch (error) {
    response.statusCode = 500;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({
        error: "Failed to initialize API",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    );
  }
}
