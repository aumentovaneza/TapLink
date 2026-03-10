import type { ProfileType } from "./profile-types";

export type SubscriptionTier = "free" | "basic" | "premium";

export interface TierPricing {
  tier: SubscriptionTier;
  monthlyPricePhp: number;
  label: string;
}

export interface ProfileTypeTierConfig {
  profileType: ProfileType;
  hasSubscription: boolean;
  tiers: TierPricing[];
}

const itemsTiers: ProfileTypeTierConfig = {
  profileType: "items",
  hasSubscription: false,
  tiers: [{ tier: "free", monthlyPricePhp: 0, label: "Free (one-time tag purchase)" }],
};

const petsTiers: ProfileTypeTierConfig = {
  profileType: "pets",
  hasSubscription: false,
  tiers: [{ tier: "free", monthlyPricePhp: 0, label: "Free (one-time tag purchase)" }],
};

const businessTiers: ProfileTypeTierConfig = {
  profileType: "business",
  hasSubscription: true,
  tiers: [
    { tier: "free", monthlyPricePhp: 0, label: "Free" },
    { tier: "basic", monthlyPricePhp: 199, label: "Basic" },
    { tier: "premium", monthlyPricePhp: 499, label: "Premium" },
  ],
};

const creatorTiers: ProfileTypeTierConfig = {
  profileType: "creator",
  hasSubscription: true,
  tiers: [
    { tier: "free", monthlyPricePhp: 0, label: "Free" },
    { tier: "basic", monthlyPricePhp: 149, label: "Basic" },
    { tier: "premium", monthlyPricePhp: 349, label: "Premium" },
  ],
};

const eventTiers: ProfileTypeTierConfig = {
  profileType: "event",
  hasSubscription: true,
  tiers: [
    { tier: "free", monthlyPricePhp: 0, label: "Free" },
    { tier: "basic", monthlyPricePhp: 149, label: "Basic" },
    { tier: "premium", monthlyPricePhp: 349, label: "Premium" },
  ],
};

export const SUBSCRIPTION_TIERS: Record<ProfileType, ProfileTypeTierConfig> = {
  items: itemsTiers,
  pets: petsTiers,
  business: businessTiers,
  creator: creatorTiers,
  event: eventTiers,
};

export function getTierConfig(profileType: ProfileType): ProfileTypeTierConfig {
  return SUBSCRIPTION_TIERS[profileType] ?? itemsTiers;
}

export function getTierPrice(profileType: ProfileType, tier: SubscriptionTier): number {
  const config = getTierConfig(profileType);
  const found = config.tiers.find((t) => t.tier === tier);
  return found?.monthlyPricePhp ?? 0;
}
