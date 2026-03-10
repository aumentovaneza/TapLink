export type ProfileType = "items" | "pets" | "business" | "creator" | "event";

export interface ProfileTypeInfo {
  id: ProfileType;
  label: string;
  description: string;
  icon: string;
}

export const PROFILE_TYPES: ProfileTypeInfo[] = [
  {
    id: "items",
    label: "Items",
    description: "Track and protect personal belongings with NFC-powered lost & found.",
    icon: "package",
  },
  {
    id: "pets",
    label: "Pets",
    description: "Keep your pet safe with instant owner notifications when scanned.",
    icon: "paw-print",
  },
  {
    id: "business",
    label: "Business",
    description: "Digital business card for cafes, shops, salons, and professional services.",
    icon: "building-2",
  },
  {
    id: "creator",
    label: "Creator",
    description: "Showcase your portfolio, links, and booking details.",
    icon: "sparkles",
  },
  {
    id: "event",
    label: "Event",
    description: "Share event details, schedules, and tickets with a single tap.",
    icon: "calendar",
  },
];

export type BusinessCategory =
  | "cafe_restaurant"
  | "retail_shop"
  | "salon_spa"
  | "fitness_gym"
  | "professional_services";

export interface BusinessCategoryInfo {
  id: BusinessCategory;
  label: string;
}

export const BUSINESS_CATEGORIES: BusinessCategoryInfo[] = [
  { id: "cafe_restaurant", label: "Cafe / Restaurant" },
  { id: "retail_shop", label: "Retail Shop" },
  { id: "salon_spa", label: "Salon / Spa" },
  { id: "fitness_gym", label: "Fitness / Gym" },
  { id: "professional_services", label: "Professional Services" },
];

const PROFILE_TYPE_SET = new Set<string>(PROFILE_TYPES.map((t) => t.id));

export function isValidProfileType(value: unknown): value is ProfileType {
  return typeof value === "string" && PROFILE_TYPE_SET.has(value);
}

const LEGACY_TYPE_MAP: Record<string, ProfileType> = {
  individual: "items",
  cafe: "business",
  pet: "pets",
  musician: "creator",
};

export function normalizeProfileType(value: string): ProfileType {
  const normalized = value.trim().toLowerCase();
  if (PROFILE_TYPE_SET.has(normalized)) {
    return normalized as ProfileType;
  }
  return LEGACY_TYPE_MAP[normalized] ?? "items";
}
