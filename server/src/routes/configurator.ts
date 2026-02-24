import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { resolveHardwareColorsFromConfig } from "../lib/hardware-options";
import { getPhysicalSpec, physicalSpecsV1, productTypeSchema } from "../lib/physical-specs";
import { prisma } from "../lib/prisma";

const productParamsSchema = z.object({
  productType: productTypeSchema,
});

export async function configuratorRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/specs", async () => {
    const settings = await prisma.adminSetting.findUnique({
      where: { id: 1 },
      select: { config: true },
    });

    const hardwareColors = resolveHardwareColorsFromConfig(settings?.config);

    return {
      specs: physicalSpecsV1,
      options: {
        colors: hardwareColors,
      },
    };
  });

  fastify.get<{ Params: { productType: string } }>("/specs/:productType", async (request, reply) => {
    const parsed = productParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid product type",
        details: parsed.error.flatten(),
      });
    }

    const settings = await prisma.adminSetting.findUnique({
      where: { id: 1 },
      select: { config: true },
    });

    const hardwareColors = resolveHardwareColorsFromConfig(settings?.config);

    return {
      specs: {
        version: physicalSpecsV1.version,
        releasedAt: physicalSpecsV1.releasedAt,
        units: physicalSpecsV1.units,
        product: getPhysicalSpec(parsed.data.productType),
      },
      options: {
        colors: hardwareColors[parsed.data.productType],
      },
    };
  });
}
