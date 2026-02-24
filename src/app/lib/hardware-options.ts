export type ProductType = "tag" | "card";

export interface HardwareColorOption {
  id: string;
  name: string;
  hex: string;
  available: boolean;
  plaStock: number;
}

export type HardwareColorCatalog = Record<ProductType, HardwareColorOption[]>;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function sanitizePlaStock(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (!Number.isNaN(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return Math.max(0, Math.floor(fallback));
}

function sanitizeColorList(value: unknown, fallback: HardwareColorOption[]): HardwareColorOption[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback.map((item) => ({ ...item }));
  }

  const fallbackById = new Map(fallback.map((item) => [item.id, item]));
  const sanitized: HardwareColorOption[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    const hex = typeof entry.hex === "string" ? entry.hex.trim() : "";
    const fallbackEntry = fallbackById.get(id);
    const available = typeof entry.available === "boolean" ? entry.available : fallbackEntry?.available ?? false;
    const plaStock = sanitizePlaStock(entry.plaStock, fallbackEntry?.plaStock ?? 0);

    if (!id || !name || !isHexColor(hex)) {
      continue;
    }

    sanitized.push({
      id,
      name,
      hex,
      available,
      plaStock,
    });
  }

  if (sanitized.length === 0) {
    return fallback.map((item) => ({ ...item }));
  }

  if (!sanitized.some((item) => item.available)) {
    sanitized[0] = { ...sanitized[0], available: true };
  }

  return sanitized;
}

export function normalizeHardwareColorCatalog(value: unknown): HardwareColorCatalog {
  if (!isRecord(value)) {
    return {
      tag: defaultHardwareColors.tag.map((item) => ({ ...item })),
      card: defaultHardwareColors.card.map((item) => ({ ...item })),
    };
  }

  return {
    tag: sanitizeColorList(value.tag, defaultHardwareColors.tag),
    card: sanitizeColorList(value.card, defaultHardwareColors.card),
  };
}
