import { z } from "zod";

export const hardwareColorOptionSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  hex: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/),
  available: z.boolean(),
  plaStock: z.coerce.number().int().nonnegative().default(0),
});

export const hardwareColorCatalogSchema = z.object({
  tag: z.array(hardwareColorOptionSchema).min(1),
  card: z.array(hardwareColorOptionSchema).min(1),
});

export type HardwareColorOption = z.infer<typeof hardwareColorOptionSchema>;
export type HardwareColorCatalog = z.infer<typeof hardwareColorCatalogSchema>;

export const defaultHardwareColors: HardwareColorCatalog = {
  tag: [
    { id: "tag-black", name: "Onyx Black", hex: "#111827", available: true, plaStock: 120 },
    { id: "tag-white", name: "Cloud White", hex: "#F8FAFC", available: true, plaStock: 100 },
    { id: "tag-red", name: "Signal Red", hex: "#DC2626", available: true, plaStock: 80 },
    { id: "tag-orange", name: "Sunset Orange", hex: "#EA580C", available: true, plaStock: 70 },
    { id: "tag-teal", name: "Sea Teal", hex: "#0F766E", available: false, plaStock: 0 },
  ],
  card: [
    { id: "card-black", name: "Midnight Black", hex: "#0F172A", available: true, plaStock: 200 },
    { id: "card-white", name: "Paper White", hex: "#F8FAFC", available: true, plaStock: 180 },
    { id: "card-red", name: "Lava Red", hex: "#DC2626", available: true, plaStock: 140 },
    { id: "card-amber", name: "Amber Gold", hex: "#D97706", available: true, plaStock: 130 },
    { id: "card-navy", name: "Navy Blue", hex: "#1D4ED8", available: true, plaStock: 90 },
    { id: "card-mint", name: "Mint Green", hex: "#10B981", available: false, plaStock: 0 },
  ],
};

function withAtLeastOneAvailable(options: HardwareColorOption[]): HardwareColorOption[] {
  const cloned = options.map((option) => ({ ...option }));
  if (cloned.some((option) => option.available)) {
    return cloned;
  }
  if (cloned.length === 0) {
    return cloned;
  }
  cloned[0] = { ...cloned[0], available: true };
  return cloned;
}

export function resolveHardwareColorsFromConfig(config: unknown): HardwareColorCatalog {
  const root = config && typeof config === "object" && !Array.isArray(config)
    ? (config as Record<string, unknown>)
    : {};

  const parsed = hardwareColorCatalogSchema.safeParse(root.hardwareColors);
  const source = parsed.success ? parsed.data : defaultHardwareColors;

  return {
    tag: withAtLeastOneAvailable(source.tag),
    card: withAtLeastOneAvailable(source.card),
  };
}
