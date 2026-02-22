import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { requireAuth, requireRole } from "../lib/guards";
import { prisma } from "../lib/prisma";
import { dayKey, rangeStart, resolveRangeDays } from "../lib/range";

const rangeQuerySchema = z.object({
  range: z.string().optional(),
});

const tagParamsSchema = z.object({
  tagId: z.string().trim().min(1),
});

function deviceBucket(device?: string | null): "iOS" | "Android" | "Other" {
  const value = (device ?? "").toLowerCase();
  if (value.includes("iphone") || value.includes("ios") || value.includes("ipad")) {
    return "iOS";
  }
  if (value.includes("android") || value.includes("pixel") || value.includes("samsung") || value.includes("oneplus")) {
    return "Android";
  }
  return "Other";
}

function safePercent(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Params: { tagId: string }; Querystring: { range?: string } }>(
    "/tag/:tagId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const params = tagParamsSchema.safeParse(request.params);
      const query = rangeQuerySchema.safeParse(request.query);

      if (!params.success || !query.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      const tag = await prisma.tag.findFirst({
        where: {
          OR: [{ id: params.data.tagId }, { code: params.data.tagId }],
        },
        include: {
          profile: {
            include: {
              links: {
                orderBy: { position: "asc" },
              },
            },
          },
        },
      });

      if (!tag) {
        return reply.status(404).send({ error: "Tag not found" });
      }

      if (tag.ownerId !== request.user.sub && request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "You do not have access to this tag" });
      }

      const days = resolveRangeDays(query.data.range);
      const start = rangeStart(days);

      const tapEvents = await prisma.tapEvent.findMany({
        where: {
          tagId: tag.id,
          ...(start ? { occurredAt: { gte: start } } : {}),
        },
        orderBy: { occurredAt: "asc" },
      });

      const linkEvents = await prisma.linkClickEvent.findMany({
        where: {
          profileId: tag.profileId ?? undefined,
          ...(start ? { occurredAt: { gte: start } } : {}),
        },
      });

      const daily = new Map<string, { date: string; taps: number; visitors: Set<string> }>();
      const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}`, taps: 0 }));
      const deviceCounts = new Map<string, number>([
        ["iOS", 0],
        ["Android", 0],
        ["Other", 0],
      ]);
      const locationCounts = new Map<string, number>();

      for (const event of tapEvents) {
        const key = dayKey(event.occurredAt);
        const visitor = `${event.device ?? "unknown"}|${event.city ?? ""}|${event.country ?? ""}`;

        const current = daily.get(key) ?? {
          date: key,
          taps: 0,
          visitors: new Set<string>(),
        };

        current.taps += 1;
        current.visitors.add(visitor);
        daily.set(key, current);

        const hour = event.occurredAt.getUTCHours();
        hourly[hour].taps += 1;

        const bucket = deviceBucket(event.device);
        deviceCounts.set(bucket, (deviceCounts.get(bucket) ?? 0) + 1);

        const location = [event.city, event.country].filter(Boolean).join(", ") || "Unknown";
        locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
      }

      const timeline = Array.from(daily.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((item) => ({
          date: item.date,
          taps: item.taps,
          unique: item.visitors.size,
        }));

      const totalTaps = tapEvents.length;
      const uniqueVisitors = timeline.reduce((total, entry) => total + entry.unique, 0);
      const avgDaily = timeline.length > 0 ? Math.round(totalTaps / timeline.length) : 0;

      const deviceTotal = Array.from(deviceCounts.values()).reduce((sum, value) => sum + value, 0);
      const devices = Array.from(deviceCounts.entries()).map(([name, value]) => ({
        name,
        value: safePercent(value, deviceTotal),
      }));

      const locations = Array.from(locationCounts.entries())
        .map(([city, taps]) => ({
          city,
          taps,
          pct: safePercent(taps, totalTaps),
        }))
        .sort((a, b) => b.taps - a.taps)
        .slice(0, 10);

      const linkLabelLookup = new Map<string, string>();
      for (const link of tag.profile?.links ?? []) {
        linkLabelLookup.set(link.id, link.label);
      }

      const linkCounts = new Map<string, number>();
      for (const event of linkEvents) {
        const label = event.linkLabel ?? (event.linkId ? linkLabelLookup.get(event.linkId) : undefined) ?? "Unknown Link";
        linkCounts.set(label, (linkCounts.get(label) ?? 0) + 1);
      }

      const linkClicks = Array.from(linkCounts.entries())
        .map(([name, clicks]) => ({ name, clicks }))
        .sort((a, b) => b.clicks - a.clicks);

      const recentScans = tapEvents
        .slice(-10)
        .reverse()
        .map((event) => ({
          id: event.id,
          time: event.occurredAt,
          device: event.device ?? "Unknown",
          location: [event.city, event.country].filter(Boolean).join(", ") || "Unknown",
          method: event.scanMethod,
        }));

      const fields = (tag.profile?.fields ?? {}) as Record<string, string>;

      return reply.send({
        range: days ? `${days}d` : "all",
        tag: {
          id: tag.id,
          tagCode: tag.code,
          profileId: tag.profile?.id ?? null,
          templateType: tag.profile?.templateType,
          name: fields.name ?? tag.profile?.slug ?? tag.code,
          status: tag.status.toLowerCase(),
          theme: tag.profile?.theme ?? null,
          photo: tag.profile?.photoUrl ?? null,
          createdAt: tag.createdAt,
        },
        totals: {
          totalTaps,
          uniqueVisitors,
          avgDaily,
          topLink: linkClicks[0]?.name ?? null,
        },
        timeline,
        hourly,
        devices,
        locations,
        linkClicks,
        recentScans,
      });
    }
  );

  fastify.get<{ Querystring: { range?: string } }>(
    "/admin/overview",
    { preHandler: [requireRole("ADMIN")] },
    async (request, reply) => {
      const query = rangeQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      const days = resolveRangeDays(query.data.range);
      const start = rangeStart(days);

      const tapEvents = await prisma.tapEvent.findMany({
        where: {
          ...(start ? { occurredAt: { gte: start } } : {}),
        },
        include: {
          profile: true,
          tag: true,
        },
      });

      const totalProfiles = await prisma.profile.count();
      const activeTags = await prisma.tag.count({ where: { status: "ACTIVE" } });

      const daily = new Map<string, { date: string; taps: number; visitors: Set<string> }>();
      const templateCounts = new Map<string, { taps: number; profiles: Set<string> }>();
      const topProfiles = new Map<string, { name: string; taps: number }>();
      const deviceCounts = new Map<string, number>([
        ["iOS", 0],
        ["Android", 0],
        ["Other", 0],
      ]);

      for (const event of tapEvents) {
        const key = dayKey(event.occurredAt);
        const visitor = `${event.device ?? "unknown"}|${event.city ?? ""}|${event.country ?? ""}`;
        const dailyCurrent = daily.get(key) ?? { date: key, taps: 0, visitors: new Set<string>() };
        dailyCurrent.taps += 1;
        dailyCurrent.visitors.add(visitor);
        daily.set(key, dailyCurrent);

        const template = event.profile?.templateType ?? "unknown";
        const templateCurrent = templateCounts.get(template) ?? { taps: 0, profiles: new Set<string>() };
        templateCurrent.taps += 1;
        if (event.profileId) {
          templateCurrent.profiles.add(event.profileId);
        }
        templateCounts.set(template, templateCurrent);

        const profileName = ((event.profile?.fields ?? {}) as Record<string, string>).name ?? event.profile?.slug ?? "Unknown";
        const topCurrent = topProfiles.get(event.profileId ?? "unknown") ?? { name: profileName, taps: 0 };
        topCurrent.taps += 1;
        topProfiles.set(event.profileId ?? "unknown", topCurrent);

        const bucket = deviceBucket(event.device);
        deviceCounts.set(bucket, (deviceCounts.get(bucket) ?? 0) + 1);
      }

      const timeline = Array.from(daily.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({
          date: entry.date,
          taps: entry.taps,
          visitors: entry.visitors.size,
        }));

      const templates = Array.from(templateCounts.entries())
        .map(([name, value]) => ({
          name,
          taps: value.taps,
          profiles: value.profiles.size,
          pct: safePercent(value.taps, tapEvents.length),
        }))
        .sort((a, b) => b.taps - a.taps);

      const topProfilesArray = Array.from(topProfiles.values())
        .sort((a, b) => b.taps - a.taps)
        .slice(0, 10)
        .map((entry, index) => ({
          rank: index + 1,
          name: entry.name,
          taps: entry.taps,
        }));

      const totalDeviceEvents = Array.from(deviceCounts.values()).reduce((sum, value) => sum + value, 0);
      const devices = Array.from(deviceCounts.entries()).map(([name, value]) => ({
        name,
        value: safePercent(value, totalDeviceEvents),
      }));

      return reply.send({
        range: days ? `${days}d` : "all",
        summary: {
          totalTaps: tapEvents.length,
          uniqueVisitors: timeline.reduce((sum, item) => sum + item.visitors, 0),
          avgTapsPerDay: timeline.length ? Math.round(tapEvents.length / timeline.length) : 0,
          totalProfiles,
          activeTags,
        },
        timeline,
        devices,
        templates,
        topProfiles: topProfilesArray,
      });
    }
  );
}
