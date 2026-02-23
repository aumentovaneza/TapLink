import { Role } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { randomUppercaseCode } from "../lib/auth";
import type { AppConfig } from "../lib/config";
import { loadConfig } from "../lib/config";
import { requireAuth } from "../lib/guards";
import { prisma } from "../lib/prisma";
import { getTemplateDefaults, normalizeTemplateType } from "../lib/template-defaults";

const linkInputSchema = z.object({
  type: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120),
  url: z.string().trim().min(1, "URL is required").max(500),
});

const createProfileSchema = z.object({
  slug: z.string().trim().min(3).max(120).optional(),
  templateType: z.string().trim().min(1).default("individual"),
  theme: z.string().trim().min(1).max(80).optional(),
  palette: z.string().trim().min(1).max(80).optional(),
  showGraphic: z.boolean().optional(),
  photoUrl: z.string().trim().url().nullable().optional(),
  fields: z.record(z.string()).optional(),
  links: z.array(linkInputSchema).max(10).optional(),
  tagId: z.string().trim().min(1).optional(),
});

const updateProfileSchema = z.object({
  slug: z.string().trim().min(3).max(120).optional(),
  templateType: z.string().trim().min(1).optional(),
  theme: z.string().trim().min(1).max(80).optional(),
  palette: z.string().trim().min(1).max(80).optional(),
  showGraphic: z.boolean().optional(),
  photoUrl: z.string().trim().url().nullable().optional(),
  fields: z.record(z.string()).optional(),
});

const replaceLinksSchema = z.object({
  links: z.array(linkInputSchema).max(10),
});

const photoUploadQuerySchema = z.object({
  profileId: z.string().trim().min(1),
});

const acceptedPhotoMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const photoExtensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let cachedSupabaseClient: SupabaseClient | null = null;
let cachedSupabaseCacheKey = "";

function createProfileSlug(templateType: string): string {
  return `${templateType}-${Date.now().toString(36)}-${randomUppercaseCode(4).toLowerCase()}`;
}

function getSupabaseClient(config: AppConfig): SupabaseClient | null {
  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const cacheKey = `${config.SUPABASE_URL}:${config.SUPABASE_SERVICE_ROLE_KEY}`;
  if (cachedSupabaseClient && cachedSupabaseCacheKey === cacheKey) {
    return cachedSupabaseClient;
  }

  cachedSupabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  cachedSupabaseCacheKey = cacheKey;

  return cachedSupabaseClient;
}

function serializeProfile(profile: any) {
  const fields = (profile.fields ?? {}) as Record<string, string>;

  return {
    id: profile.id,
    slug: profile.slug,
    ownerId: profile.ownerId,
    templateType: profile.templateType,
    theme: profile.theme,
    palette: profile.palette,
    showGraphic: profile.showGraphic,
    photoUrl: profile.photoUrl,
    fields,
    links: (profile.links ?? []).map((link: any) => ({
      id: link.id,
      type: link.type,
      label: link.label,
      url: link.url,
      position: link.position,
    })),
    tagId: profile.tag?.id ?? null,
    tagCode: profile.tag?.code ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

async function ensureProfileAccess(profileId: string, userId: string, role: Role) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      links: {
        orderBy: { position: "asc" },
      },
      tag: true,
    },
  });

  if (!profile) {
    return { error: "not_found" as const };
  }

  if (profile.ownerId !== userId && role !== "ADMIN") {
    return { error: "forbidden" as const };
  }

  return { profile };
}

interface ProfileRoutesOptions {
  config?: AppConfig;
}

export async function profileRoutes(fastify: FastifyInstance, options: ProfileRoutesOptions = {}): Promise<void> {
  const config = options.config ?? loadConfig();

  fastify.get("/mine", { preHandler: [requireAuth] }, async (request) => {
    const profiles = await prisma.profile.findMany({
      where: {
        ownerId: request.user.sub,
      },
      include: {
        links: {
          orderBy: { position: "asc" },
        },
        tag: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return {
      items: profiles.map((profile) => serializeProfile(profile)),
    };
  });

  fastify.post<{ Querystring: { profileId?: string } }>("/photo", { preHandler: [requireAuth] }, async (request, reply) => {
    const supabase = getSupabaseClient(config);

    if (!supabase) {
      return reply.status(503).send({
        error: "Photo uploads are not configured on the server.",
      });
    }

    const parsedQuery = photoUploadQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.status(400).send({
        error: "profileId is required.",
      });
    }

    const access = await ensureProfileAccess(parsedQuery.data.profileId, request.user.sub, request.user.role);
    if ("error" in access) {
      if (access.error === "not_found") {
        return reply.status(404).send({ error: "Profile not found" });
      }
      return reply.status(403).send({ error: "You do not have access to this profile" });
    }

    let photoFile: Awaited<ReturnType<typeof request.file>>;
    try {
      photoFile = await request.file({
        limits: {
          files: 1,
          fileSize: config.PHOTO_UPLOAD_MAX_BYTES,
        },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.status(413).send({
          error: `Photo is too large. Max ${(config.PHOTO_UPLOAD_MAX_BYTES / 1_000_000).toFixed(0)}MB.`,
        });
      }
      throw error;
    }

    if (!photoFile) {
      return reply.status(400).send({ error: "Photo file is required." });
    }

    if (!acceptedPhotoMimeTypes.has(photoFile.mimetype)) {
      return reply.status(400).send({
        error: "Unsupported file type. Use JPG, PNG, or WebP.",
      });
    }

    const extension = photoExtensionByMimeType[photoFile.mimetype];
    if (!extension) {
      return reply.status(400).send({
        error: "Unsupported file type. Use JPG, PNG, or WebP.",
      });
    }

    let photoBuffer: Buffer;
    try {
      photoBuffer = await photoFile.toBuffer();
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.status(413).send({
          error: `Photo is too large. Max ${(config.PHOTO_UPLOAD_MAX_BYTES / 1_000_000).toFixed(0)}MB.`,
        });
      }
      throw error;
    }

    if (photoBuffer.length === 0) {
      return reply.status(400).send({ error: "Photo file is empty." });
    }

    if (photoBuffer.length > config.PHOTO_UPLOAD_MAX_BYTES) {
      return reply.status(413).send({
        error: `Photo is too large. Max ${(config.PHOTO_UPLOAD_MAX_BYTES / 1_000_000).toFixed(0)}MB.`,
      });
    }

    const path = `${access.profile.ownerId}/${access.profile.id}/${Date.now().toString(36)}-${randomUppercaseCode(8).toLowerCase()}.${extension}`;
    const bucket = config.SUPABASE_STORAGE_BUCKET;

    const uploadResult = await supabase.storage.from(bucket).upload(path, photoBuffer, {
      contentType: photoFile.mimetype,
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadResult.error) {
      return reply.status(502).send({
        error: "Unable to upload photo to Supabase.",
        details: uploadResult.error.message,
      });
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    if (!publicUrl) {
      return reply.status(500).send({
        error: "Photo was uploaded, but a public URL could not be generated.",
      });
    }

    await prisma.profile.update({
      where: { id: access.profile.id },
      data: {
        photoUrl: publicUrl,
      },
    });

    return reply.status(201).send({
      profileId: access.profile.id,
      photoUrl: publicUrl,
      path,
      contentType: photoFile.mimetype,
      size: photoBuffer.length,
    });
  });

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const id = request.params.id;

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        links: {
          orderBy: { position: "asc" },
        },
        tag: true,
      },
    });

    if (!profile) {
      return reply.status(404).send({ error: "Profile not found" });
    }

    return reply.send({ profile: serializeProfile(profile) });
  });

  fastify.post("/", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = createProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const templateType = normalizeTemplateType(parsed.data.templateType);
    const defaults = getTemplateDefaults(templateType);
    const links = (parsed.data.links && parsed.data.links.length > 0 ? parsed.data.links : defaults.links).slice(0, 10);

    const profile = await prisma.profile.create({
      data: {
        slug: parsed.data.slug ?? createProfileSlug(templateType),
        ownerId: request.user.sub,
        templateType,
        theme: parsed.data.theme ?? "wave",
        palette: parsed.data.palette ?? "original",
        showGraphic: parsed.data.showGraphic ?? true,
        photoUrl: parsed.data.photoUrl ?? null,
        fields: {
          ...defaults.fields,
          ...(parsed.data.fields ?? {}),
        },
        links: {
          create: links.map((link, index) => ({
            type: link.type,
            label: link.label,
            url: link.url,
            position: index,
          })),
        },
      },
      include: {
        links: {
          orderBy: { position: "asc" },
        },
        tag: true,
      },
    });

    if (parsed.data.tagId) {
      const tag = await prisma.tag.findUnique({ where: { id: parsed.data.tagId } });
      if (!tag) {
        return reply.status(404).send({ error: "Tag not found" });
      }

      if (tag.ownerId !== request.user.sub && request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "You do not have access to this tag" });
      }

      await prisma.tag.update({
        where: { id: tag.id },
        data: {
          profileId: profile.id,
          status: "ACTIVE",
        },
      });
    }

    return reply.status(201).send({ profile: serializeProfile(profile) });
  });

  fastify.patch<{ Params: { id: string } }>("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const access = await ensureProfileAccess(request.params.id, request.user.sub, request.user.role);
    if ("error" in access) {
      if (access.error === "not_found") {
        return reply.status(404).send({ error: "Profile not found" });
      }
      return reply.status(403).send({ error: "You do not have access to this profile" });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof parsed.data.slug !== "undefined") {
      updateData.slug = parsed.data.slug;
    }
    if (typeof parsed.data.templateType !== "undefined") {
      updateData.templateType = normalizeTemplateType(parsed.data.templateType);
    }
    if (typeof parsed.data.theme !== "undefined") {
      updateData.theme = parsed.data.theme;
    }
    if (typeof parsed.data.palette !== "undefined") {
      updateData.palette = parsed.data.palette;
    }
    if (typeof parsed.data.showGraphic !== "undefined") {
      updateData.showGraphic = parsed.data.showGraphic;
    }
    if (typeof parsed.data.photoUrl !== "undefined") {
      updateData.photoUrl = parsed.data.photoUrl;
    }
    if (typeof parsed.data.fields !== "undefined") {
      updateData.fields = {
        ...(access.profile.fields as Record<string, string>),
        ...parsed.data.fields,
      };
    }

    const updated = await prisma.profile.update({
      where: { id: access.profile.id },
      data: updateData,
      include: {
        links: {
          orderBy: { position: "asc" },
        },
        tag: true,
      },
    });

    return reply.send({ profile: serializeProfile(updated) });
  });

  fastify.put<{ Params: { id: string } }>("/:id/links", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = replaceLinksSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const access = await ensureProfileAccess(request.params.id, request.user.sub, request.user.role);
    if ("error" in access) {
      if (access.error === "not_found") {
        return reply.status(404).send({ error: "Profile not found" });
      }
      return reply.status(403).send({ error: "You do not have access to this profile" });
    }

    await prisma.$transaction([
      prisma.profileLink.deleteMany({
        where: { profileId: access.profile.id },
      }),
      prisma.profileLink.createMany({
        data: parsed.data.links.map((link, index) => ({
          profileId: access.profile.id,
          type: link.type,
          label: link.label,
          url: link.url,
          position: index,
        })),
      }),
    ]);

    const updated = await prisma.profile.findUnique({
      where: { id: access.profile.id },
      include: {
        links: {
          orderBy: { position: "asc" },
        },
        tag: true,
      },
    });

    return reply.send({
      profile: serializeProfile(updated),
    });
  });
}
