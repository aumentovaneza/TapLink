import type { TagStatus } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { randomUppercaseCode } from "../lib/auth";
import { requireAuth } from "../lib/guards";
import { prisma } from "../lib/prisma";
import { getTemplateDefaults, normalizeTemplateType } from "../lib/template-defaults";

const claimTagSchema = z.object({
  claimCode: z.string().trim().min(4).max(12).transform((value) => value.toUpperCase()),
  templateType: z.string().trim().min(1).default("individual"),
});

const verifyClaimSchema = z.object({
  claimCode: z.string().trim().min(4).max(12).transform((value) => value.toUpperCase()),
});

const updateStatusSchema = z.object({
  status: z.enum(["active", "inactive", "unclaimed"]),
});

const scanParamsSchema = z.object({
  tagId: z.string().trim().min(1),
});

const tagParamsSchema = z.object({
  tagId: z.string().trim().min(1),
});

const themeGradients: Record<string, string> = {
  wave: "linear-gradient(135deg, #4F46E5, #7C3AED, #06B6D4)",
  sunset: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
  ocean: "linear-gradient(135deg, #0ea5e9, #2563eb)",
  forest: "linear-gradient(135deg, #065f46, #059669)",
  "dark-pro": "linear-gradient(135deg, #0f0c29, #302b63)",
  rose: "linear-gradient(135deg, #fda4af, #e11d48)",
  minimal: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
};

function toClientStatus(status: TagStatus): "active" | "inactive" | "unclaimed" {
  if (status === "ACTIVE") {
    return "active";
  }
  if (status === "INACTIVE") {
    return "inactive";
  }
  return "unclaimed";
}

function fromClientStatus(status: "active" | "inactive" | "unclaimed"): TagStatus {
  if (status === "active") {
    return "ACTIVE";
  }
  if (status === "inactive") {
    return "INACTIVE";
  }
  return "UNCLAIMED";
}

function relativeLastTap(lastTapAt: Date | null): string {
  if (!lastTapAt) {
    return "Never";
  }

  const diffMs = Date.now() - lastTapAt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function buildProfileSubtitle(templateType: string, fields: Record<string, string>): string {
  if (templateType === "individual") {
    return [fields.title, fields.company].filter(Boolean).join(" · ");
  }

  if (templateType === "business") {
    return [fields.category, fields.tagline].filter(Boolean).join(" · ");
  }

  if (templateType === "pet") {
    return [fields.species, fields.breed].filter(Boolean).join(" · ");
  }

  if (templateType === "cafe") {
    return [fields.cuisine, fields.tagline].filter(Boolean).join(" · ");
  }

  if (templateType === "event") {
    return [fields.type, fields.date].filter(Boolean).join(" · ");
  }

  return fields.bio ?? "";
}

interface TagResponseStats {
  total: number;
  unread: number;
}

function metadataAsRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function metadataString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function buildResponseStatsByProfileId(profileIds: string[], viewerId: string): Promise<Map<string, TagResponseStats>> {
  const uniqueProfileIds = Array.from(new Set(profileIds.filter(Boolean)));
  const statsByProfileId = new Map<string, TagResponseStats>();
  for (const profileId of uniqueProfileIds) {
    statsByProfileId.set(profileId, { total: 0, unread: 0 });
  }

  if (uniqueProfileIds.length === 0) {
    return statsByProfileId;
  }

  const [reportLogs, viewedLogs] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        action: "pet.report_submitted",
        entityType: "profile",
        entityId: { in: uniqueProfileIds },
      },
      select: {
        entityId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: {
        action: "pet.responses_viewed",
        actorId: viewerId,
        entityType: "profile",
        entityId: { in: uniqueProfileIds },
      },
      select: {
        entityId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const latestViewedByProfileId = new Map<string, Date>();
  for (const viewedLog of viewedLogs) {
    if (!viewedLog.entityId || latestViewedByProfileId.has(viewedLog.entityId)) {
      continue;
    }
    latestViewedByProfileId.set(viewedLog.entityId, viewedLog.createdAt);
  }

  for (const reportLog of reportLogs) {
    if (!reportLog.entityId) {
      continue;
    }
    const current = statsByProfileId.get(reportLog.entityId) ?? { total: 0, unread: 0 };
    current.total += 1;

    const viewedAt = latestViewedByProfileId.get(reportLog.entityId);
    if (!viewedAt || reportLog.createdAt > viewedAt) {
      current.unread += 1;
    }

    statsByProfileId.set(reportLog.entityId, current);
  }

  return statsByProfileId;
}

function serializeTag(tag: any, responseStats?: TagResponseStats) {
  const fields = (tag.profile?.fields ?? {}) as Record<string, string>;
  const templateType = tag.profile?.templateType ?? "individual";

  return {
    id: tag.id,
    tagCode: tag.code,
    claimCode: tag.claimCode,
    uid: tag.uid,
    status: toClientStatus(tag.status),
    taps: tag.taps,
    lastTap: relativeLastTap(tag.lastTapAt),
    createdAt: tag.createdAt,
    profileId: tag.profileId,
    responseCount: responseStats?.total ?? 0,
    unreadResponses: responseStats?.unread ?? 0,
    profile: tag.profile
      ? {
          id: tag.profile.id,
          slug: tag.profile.slug,
          name: fields.name ?? tag.profile.slug,
          title: buildProfileSubtitle(templateType, fields),
          templateType,
          theme: tag.profile.theme,
          photo: tag.profile.photoUrl,
          isPublished: tag.profile.isPublished,
        }
      : null,
  };
}

function createProfileSlug(templateType: string): string {
  return `${templateType}-${Date.now().toString(36)}-${randomUppercaseCode(4).toLowerCase()}`;
}

export async function tagRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/tags/mine", { preHandler: [requireAuth] }, async (request) => {
    const tags = await prisma.tag.findMany({
      where: { ownerId: request.user.sub },
      include: {
        profile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const responseStatsByProfileId = await buildResponseStatsByProfileId(
      tags
        .map((tag) => tag.profileId)
        .filter((profileId): profileId is string => Boolean(profileId)),
      request.user.sub
    );

    return {
      items: tags.map((tag) =>
        serializeTag(tag, tag.profileId ? responseStatsByProfileId.get(tag.profileId) : undefined)
      ),
    };
  });

  fastify.post("/tags/claim", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = claimTagSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const templateType = normalizeTemplateType(parsed.data.templateType);
    const defaults = getTemplateDefaults(templateType);

    const settings = await prisma.adminSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });

    const currentOwned = await prisma.tag.count({
      where: { ownerId: request.user.sub },
    });

    if (currentOwned >= settings.maxProfilesPerUser) {
      return reply.status(403).send({
        error: `Profile limit reached (${settings.maxProfilesPerUser})`,
      });
    }

    const existingTag = await prisma.tag.findUnique({
      where: { claimCode: parsed.data.claimCode },
    });

    if (!existingTag) {
      return reply.status(404).send({ error: "Claim code is invalid" });
    }

    if (existingTag.ownerId) {
      return reply.status(409).send({ error: "This tag has already been claimed" });
    }

    const updatedTag = await prisma.$transaction(async (tx) => {
      let profileId = existingTag.profileId;

      if (profileId) {
        const linkedProfile = await tx.profile.findUnique({
          where: { id: profileId },
          select: { id: true },
        });

        if (linkedProfile) {
          await tx.profile.update({
            where: { id: profileId },
            data: {
              ownerId: request.user.sub,
              templateType,
              theme: "wave",
              palette: "original",
              showGraphic: true,
              isPublished: false,
              photoUrl: null,
              fields: defaults.fields,
              links: {
                deleteMany: {},
                create: defaults.links.map((link, index) => ({
                  position: index,
                  type: link.type,
                  label: link.label,
                  url: link.url,
                })),
              },
            },
          });
        } else {
          profileId = null;
        }
      }

      if (!profileId) {
        const profile = await tx.profile.create({
          data: {
            slug: createProfileSlug(templateType),
            ownerId: request.user.sub,
            templateType,
            theme: "wave",
            palette: "original",
            showGraphic: true,
            isPublished: false,
            photoUrl: null,
            fields: defaults.fields,
            links: {
              create: defaults.links.map((link, index) => ({
                position: index,
                type: link.type,
                label: link.label,
                url: link.url,
              })),
            },
          },
          select: {
            id: true,
          },
        });
        profileId = profile.id;
      }

      return tx.tag.update({
        where: { id: existingTag.id },
        data: {
          ownerId: request.user.sub,
          profileId,
          status: "ACTIVE",
          claimCode: null,
        },
        include: {
          profile: true,
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: request.user.sub,
        action: "tag.claimed",
        entityType: "tag",
        entityId: updatedTag.id,
        metadata: {
          tagCode: updatedTag.code,
          profileId: updatedTag.profileId,
        },
      },
    });

    return reply.status(201).send({
      tag: serializeTag(updatedTag),
    });
  });

  fastify.post("/tags/verify-claim", async (request, reply) => {
    const parsed = verifyClaimSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const tag = await prisma.tag.findUnique({
      where: {
        claimCode: parsed.data.claimCode,
      },
      select: {
        id: true,
        code: true,
        claimCode: true,
        ownerId: true,
        status: true,
      },
    });

    if (!tag) {
      return reply.status(404).send({ error: "Claim code is invalid" });
    }

    if (tag.ownerId) {
      return reply.status(409).send({ error: "This tag has already been claimed" });
    }

    return reply.send({
      tag: {
        id: tag.id,
        tagCode: tag.code,
        claimCode: tag.claimCode,
        status: toClientStatus(tag.status),
      },
    });
  });

  fastify.patch<{ Params: { tagId: string } }>("/tags/:tagId/status", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = updateStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const tag = await prisma.tag.findUnique({
      where: { id: request.params.tagId },
      include: { profile: true },
    });

    if (!tag) {
      return reply.status(404).send({ error: "Tag not found" });
    }

    if (tag.ownerId !== request.user.sub && request.user.role !== "ADMIN") {
      return reply.status(403).send({ error: "You do not have access to this tag" });
    }

    const updated = await prisma.tag.update({
      where: { id: tag.id },
      data: {
        status: fromClientStatus(parsed.data.status),
      },
      include: {
        profile: true,
      },
    });

    const responseStatsByProfileId = await buildResponseStatsByProfileId(
      updated.profileId ? [updated.profileId] : [],
      request.user.sub
    );

    return reply.send({
      tag: serializeTag(updated, updated.profileId ? responseStatsByProfileId.get(updated.profileId) : undefined),
    });
  });

  fastify.delete<{ Params: { tagId: string } }>("/tags/:tagId", { preHandler: [requireAuth] }, async (request, reply) => {
    const tag = await prisma.tag.findUnique({
      where: { id: request.params.tagId },
      include: { profile: true },
    });

    if (!tag) {
      return reply.status(404).send({ error: "Tag not found" });
    }

    if (tag.ownerId !== request.user.sub && request.user.role !== "ADMIN") {
      return reply.status(403).send({ error: "You do not have access to this tag" });
    }

    await prisma.$transaction(async (tx) => {
      if (tag.profileId) {
        const profile = await tx.profile.findUnique({ where: { id: tag.profileId } });
        if (profile && profile.ownerId === tag.ownerId) {
          await tx.profile.delete({ where: { id: tag.profileId } });
        }
      }

      await tx.tag.update({
        where: { id: tag.id },
        data: {
          ownerId: null,
          profileId: null,
          status: "UNCLAIMED",
          claimCode: randomUppercaseCode(6),
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: request.user.sub,
        action: "tag.unassigned",
        entityType: "tag",
        entityId: tag.id,
      },
    });

    return reply.status(204).send();
  });

  fastify.get<{ Params: { tagId: string } }>("/tags/:tagId/responses", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsedParams = tagParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ error: "Invalid tag ID" });
    }

    const tag = await prisma.tag.findUnique({
      where: { id: parsedParams.data.tagId },
      include: { profile: true },
    });

    if (!tag) {
      return reply.status(404).send({ error: "Tag not found" });
    }

    if (tag.ownerId !== request.user.sub && request.user.role !== "ADMIN") {
      return reply.status(403).send({ error: "You do not have access to this tag" });
    }

    if (!tag.profileId) {
      return reply.send({
        tag: serializeTag(tag, { total: 0, unread: 0 }),
        responses: [],
        unreadCount: 0,
        lastViewedAt: null,
      });
    }

    const [reports, lastViewed] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          action: "pet.report_submitted",
          entityType: "profile",
          entityId: tag.profileId,
        },
        select: {
          id: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findFirst({
        where: {
          action: "pet.responses_viewed",
          actorId: request.user.sub,
          entityType: "profile",
          entityId: tag.profileId,
        },
        select: {
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const lastViewedAt = lastViewed?.createdAt ?? null;

    const serializedResponses = reports.map((entry) => {
      const metadata = metadataAsRecord(entry.metadata);
      return {
        id: entry.id,
        submittedAt: entry.createdAt,
        petName: metadataString(metadata.petName),
        reporterName: metadataString(metadata.reporterName) ?? "Anonymous",
        reporterEmail: metadataString(metadata.reporterEmail),
        reporterPhone: metadataString(metadata.reporterPhone),
        location: metadataString(metadata.location),
        message: metadataString(metadata.message) ?? "",
        isUnread: !lastViewedAt || entry.createdAt > lastViewedAt,
      };
    });

    const unreadCount = serializedResponses.reduce((total, response) => {
      return total + (response.isUnread ? 1 : 0);
    }, 0);

    return reply.send({
      tag: serializeTag(tag, { total: serializedResponses.length, unread: unreadCount }),
      responses: serializedResponses,
      unreadCount,
      lastViewedAt,
    });
  });

  fastify.post<{ Params: { tagId: string } }>(
    "/tags/:tagId/responses/read",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsedParams = tagParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid tag ID" });
      }

      const tag = await prisma.tag.findUnique({
        where: { id: parsedParams.data.tagId },
        select: {
          id: true,
          ownerId: true,
          profileId: true,
        },
      });

      if (!tag) {
        return reply.status(404).send({ error: "Tag not found" });
      }

      if (tag.ownerId !== request.user.sub && request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "You do not have access to this tag" });
      }

      if (!tag.profileId) {
        return reply.send({ ok: true, viewedAt: null });
      }

      const viewed = await prisma.auditLog.create({
        data: {
          actorId: request.user.sub,
          action: "pet.responses_viewed",
          entityType: "profile",
          entityId: tag.profileId,
          metadata: {
            tagId: tag.id,
          },
        },
        select: {
          createdAt: true,
        },
      });

      return reply.send({ ok: true, viewedAt: viewed.createdAt });
    }
  );

  fastify.get("/scan/:tagId", async (request, reply) => {
    const parsed = scanParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid tag ID" });
    }

    const { tagId } = parsed.data;

    const tag = await prisma.tag.findFirst({
      where: {
        OR: [
          { id: tagId },
          { code: tagId },
          { profile: { is: { id: tagId } } },
          { profile: { is: { slug: tagId } } },
        ],
      },
      include: {
        profile: true,
      },
    });

    if (!tag) {
      return reply.send({
        id: tagId,
        state: "error",
      });
    }

    const isUnlinked = tag.status === "UNCLAIMED" || !tag.ownerId || Boolean(tag.claimCode) || !tag.profile;
    if (isUnlinked) {
      return reply.send({
        id: tag.code,
        state: "unclaimed",
        claimCode: tag.claimCode,
      });
    }

    const profile = tag.profile;
    if (!profile) {
      return reply.send({
        id: tag.code,
        state: "unclaimed",
        claimCode: tag.claimCode,
      });
    }

    const fields = (profile.fields ?? {}) as Record<string, string>;

    if (tag.status === "INACTIVE") {
      return reply.send({
        id: tag.code,
        state: "inactive",
        profile: {
          id: profile.id,
          slug: profile.slug,
          name: fields.name ?? profile.slug,
          title: buildProfileSubtitle(profile.templateType, fields),
          photo: profile.photoUrl,
          gradient: themeGradients[profile.theme] ?? themeGradients.wave,
          tapCount: tag.taps,
          templateType: profile.templateType,
        },
      });
    }

    return reply.send({
      id: tag.code,
      state: "active",
      profile: {
        id: profile.id,
        slug: profile.slug,
        name: fields.name ?? profile.slug,
        title: buildProfileSubtitle(profile.templateType, fields),
        photo: profile.photoUrl,
        gradient: themeGradients[profile.theme] ?? themeGradients.wave,
        tapCount: tag.taps,
        templateType: profile.templateType,
      },
    });
  });
}
