import { z } from "zod";

export const productTypeSchema = z.enum(["tag", "card"]);
export type ProductType = z.infer<typeof productTypeSchema>;

const zoneSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  xMm: z.number().nonnegative(),
  yMm: z.number().nonnegative(),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
});

const textConstraintSchema = z.object({
  maxCharacters: z.number().int().positive(),
  maxLines: z.number().int().positive(),
  minFontSizeMm: z.number().positive(),
  minStrokeWidthMm: z.number().positive(),
});

const iconConstraintSchema = z.object({
  minSizeMm: z.number().positive(),
  maxSizeMm: z.number().positive(),
});

const logoConstraintSchema = z.object({
  allowed: z.boolean(),
  maxWidthMm: z.number().nonnegative(),
  maxHeightMm: z.number().nonnegative(),
});

const productSpecSchema = z.object({
  type: productTypeSchema,
  displayName: z.string().trim().min(1),
  units: z.literal("mm"),
  physical: z.object({
    widthMm: z.number().positive(),
    heightMm: z.number().positive(),
    thicknessMm: z.number().positive(),
    cornerRadiusMm: z.number().nonnegative(),
  }),
  zones: z.object({
    printSafe: z.array(zoneSchema).min(1),
    blocked: z.array(zoneSchema),
  }),
  customization: z.object({
    baseColor: z.boolean(),
    text: z.boolean(),
    textColor: z.boolean(),
    iconOrLogo: z.boolean(),
    iconColor: z.boolean(),
  }),
  constraints: z.object({
    text: textConstraintSchema,
    icon: iconConstraintSchema,
    logo: logoConstraintSchema,
  }),
  defaultTemplateId: z.string().trim().min(1),
  layoutPresets: z.array(z.string().trim().min(1)).min(1),
});

const physicalSpecsSchema = z
  .object({
    version: z.literal("v1"),
    releasedAt: z.string().datetime(),
    units: z.literal("mm"),
    products: z.object({
      tag: productSpecSchema,
      card: productSpecSchema,
    }),
  })
  .superRefine((value, ctx) => {
    const products = [value.products.tag, value.products.card];

    for (const product of products) {
      const { widthMm, heightMm } = product.physical;

      for (const zone of [...product.zones.printSafe, ...product.zones.blocked]) {
        if (zone.xMm + zone.widthMm > widthMm) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${product.type}.${zone.id}: zone exceeds product width`,
          });
        }

        if (zone.yMm + zone.heightMm > heightMm) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${product.type}.${zone.id}: zone exceeds product height`,
          });
        }
      }

      for (const printableZone of product.zones.printSafe) {
        for (const blockedZone of product.zones.blocked) {
          const separated =
            printableZone.xMm + printableZone.widthMm <= blockedZone.xMm ||
            blockedZone.xMm + blockedZone.widthMm <= printableZone.xMm ||
            printableZone.yMm + printableZone.heightMm <= blockedZone.yMm ||
            blockedZone.yMm + blockedZone.heightMm <= printableZone.yMm;

          if (!separated) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${product.type}.${printableZone.id}: overlaps blocked zone ${blockedZone.id}`,
            });
          }
        }
      }
    }
  });

const rawPhysicalSpecsV1 = {
  version: "v1",
  releasedAt: "2026-02-24T00:00:00.000Z",
  units: "mm",
  products: {
    tag: {
      type: "tag",
      displayName: "NFC Tag",
      units: "mm",
      physical: {
        widthMm: 32,
        heightMm: 32,
        thicknessMm: 3.2,
        cornerRadiusMm: 16,
      },
      zones: {
        printSafe: [
          {
            id: "tag-text-primary",
            label: "Primary Text",
            xMm: 4,
            yMm: 18,
            widthMm: 24,
            heightMm: 9,
          },
          {
            id: "tag-icon-or-logo",
            label: "Icon or Logo",
            xMm: 10,
            yMm: 7,
            widthMm: 12,
            heightMm: 8,
          },
        ],
        blocked: [
          {
            id: "tag-nfc-reserved",
            label: "NFC Reserved Area",
            xMm: 11,
            yMm: 27,
            widthMm: 10,
            heightMm: 4,
          },
        ],
      },
      customization: {
        baseColor: true,
        text: true,
        textColor: true,
        iconOrLogo: true,
        iconColor: true,
      },
      constraints: {
        text: {
          maxCharacters: 18,
          maxLines: 2,
          minFontSizeMm: 1.2,
          minStrokeWidthMm: 0.3,
        },
        icon: {
          minSizeMm: 6,
          maxSizeMm: 12,
        },
        logo: {
          allowed: true,
          maxWidthMm: 12,
          maxHeightMm: 8,
        },
      },
      defaultTemplateId: "tag-default-v1",
      layoutPresets: ["tag-compact-v1"],
    },
    card: {
      type: "card",
      displayName: "NFC Card",
      units: "mm",
      physical: {
        widthMm: 85.6,
        heightMm: 54,
        thicknessMm: 0.9,
        cornerRadiusMm: 3,
      },
      zones: {
        printSafe: [
          {
            id: "card-text-primary",
            label: "Primary Text",
            xMm: 5,
            yMm: 29,
            widthMm: 48,
            heightMm: 18,
          },
          {
            id: "card-text-secondary",
            label: "Secondary Text",
            xMm: 5,
            yMm: 16,
            widthMm: 48,
            heightMm: 10,
          },
          {
            id: "card-icon-or-logo",
            label: "Icon or Logo",
            xMm: 57,
            yMm: 9,
            widthMm: 23,
            heightMm: 23,
          },
        ],
        blocked: [
          {
            id: "card-nfc-reserved",
            label: "NFC Reserved Area",
            xMm: 3,
            yMm: 3,
            widthMm: 14,
            heightMm: 12,
          },
        ],
      },
      customization: {
        baseColor: true,
        text: true,
        textColor: true,
        iconOrLogo: true,
        iconColor: true,
      },
      constraints: {
        text: {
          maxCharacters: 48,
          maxLines: 4,
          minFontSizeMm: 1.1,
          minStrokeWidthMm: 0.2,
        },
        icon: {
          minSizeMm: 8,
          maxSizeMm: 23,
        },
        logo: {
          allowed: true,
          maxWidthMm: 23,
          maxHeightMm: 23,
        },
      },
      defaultTemplateId: "card-default-v1",
      layoutPresets: ["card-business-v1", "card-personal-v1", "card-creator-v1"],
    },
  },
} as const;

export const physicalSpecsV1 = physicalSpecsSchema.parse(rawPhysicalSpecsV1);
export type PhysicalSpecsBundle = z.infer<typeof physicalSpecsSchema>;
export type PhysicalProductSpec = z.infer<typeof productSpecSchema>;

export function getPhysicalSpec(productType: ProductType): PhysicalProductSpec {
  return physicalSpecsV1.products[productType];
}
