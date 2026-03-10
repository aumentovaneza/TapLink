import type { ProductType } from "./hardware-options";
import type { ProfileType } from "./profile-types";

const PH_COUNTRY_TOKENS = new Set([
  "ph",
  "philippines",
  "republic of the philippines",
  "philippine",
]);

const METRO_MANILA_TOKENS = [
  "metro manila",
  "ncr",
  "national capital region",
  "manila",
  "makati",
  "taguig",
  "pasig",
  "pasay",
  "quezon city",
  "qc",
  "mandaluyong",
  "marikina",
  "caloocan",
  "paranaque",
  "las pinas",
  "muntinlupa",
  "malabon",
  "navotas",
  "san juan",
  "valenzuela",
  "pateros",
];

const VISAYAS_TOKENS = [
  "visayas",
  "cebu",
  "bohol",
  "iloilo",
  "bacolod",
  "negros",
  "aklan",
  "antique",
  "capiz",
  "guimaras",
  "leyte",
  "samar",
  "siquijor",
  "ormoc",
  "dumaguete",
  "biliran",
];

const MINDANAO_TOKENS = [
  "mindanao",
  "davao",
  "zamboanga",
  "cagayan de oro",
  "general santos",
  "gensan",
  "butuan",
  "surigao",
  "cotabato",
  "bukidnon",
  "misamis",
  "agusan",
  "lanao",
  "maguindanao",
  "sarangani",
  "sultan kudarat",
  "sulu",
  "basilan",
  "tawi-tawi",
  "camiguin",
  "iligan",
];

export type ShippingAreaCode = "metro_manila" | "luzon" | "visayas" | "mindanao" | "international";

export interface ShippingDestinationInput {
  areaCode?: ShippingAreaCode | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
}

interface ShippingRateConfig {
  baseFeePhp: number;
  additionalPerWeightStepPhp: number;
}

interface ShippingProductWeightConfig {
  packagingGrams: number;
  tagGrams: number;
  cardGrams: number;
}

interface ShippingAreaRatesConfig {
  metro_manila: ShippingRateConfig;
  luzon: ShippingRateConfig;
  visayas: ShippingRateConfig;
  mindanao: ShippingRateConfig;
  international: ShippingRateConfig;
}

export interface PerTypeProductPricing {
  items: number;
  pets: number;
  business: number;
  creator: number;
  event: number;
}

export interface OrderPricingConfig {
  currency: "PHP";
  products: {
    tag: number | PerTypeProductPricing;
    card: number | PerTypeProductPricing;
  };
  shipping: {
    flatFeePhp: number;
    label: string;
    includedInDisplayedPrice: boolean;
    weightStepGrams: number;
    productWeightGrams: ShippingProductWeightConfig;
    areaRates: ShippingAreaRatesConfig;
  };
}

export interface OrderPriceBreakdown {
  currency: "PHP";
  unitPricePhp: number;
  quantity: number;
  itemSubtotalPhp: number;
  shippingFeePhp: number;
  totalPhp: number;
  shippingLabel: string;
  shippingAreaCode: ShippingAreaCode;
  shippingAreaLabel: string;
  totalWeightGrams: number;
  billableWeightGrams: number;
  shippingWeightSurchargePhp: number;
  shippingIncludedInDisplayedPrice: boolean;
}

export const shippingAreaLabels: Record<ShippingAreaCode, string> = {
  metro_manila: "Metro Manila",
  luzon: "Luzon",
  visayas: "Visayas",
  mindanao: "Mindanao",
  international: "International",
};

export const shippingAreaOptions: Array<{ code: ShippingAreaCode; label: string }> = [
  { code: "metro_manila", label: shippingAreaLabels.metro_manila },
  { code: "luzon", label: shippingAreaLabels.luzon },
  { code: "visayas", label: shippingAreaLabels.visayas },
  { code: "mindanao", label: shippingAreaLabels.mindanao },
  { code: "international", label: shippingAreaLabels.international },
];

function roundMoney(value: number): number {
  return Math.max(0, Math.round(value));
}

export function deriveAreaRatesFromFlatFee(flatFeePhp: number): ShippingAreaRatesConfig {
  const flat = Math.max(0, Math.floor(flatFeePhp));
  return {
    metro_manila: {
      baseFeePhp: roundMoney(flat * 0.85),
      additionalPerWeightStepPhp: roundMoney(flat * 0.25),
    },
    luzon: {
      baseFeePhp: flat,
      additionalPerWeightStepPhp: roundMoney(flat * 0.35),
    },
    visayas: {
      baseFeePhp: roundMoney(flat * 1.35),
      additionalPerWeightStepPhp: roundMoney(flat * 0.5),
    },
    mindanao: {
      baseFeePhp: roundMoney(flat * 1.55),
      additionalPerWeightStepPhp: roundMoney(flat * 0.58),
    },
    international: {
      baseFeePhp: roundMoney(flat * 3),
      additionalPerWeightStepPhp: roundMoney(flat * 1.2),
    },
  };
}

const defaultDerivedAreaRates = deriveAreaRatesFromFlatFee(120);

export const defaultPerTypeTagPricing: PerTypeProductPricing = {
  items: 399,
  pets: 499,
  business: 799,
  creator: 599,
  event: 599,
};

export const defaultPerTypeCardPricing: PerTypeProductPricing = {
  items: 599,
  pets: 699,
  business: 999,
  creator: 799,
  event: 799,
};

export const defaultOrderPricingConfig: OrderPricingConfig = {
  currency: "PHP",
  products: {
    tag: defaultPerTypeTagPricing,
    card: defaultPerTypeCardPricing,
  },
  shipping: {
    flatFeePhp: 120,
    label: "Shipping included",
    includedInDisplayedPrice: true,
    weightStepGrams: 250,
    productWeightGrams: {
      packagingGrams: 120,
      tagGrams: 18,
      cardGrams: 30,
    },
    areaRates: defaultDerivedAreaRates,
  },
};

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toInt(value: unknown, fallback: number): number {
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

function resolveUnitPrice(
  productPricing: number | PerTypeProductPricing,
  profileType?: ProfileType | null
): number {
  if (typeof productPricing === "number") {
    return productPricing;
  }
  if (profileType && profileType in productPricing) {
    return productPricing[profileType];
  }
  return productPricing.items;
}

function resolveProductPrice(value: unknown, fallback: number | PerTypeProductPricing): number | PerTypeProductPricing {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ("items" in obj || "pets" in obj || "business" in obj) {
      const fallbackObj = typeof fallback === "number"
        ? { items: fallback, pets: fallback, business: fallback, creator: fallback, event: fallback }
        : fallback;
      return {
        items: toInt(obj.items, fallbackObj.items),
        pets: toInt(obj.pets, fallbackObj.pets),
        business: toInt(obj.business, fallbackObj.business),
        creator: toInt(obj.creator, fallbackObj.creator),
        event: toInt(obj.event, fallbackObj.event),
      };
    }
  }
  if (typeof value === "number" || typeof value === "string") {
    return toInt(value, typeof fallback === "number" ? fallback : fallback.items);
  }
  return fallback;
}

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }
  return fallback;
}

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

function includesAnyToken(value: string, tokens: readonly string[]): boolean {
  return tokens.some((token) => value.includes(token));
}

function normalizeAreaRate(source: unknown, fallback: ShippingRateConfig): ShippingRateConfig {
  const root = toRecord(source);
  return {
    baseFeePhp: toInt(root.baseFeePhp, fallback.baseFeePhp),
    additionalPerWeightStepPhp: toInt(
      root.additionalPerWeightStepPhp,
      fallback.additionalPerWeightStepPhp
    ),
  };
}

export function normalizeOrderPricingConfig(value: unknown): OrderPricingConfig {
  const root = toRecord(value);
  const products = toRecord(root.products);
  const shipping = toRecord(root.shipping);
  const productWeightGrams = toRecord(shipping.productWeightGrams);
  const areaRates = toRecord(shipping.areaRates);

  const flatFeePhp = toInt(shipping.flatFeePhp, defaultOrderPricingConfig.shipping.flatFeePhp);
  const derivedAreaRates = deriveAreaRatesFromFlatFee(flatFeePhp);

  const label =
    typeof shipping.label === "string" && shipping.label.trim()
      ? shipping.label.trim().slice(0, 120)
      : defaultOrderPricingConfig.shipping.label;

  const weightStepGrams = Math.max(
    50,
    Math.min(5000, toInt(shipping.weightStepGrams, defaultOrderPricingConfig.shipping.weightStepGrams))
  );

  return {
    currency: root.currency === "PHP" ? "PHP" : defaultOrderPricingConfig.currency,
    products: {
      tag: resolveProductPrice(products.tag, defaultOrderPricingConfig.products.tag),
      card: resolveProductPrice(products.card, defaultOrderPricingConfig.products.card),
    },
    shipping: {
      flatFeePhp,
      label,
      includedInDisplayedPrice: toBool(
        shipping.includedInDisplayedPrice,
        defaultOrderPricingConfig.shipping.includedInDisplayedPrice
      ),
      weightStepGrams,
      productWeightGrams: {
        packagingGrams: toInt(
          productWeightGrams.packagingGrams,
          defaultOrderPricingConfig.shipping.productWeightGrams.packagingGrams
        ),
        tagGrams: Math.max(
          1,
          toInt(productWeightGrams.tagGrams, defaultOrderPricingConfig.shipping.productWeightGrams.tagGrams)
        ),
        cardGrams: Math.max(
          1,
          toInt(productWeightGrams.cardGrams, defaultOrderPricingConfig.shipping.productWeightGrams.cardGrams)
        ),
      },
      areaRates: {
        metro_manila: normalizeAreaRate(areaRates.metro_manila, derivedAreaRates.metro_manila),
        luzon: normalizeAreaRate(areaRates.luzon, derivedAreaRates.luzon),
        visayas: normalizeAreaRate(areaRates.visayas, derivedAreaRates.visayas),
        mindanao: normalizeAreaRate(areaRates.mindanao, derivedAreaRates.mindanao),
        international: normalizeAreaRate(areaRates.international, derivedAreaRates.international),
      },
    },
  };
}

export function resolveShippingAreaCode(input: ShippingDestinationInput | null | undefined): ShippingAreaCode {
  if (!input) {
    return "luzon";
  }

  if (input.areaCode && shippingAreaLabels[input.areaCode]) {
    return input.areaCode;
  }

  const country = normalizeText(input.country);
  const province = normalizeText(input.province);
  const city = normalizeText(input.city);
  const locationText = `${city} ${province}`.trim();

  const isPhilippines =
    !country ||
    country === "philippines" ||
    country === "philippine" ||
    PH_COUNTRY_TOKENS.has(country);

  if (!isPhilippines) {
    return "international";
  }

  if (includesAnyToken(locationText, METRO_MANILA_TOKENS)) {
    return "metro_manila";
  }

  if (includesAnyToken(locationText, MINDANAO_TOKENS)) {
    return "mindanao";
  }

  if (includesAnyToken(locationText, VISAYAS_TOKENS)) {
    return "visayas";
  }

  return "luzon";
}

export function computeOrderPriceBreakdown(input: {
  productType: ProductType;
  quantity: number;
  pricing: OrderPricingConfig;
  profileType?: ProfileType | null;
  shippingDestination?: ShippingDestinationInput | null;
}): OrderPriceBreakdown {
  const quantity = Number.isFinite(input.quantity) ? Math.max(1, Math.floor(input.quantity)) : 1;
  const unitPricePhp = resolveUnitPrice(input.pricing.products[input.productType], input.profileType);
  const itemSubtotalPhp = unitPricePhp * quantity;

  const shippingAreaCode = resolveShippingAreaCode(input.shippingDestination);
  const shippingRate = input.pricing.shipping.areaRates[shippingAreaCode];
  const weightStepGrams = Math.max(1, Math.floor(input.pricing.shipping.weightStepGrams));
  const productWeightGrams =
    input.productType === "tag"
      ? input.pricing.shipping.productWeightGrams.tagGrams
      : input.pricing.shipping.productWeightGrams.cardGrams;
  const totalWeightGrams =
    input.pricing.shipping.productWeightGrams.packagingGrams + productWeightGrams * quantity;
  const billableWeightGrams = Math.max(weightStepGrams, Math.ceil(totalWeightGrams / weightStepGrams) * weightStepGrams);
  const additionalWeightSteps = Math.max(0, billableWeightGrams / weightStepGrams - 1);
  const shippingWeightSurchargePhp = shippingRate.additionalPerWeightStepPhp * additionalWeightSteps;
  const shippingFeePhp = shippingRate.baseFeePhp + shippingWeightSurchargePhp;
  const totalPhp = itemSubtotalPhp + shippingFeePhp;

  return {
    currency: input.pricing.currency,
    unitPricePhp,
    quantity,
    itemSubtotalPhp,
    shippingFeePhp,
    totalPhp,
    shippingLabel: input.pricing.shipping.label,
    shippingAreaCode,
    shippingAreaLabel: shippingAreaLabels[shippingAreaCode],
    totalWeightGrams,
    billableWeightGrams,
    shippingWeightSurchargePhp,
    shippingIncludedInDisplayedPrice: input.pricing.shipping.includedInDisplayedPrice,
  };
}

export function normalizeRootOrderPricingConfig(config: unknown): OrderPricingConfig {
  const root = toRecord(config);
  return normalizeOrderPricingConfig(root.orderPricing);
}

export function withOrderPricingConfig(
  config: Record<string, unknown>,
  pricing: OrderPricingConfig
): Record<string, unknown> {
  return {
    ...config,
    orderPricing: {
      currency: pricing.currency,
      products: {
        tag: typeof pricing.products.tag === "number" ? pricing.products.tag : { ...pricing.products.tag },
        card: typeof pricing.products.card === "number" ? pricing.products.card : { ...pricing.products.card },
      },
      shipping: {
        flatFeePhp: pricing.shipping.flatFeePhp,
        label: pricing.shipping.label,
        includedInDisplayedPrice: pricing.shipping.includedInDisplayedPrice,
        weightStepGrams: pricing.shipping.weightStepGrams,
        productWeightGrams: {
          packagingGrams: pricing.shipping.productWeightGrams.packagingGrams,
          tagGrams: pricing.shipping.productWeightGrams.tagGrams,
          cardGrams: pricing.shipping.productWeightGrams.cardGrams,
        },
        areaRates: {
          metro_manila: {
            baseFeePhp: pricing.shipping.areaRates.metro_manila.baseFeePhp,
            additionalPerWeightStepPhp: pricing.shipping.areaRates.metro_manila.additionalPerWeightStepPhp,
          },
          luzon: {
            baseFeePhp: pricing.shipping.areaRates.luzon.baseFeePhp,
            additionalPerWeightStepPhp: pricing.shipping.areaRates.luzon.additionalPerWeightStepPhp,
          },
          visayas: {
            baseFeePhp: pricing.shipping.areaRates.visayas.baseFeePhp,
            additionalPerWeightStepPhp: pricing.shipping.areaRates.visayas.additionalPerWeightStepPhp,
          },
          mindanao: {
            baseFeePhp: pricing.shipping.areaRates.mindanao.baseFeePhp,
            additionalPerWeightStepPhp: pricing.shipping.areaRates.mindanao.additionalPerWeightStepPhp,
          },
          international: {
            baseFeePhp: pricing.shipping.areaRates.international.baseFeePhp,
            additionalPerWeightStepPhp: pricing.shipping.areaRates.international.additionalPerWeightStepPhp,
          },
        },
      },
    },
  };
}
