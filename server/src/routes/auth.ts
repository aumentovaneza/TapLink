import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { hashPassword, signAccessToken, verifyPassword } from "../lib/auth";
import { requireAuth } from "../lib/guards";
import { prisma } from "../lib/prisma";

const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

const signinSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

function sanitizeUser(user: { id: string; name: string; email: string; role: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/signup", async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: "An account with this email already exists" });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    const accessToken = signAccessToken(fastify, user);

    return reply.status(201).send({
      user: sanitizeUser(user),
      accessToken,
    });
  });

  fastify.post("/signin", async (request, reply) => {
    const parsed = signinSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const accessToken = signAccessToken(fastify, user);

    return reply.send({
      user: sanitizeUser(user),
      accessToken,
    });
  });

  fastify.get("/me", { preHandler: [requireAuth] }, async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    return reply.send({ user: sanitizeUser(user) });
  });
}
