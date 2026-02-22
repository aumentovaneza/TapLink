import type { Role } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: "Unauthorized" });
  }
}

export function requireRole(role: Role) {
  return async function ensureRole(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await requireAuth(request, reply);
    if (reply.sent) {
      return;
    }

    if (request.user.role !== role) {
      reply.status(403).send({ error: "Forbidden" });
    }
  };
}
