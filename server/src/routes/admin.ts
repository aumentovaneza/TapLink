import type { Prisma, TagStatus } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { generateApiKey, hashValue, randomUppercaseCode } from "../lib/auth";
import { requireRole } from "../lib/guards";
import { hardwareColorCatalogSchema } from "../lib/hardware-options";
import {
  isValidPaymentQrStoragePath,
  PAYMENT_QR_STORAGE_PREFIX,
  paymentQrMethodIdSchema,
  paymentQrMethodListSchema,
  resolvePaymentQrMethodsFromConfig,
  withPaymentQrMethodsConfig,
  type PaymentQrMethod,
  type PaymentQrMethodId,
} from "../lib/payment-qrs";
import { prisma } from "../lib/prisma";
import { getTemplateDefaults } from "../lib/template-defaults";

const profileQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["all", "active", "inactive", "unclaimed"]).default("all"),
  type: z.string().trim().default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const tagQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["all", "active", "inactive", "unclaimed"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const tagParamsSchema = z.object({
  tagId: z.string().trim().min(1),
});

const generateTagsSchema = z.object({
  count: z.coerce.number().int().min(1).max(500),
  prefix: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .regex(/^[A-Za-z0-9-]+$/)
    .transform((value) => value.toUpperCase()),
});

const updateSettingsSchema = z.object({
  platformName: z.string().trim().min(1).max(120).optional(),
  supportEmail: z.string().trim().email().optional(),
  platformUrl: z.string().trim().url().optional(),
  maxProfilesPerUser: z.coerce.number().int().min(1).max(1000).optional(),
  maintenanceMode: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

const rotateApiKeySchema = z.object({
  name: z.string().trim().min(1).max(120).default("Default API Key"),
});

const paymentQrParamsSchema = z.object({
  methodId: paymentQrMethodIdSchema,
});

const PAYMENT_QR_MAX_BYTES = 5 * 1024 * 1024;
const acceptedPaymentQrMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const paymentQrExtensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function toTagStatus(status: "active" | "inactive" | "unclaimed"): TagStatus {
  if (status === "active") {
    return "ACTIVE";
  }
  if (status === "inactive") {
    return "INACTIVE";
  }
  return "UNCLAIMED";
}

function clientTagStatus(status: TagStatus): "active" | "inactive" | "unclaimed" {
  if (status === "ACTIVE") {
    return "active";
  }
  if (status === "INACTIVE") {
    return "inactive";
  }
  return "unclaimed";
}

function maskHash(value: string): string {
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function createGeneratedProfileSlug(tagCode: string): string {
  return `tag-${tagCode.trim().toLowerCase()}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function buildPaymentQrStoragePath(methodId: PaymentQrMethodId, extension: string): { fileName: string; storagePath: string; absolutePath: string } {
  const fileName = `${methodId}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}.${extension}`;
  const storagePath = path.posix.join(PAYMENT_QR_STORAGE_PREFIX, fileName);
  const absolutePath = path.join(process.cwd(), storagePath);
  return {
    fileName,
    storagePath,
    absolutePath,
  };
}

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/profiles", { preHandler: [requireRole("ADMIN")] }, async (request, reply) => {
    const parsed = profileQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query", details: parsed.error.flatten() });
    }

    const query = parsed.data;
    const whereAnd: Prisma.ProfileWhereInput[] = [];

    if (query.search) {
      whereAnd.push({
        OR: [
          { slug: { contains: query.search, mode: "insensitive" } },
          { owner: { name: { contains: query.search, mode: "insensitive" } } },
          { owner: { email: { contains: query.search, mode: "insensitive" } } },
        ],
      });
    }

    if (query.type !== "all") {
      whereAnd.push({
        templateType: { equals: query.type.toLowerCase() },
      });
    }

    if (query.status !== "all") {
      whereAnd.push({
        tag: {
          is: {
            status: toTagStatus(query.status),
          },
        },
      });
    }

    const where: Prisma.ProfileWhereInput = whereAnd.length > 0 ? { AND: whereAnd } : {};

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.profile.findMany({
        where,
        include: {
          owner: true,
          tag: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      prisma.profile.count({ where }),
    ]);

    const data = items.map((profile) => {
      const fields = (profile.fields ?? {}) as Record<string, string>;
      return {
        id: profile.id,
        slug: profile.slug,
        name: fields.name ?? profile.slug,
        title:
          fields.title ??
          fields.category ??
          fields.creativeType ??
          fields.cuisine ??
          fields.type ??
          fields.species ??
          profile.owner.name,
        email: profile.owner.email,
        ownerName: profile.owner.name,
        templateType: profile.templateType,
        theme: profile.theme,
        photo: profile.photoUrl,
        isPublished: profile.isPublished,
        status: profile.tag ? clientTagStatus(profile.tag.status) : "unclaimed",
        tagCode: profile.tag?.code ?? null,
        taps: profile.tag?.taps ?? 0,
        lastTapAt: profile.tag?.lastTapAt ?? null,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };
    });

    return reply.send({
      items: data,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    });
  });

  fastify.get("/tags", { preHandler: [requireRole("ADMIN")] }, async (request, reply) => {
    const parsed = tagQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query", details: parsed.error.flatten() });
    }

    const query = parsed.data;
    const whereAnd: Prisma.TagWhereInput[] = [];

    if (query.search) {
      whereAnd.push({
        OR: [
          { code: { contains: query.search, mode: "insensitive" } },
          { uid: { contains: query.search, mode: "insensitive" } },
          { owner: { name: { contains: query.search, mode: "insensitive" } } },
          { owner: { email: { contains: query.search, mode: "insensitive" } } },
        ],
      });
    }

    if (query.status !== "all") {
      whereAnd.push({ status: toTagStatus(query.status) });
    }

    const where: Prisma.TagWhereInput = whereAnd.length > 0 ? { AND: whereAnd } : {};

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.tag.findMany({
        where,
        include: {
          owner: true,
          profile: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      prisma.tag.count({ where }),
    ]);

    const data = items.map((tag) => {
      const profileFields = (tag.profile?.fields ?? {}) as Record<string, string>;

      return {
        id: tag.id,
        code: tag.code,
        uid: tag.uid,
        claimCode: tag.claimCode,
        status: clientTagStatus(tag.status),
        owner: tag.owner
          ? {
              id: tag.owner.id,
              name: tag.owner.name,
              email: tag.owner.email,
            }
          : null,
        profile: tag.profile
          ? {
              id: tag.profile.id,
              slug: tag.profile.slug,
              name: profileFields.name ?? tag.profile.slug,
              templateType: tag.profile.templateType,
              theme: tag.profile.theme,
              photo: tag.profile.photoUrl,
              isPublished: tag.profile.isPublished,
            }
          : null,
        taps: tag.taps,
        lastTapAt: tag.lastTapAt,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      };
    });

    return reply.send({
      items: data,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    });
  });

  fastify.post("/tags/generate", { preHandler: [requireRole("ADMIN")] }, async (request, reply) => {
    const parsed = generateTagsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const { count, prefix } = parsed.data;

    const existing = await prisma.tag.findMany({
      where: {
        code: {
          startsWith: `${prefix}-`,
        },
      },
      select: {
        code: true,
      },
    });

    const currentMax = existing.reduce((max, tag) => {
      const match = tag.code.match(/-(\d+)$/);
      if (!match) {
        return max;
      }
      const parsedNumber = Number.parseInt(match[1], 10);
      return Number.isNaN(parsedNumber) ? max : Math.max(max, parsedNumber);
    }, 0);

    const generatedClaimCodes = new Set<string>();
    const rows = Array.from({ length: count }, (_, index) => {
      let claimCode = randomUppercaseCode(6);
      while (generatedClaimCodes.has(claimCode)) {
        claimCode = randomUppercaseCode(6);
      }
      generatedClaimCodes.add(claimCode);

      const serial = String(currentMax + index + 1).padStart(4, "0");

      return {
        code: `${prefix}-${serial}`,
        uid: randomUppercaseCode(12),
        claimCode,
        status: "UNCLAIMED" as const,
      };
    });

    const individualDefaults = getTemplateDefaults("individual");
    const result = await prisma.$transaction(async (tx) => {
      const createdTagsResult = await tx.tag.createMany({
        data: rows,
        skipDuplicates: true,
      });

      const tags = await tx.tag.findMany({
        where: {
          code: {
            in: rows.map((row) => row.code),
          },
        },
        select: {
          id: true,
          code: true,
          profileId: true,
        },
      });

      for (const tag of tags) {
        if (tag.profileId) {
          continue;
        }

        const baseSlug = createGeneratedProfileSlug(tag.code);
        let profile: { id: string } | null = null;

        for (let attempt = 0; attempt < 3; attempt += 1) {
          const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomUppercaseCode(4).toLowerCase()}`;

          try {
            profile = await tx.profile.create({
              data: {
                slug,
                ownerId: request.user.sub,
                templateType: "individual",
                theme: "wave",
                palette: "original",
                showGraphic: true,
                isPublished: false,
                photoUrl: null,
                fields: {
                  ...individualDefaults.fields,
                  name: `Tag ${tag.code}`,
                },
                links: {
                  create: individualDefaults.links.map((link, index) => ({
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
            break;
          } catch (error) {
            if (attempt >= 2) {
              throw error;
            }
          }
        }

        if (!profile) {
          throw new Error(`Unable to create generated profile for tag ${tag.code}`);
        }

        await tx.tag.update({
          where: { id: tag.id },
          data: {
            profileId: profile.id,
          },
        });
      }

      return createdTagsResult;
    });

    await prisma.auditLog.create({
      data: {
        actorId: request.user.sub,
        action: "tags.generated",
        entityType: "tag",
        metadata: {
          prefix,
          requested: count,
          created: result.count,
        },
      },
    });

    return reply.status(201).send({
      created: result.count,
      tags: rows.map((row) => ({
        code: row.code,
        claimCode: row.claimCode,
        profilePath: `/profile/${createGeneratedProfileSlug(row.code)}`,
      })),
    });
  });

  fastify.delete<{ Params: { tagId: string } }>("/tags/:tagId", { preHandler: [requireRole("ADMIN")] }, async (request, reply) => {
    const parsed = tagParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid tag ID", details: parsed.error.flatten() });
    }

    const tag = await prisma.tag.findUnique({
      where: { id: parsed.data.tagId },
    });

    if (!tag) {
      return reply.status(404).send({ error: "Tag not found" });
    }

    await prisma.$transaction(async (tx) => {
      if (tag.profileId) {
        const profile = await tx.profile.findUnique({ where: { id: tag.profileId } });
        if (profile) {
          await tx.profile.delete({ where: { id: profile.id } });
        }
      }

      await tx.tag.delete({
        where: { id: tag.id },
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: request.user.sub,
        action: "tag.deleted",
        entityType: "tag",
        entityId: tag.id,
      },
    });

    return reply.status(204).send();
  });

  fastify.get("/settings", { preHandler: [requireRole("ADMIN")] }, async (_request, reply) => {
    const settings = await prisma.adminSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });

    return reply.send({ settings });
  });

  fastify.patch("/settings", { preHandler: [requireRole("ADMIN")] }, async (request, reply) => {
    const parsed = updateSettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const current = await prisma.adminSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });

    const { config: incomingConfig, ...rest } = parsed.data;
    let nextPaymentQrMethods: PaymentQrMethod[] | null = null;
    let obsoleteQrPaths: string[] = [];

    if (incomingConfig && typeof incomingConfig.hardwareColors !== "undefined") {
      const colorsParsed = hardwareColorCatalogSchema.safeParse(incomingConfig.hardwareColors);
      if (!colorsParsed.success) {
        return reply.status(400).send({
          error: "Invalid hardware color configuration",
          details: colorsParsed.error.flatten(),
        });
      }
      incomingConfig.hardwareColors = colorsParsed.data;
    }

    if (incomingConfig && typeof incomingConfig.paymentQRCodes !== "undefined") {
      const paymentMethodsParsed = paymentQrMethodListSchema.safeParse(incomingConfig.paymentQRCodes);
      if (!paymentMethodsParsed.success) {
        return reply.status(400).send({
          error: "Invalid payment QR method configuration",
          details: paymentMethodsParsed.error.flatten(),
        });
      }

      const seenIds = new Set<string>();
      const normalizedMethods: PaymentQrMethod[] = [];
      for (const method of paymentMethodsParsed.data) {
        if (seenIds.has(method.id)) {
          return reply.status(400).send({
            error: `Duplicate payment method id: ${method.id}`,
          });
        }
        seenIds.add(method.id);
        normalizedMethods.push({
          id: method.id,
          label: method.label,
          qr: method.qr ?? null,
        });
      }

      const currentMethods = resolvePaymentQrMethodsFromConfig(current.config);
      const nextStoragePaths = new Set(
        normalizedMethods
          .map((method) => method.qr?.storagePath ?? null)
          .filter((value): value is string => Boolean(value))
      );
      obsoleteQrPaths = currentMethods
        .map((method) => {
          if (!method.qr) {
            return null;
          }
          if (nextStoragePaths.has(method.qr.storagePath)) {
            return null;
          }
          return method.qr.storagePath;
        })
        .filter((value): value is string => Boolean(value));

      incomingConfig.paymentQRCodes = normalizedMethods;
      nextPaymentQrMethods = normalizedMethods;
    }

    const mergedConfig: Prisma.InputJsonValue | undefined =
      typeof incomingConfig === "undefined"
        ? ((current.config ?? undefined) as Prisma.InputJsonValue | undefined)
        : ({
            ...((current.config as Record<string, unknown> | null) ?? {}),
            ...incomingConfig,
          } as Prisma.InputJsonValue);

    const updated = await prisma.adminSetting.update({
      where: { id: 1 },
      data: {
        ...rest,
        config: mergedConfig,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: request.user.sub,
        action: "settings.updated",
        entityType: "admin_setting",
        entityId: String(updated.id),
      },
    });

    if (nextPaymentQrMethods) {
      for (const storagePath of obsoleteQrPaths) {
        if (!isValidPaymentQrStoragePath(storagePath)) {
          continue;
        }
        const absolutePath = path.join(process.cwd(), storagePath);
        await unlink(absolutePath).catch(() => {});
      }
    }

    return reply.send({ settings: updated });
  });

  fastify.post<{ Params: { methodId: string } }>(
    "/settings/payment-qrs/:methodId",
    { preHandler: [requireRole("ADMIN")] },
    async (request, reply) => {
      const parsedParams = paymentQrParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid payment method id", details: parsedParams.error.flatten() });
      }

      let file;
      try {
        file = await request.file({
          limits: {
            files: 1,
            fileSize: PAYMENT_QR_MAX_BYTES,
          },
        });
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "FST_REQ_FILE_TOO_LARGE") {
          return reply.status(413).send({ error: "QR screenshot is too large. Max 5MB." });
        }
        throw error;
      }

      if (!file) {
        return reply.status(400).send({ error: "QR screenshot is required." });
      }

      if (!acceptedPaymentQrMimeTypes.has(file.mimetype)) {
        return reply.status(400).send({ error: "Unsupported file type. Use PNG, JPG, or WebP." });
      }

      const extension = paymentQrExtensionByMimeType[file.mimetype];
      if (!extension) {
        return reply.status(400).send({ error: "Unsupported file type. Use PNG, JPG, or WebP." });
      }

      let fileBuffer: Buffer;
      try {
        fileBuffer = await file.toBuffer();
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "FST_REQ_FILE_TOO_LARGE") {
          return reply.status(413).send({ error: "QR screenshot is too large. Max 5MB." });
        }
        throw error;
      }

      if (fileBuffer.length === 0) {
        return reply.status(400).send({ error: "QR screenshot is empty." });
      }
      if (fileBuffer.length > PAYMENT_QR_MAX_BYTES) {
        return reply.status(413).send({ error: "QR screenshot is too large. Max 5MB." });
      }

      const settings = await prisma.adminSetting.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 },
      });

      const methodId = parsedParams.data.methodId;
      const labelField = asRecord(file.fields?.label);
      const labelValue = typeof labelField.value === "string" ? labelField.value.trim().slice(0, 80) : "";

      const currentMethods = resolvePaymentQrMethodsFromConfig(settings.config);
      let targetIndex = currentMethods.findIndex((method) => method.id === methodId);
      if (targetIndex < 0) {
        currentMethods.push({
          id: methodId,
          label: labelValue || methodId.toUpperCase(),
          qr: null,
        });
        targetIndex = currentMethods.length - 1;
      } else if (labelValue) {
        currentMethods[targetIndex] = {
          ...currentMethods[targetIndex],
          label: labelValue,
        };
      }

      const previousAsset = currentMethods[targetIndex]?.qr ?? null;
      const { fileName, storagePath, absolutePath } = buildPaymentQrStoragePath(methodId, extension);

      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, fileBuffer);

      if (previousAsset && isValidPaymentQrStoragePath(previousAsset.storagePath)) {
        const previousAbsolutePath = path.join(process.cwd(), previousAsset.storagePath);
        if (previousAbsolutePath !== absolutePath) {
          await unlink(previousAbsolutePath).catch(() => {});
        }
      }

      currentMethods[targetIndex] = {
        ...currentMethods[targetIndex],
        qr: {
          fileName,
          storagePath,
          mimeType: file.mimetype,
          sizeBytes: fileBuffer.length,
          uploadedAt: new Date().toISOString(),
        },
      };

      const updatedConfig = withPaymentQrMethodsConfig(settings.config, currentMethods);

      const updated = await prisma.adminSetting.update({
        where: { id: 1 },
        data: {
          config: updatedConfig as Prisma.InputJsonValue,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: request.user.sub,
          action: "settings.payment_qr_uploaded",
          entityType: "admin_setting",
          entityId: String(updated.id),
          metadata: {
            methodId,
            methodLabel: currentMethods[targetIndex].label,
            fileName,
            sizeBytes: fileBuffer.length,
          },
        },
      });

      return reply.send({ settings: updated });
    }
  );

  fastify.delete<{ Params: { methodId: string } }>(
    "/settings/payment-qrs/:methodId",
    { preHandler: [requireRole("ADMIN")] },
    async (request, reply) => {
      const parsedParams = paymentQrParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid payment method id", details: parsedParams.error.flatten() });
      }

      const settings = await prisma.adminSetting.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 },
      });

      const methodId = parsedParams.data.methodId;
      const currentMethods = resolvePaymentQrMethodsFromConfig(settings.config);
      const targetIndex = currentMethods.findIndex((method) => method.id === methodId);
      if (targetIndex < 0) {
        return reply.status(404).send({ error: "Payment method not found." });
      }

      const currentAsset = currentMethods[targetIndex].qr;
      if (!currentAsset) {
        return reply.send({ settings });
      }

      if (isValidPaymentQrStoragePath(currentAsset.storagePath)) {
        const absolutePath = path.join(process.cwd(), currentAsset.storagePath);
        await unlink(absolutePath).catch(() => {});
      }

      currentMethods[targetIndex] = {
        ...currentMethods[targetIndex],
        qr: null,
      };

      const updatedConfig = withPaymentQrMethodsConfig(settings.config, currentMethods);
      const updated = await prisma.adminSetting.update({
        where: { id: 1 },
        data: {
          config: updatedConfig as Prisma.InputJsonValue,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: request.user.sub,
          action: "settings.payment_qr_removed",
          entityType: "admin_setting",
          entityId: String(updated.id),
          metadata: {
            methodId,
            methodLabel: currentMethods[targetIndex].label,
          },
        },
      });

      return reply.send({ settings: updated });
    }
  );

  fastify.get("/api-keys", { preHandler: [requireRole("ADMIN")] }, async (_request, reply) => {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return reply.send({
      items: keys.map((key) => ({
        id: key.id,
        name: key.name,
        keyHash: maskHash(key.keyHash),
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        revokedAt: key.revokedAt,
        createdBy: key.createdBy,
      })),
    });
  });

  fastify.post("/api-keys/rotate", { preHandler: [requireRole("ADMIN")] }, async (request, reply) => {
    const parsed = rotateApiKeySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const plaintext = generateApiKey();
    const keyHash = hashValue(plaintext);

    const created = await prisma.apiKey.create({
      data: {
        name: parsed.data.name,
        keyHash,
        createdById: request.user.sub,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: request.user.sub,
        action: "api_key.rotated",
        entityType: "api_key",
        entityId: created.id,
      },
    });

    return reply.status(201).send({
      apiKey: plaintext,
      id: created.id,
      createdAt: created.createdAt,
    });
  });
}
