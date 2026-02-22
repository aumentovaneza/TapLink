import { randomBytes, createHash } from "node:crypto";

import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";

const PASSWORD_SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(fastify: FastifyInstance, user: Pick<User, "id" | "email" | "role">): string {
  return fastify.jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
}

export function generateApiKey(): string {
  return `tlk_live_${randomBytes(24).toString("hex")}`;
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomUppercaseCode(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return result;
}
