import type { SubscriptionTier } from "./subscription-tiers";

export type Feature =
  | "basic_profile"
  | "lost_found"
  | "standard_themes"
  | "analytics"
  | "custom_links"
  | "more_themes"
  | "all_themes"
  | "priority_support"
  | "advanced_analytics";

const FREE_FEATURES: Set<Feature> = new Set([
  "basic_profile",
  "lost_found",
  "standard_themes",
]);

const BASIC_FEATURES: Set<Feature> = new Set([
  ...FREE_FEATURES,
  "analytics",
  "custom_links",
  "more_themes",
]);

const PREMIUM_FEATURES: Set<Feature> = new Set([
  ...BASIC_FEATURES,
  "all_themes",
  "priority_support",
  "advanced_analytics",
]);

const FEATURE_MAP: Record<SubscriptionTier, Set<Feature>> = {
  free: FREE_FEATURES,
  basic: BASIC_FEATURES,
  premium: PREMIUM_FEATURES,
};

export function hasFeature(tier: SubscriptionTier, feature: Feature): boolean {
  const features = FEATURE_MAP[tier];
  return features ? features.has(feature) : FREE_FEATURES.has(feature);
}

export function getFeatures(tier: SubscriptionTier): Feature[] {
  const features = FEATURE_MAP[tier] ?? FREE_FEATURES;
  return Array.from(features);
}
