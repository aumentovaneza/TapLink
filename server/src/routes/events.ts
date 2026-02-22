import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../lib/prisma";

const tapEventSchema = z.object({
  tagId: z.string().trim().min(1),
  scanMethod: z.enum(["NFC", "QR"]).default("NFC"),
  device: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  referrer: z.string().trim().max(200).optional(),
});

const linkClickSchema = z.object({
  profileId: z.string().trim().min(1),
  linkId: z.string().trim().optional(),
  linkLabel: z.string().trim().max(120).optional(),
});

const petReportSchema = z
  .object({
    profileId: z.string().trim().min(1),
    reporterName: z.string().trim().min(1).max(120),
    reporterEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
    reporterPhone: z.string().trim().max(40).optional().or(z.literal("")),
    location: z.string().trim().max(160).optional().or(z.literal("")),
    message: z.string().trim().min(1).max(1200),
  })
  .superRefine((value, ctx) => {
    if (!value.reporterEmail && !value.reporterPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reporterEmail"],
        message: "Email or phone is required",
      });
    }
  });

function isPetMarkedLost(fields: unknown): boolean {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    return false;
  }

  const value = (fields as Record<string, unknown>).isLost;
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "lost";
  }
  return false;
}

export async function eventRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/tap", async (request, reply) => {
    const parsed = tapEventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const tag = await prisma.tag.findFirst({
      where: {
        OR: [{ id: parsed.data.tagId }, { code: parsed.data.tagId }],
      },
      include: {
        profile: true,
      },
    });

    if (!tag) {
      return reply.status(404).send({ error: "Tag not found" });
    }

    const occurredAt = new Date();

    await prisma.$transaction([
      prisma.tapEvent.create({
        data: {
          tagId: tag.id,
          profileId: tag.profileId,
          scanMethod: parsed.data.scanMethod,
          device: parsed.data.device,
          city: parsed.data.city,
          country: parsed.data.country,
          referrer: parsed.data.referrer,
          occurredAt,
        },
      }),
      prisma.tag.update({
        where: { id: tag.id },
        data: {
          taps: {
            increment: 1,
          },
          lastTapAt: occurredAt,
        },
      }),
    ]);

    return reply.status(201).send({ ok: true });
  });

  fastify.post("/link-click", async (request, reply) => {
    const parsed = linkClickSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const profile = await prisma.profile.findUnique({ where: { id: parsed.data.profileId } });

    if (!profile) {
      return reply.status(404).send({ error: "Profile not found" });
    }

    await prisma.linkClickEvent.create({
      data: {
        profileId: parsed.data.profileId,
        linkId: parsed.data.linkId,
        linkLabel: parsed.data.linkLabel,
      },
    });

    return reply.status(201).send({ ok: true });
  });

  fastify.post("/pet-report", async (request, reply) => {
    const parsed = petReportSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: parsed.data.profileId },
    });

    if (!profile) {
      return reply.status(404).send({ error: "Profile not found" });
    }

    if (profile.templateType !== "pet") {
      return reply.status(400).send({ error: "This profile is not a pet profile" });
    }

    if (!isPetMarkedLost(profile.fields)) {
      return reply.status(409).send({ error: "Pet is not marked as lost" });
    }

    const fields = (profile.fields ?? {}) as Record<string, string>;

    await prisma.auditLog.create({
      data: {
        action: "pet.report_submitted",
        entityType: "profile",
        entityId: profile.id,
        metadata: {
          profileId: profile.id,
          profileSlug: profile.slug,
          petName: fields.name ?? profile.slug,
          ownerId: profile.ownerId,
          reporterName: parsed.data.reporterName,
          reporterEmail: parsed.data.reporterEmail || null,
          reporterPhone: parsed.data.reporterPhone || null,
          location: parsed.data.location || null,
          message: parsed.data.message,
        },
      },
    });

    return reply.status(201).send({ ok: true });
  });
}
