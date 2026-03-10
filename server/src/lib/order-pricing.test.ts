import assert from "node:assert/strict";
import test from "node:test";

import {
  computeOrderPriceBreakdown,
  defaultOrderPricingConfig,
  defaultPerTypeTagPricing,
  defaultPerTypeCardPricing,
  resolveOrderPricingFromConfig,
  resolveShippingAreaCode,
  withOrderPricingConfig,
  type PerTypeProductPricing,
} from "./order-pricing";

test("resolveOrderPricingFromConfig returns defaults when config is missing", () => {
  const pricing = resolveOrderPricingFromConfig(null);
  assert.deepEqual(pricing, defaultOrderPricingConfig);
});

test("resolveOrderPricingFromConfig supports legacy flat shipping config", () => {
  const pricing = resolveOrderPricingFromConfig({
    orderPricing: {
      currency: "PHP",
      products: {
        tag: "700",
        card: 1200,
      },
      shipping: {
        flatFeePhp: "200",
        label: "Covered shipping",
      },
    },
  });

  assert.equal(pricing.products.tag, 700);
  assert.equal(pricing.products.card, 1200);
  assert.equal(pricing.shipping.flatFeePhp, 200);
  assert.equal(pricing.shipping.areaRates.luzon.baseFeePhp, 200);
  assert.equal(pricing.shipping.areaRates.metro_manila.baseFeePhp, 170);
  assert.equal(pricing.shipping.areaRates.visayas.baseFeePhp, 270);
  assert.equal(pricing.shipping.areaRates.mindanao.baseFeePhp, 310);
});

test("resolveShippingAreaCode resolves area from destination", () => {
  assert.equal(
    resolveShippingAreaCode({ country: "Philippines", city: "Taguig" }),
    "metro_manila"
  );
  assert.equal(
    resolveShippingAreaCode({ country: "Philippines", province: "Cebu" }),
    "visayas"
  );
  assert.equal(
    resolveShippingAreaCode({ country: "Philippines", city: "Davao City" }),
    "mindanao"
  );
  assert.equal(
    resolveShippingAreaCode({ country: "Japan", city: "Tokyo" }),
    "international"
  );
});

test("computeOrderPriceBreakdown uses area and weight-based shipping", () => {
  const pricing = resolveOrderPricingFromConfig({
    orderPricing: {
      products: { tag: 650, card: 950 },
      shipping: { flatFeePhp: 120, label: "Shipping included" },
    },
  });

  const breakdown = computeOrderPriceBreakdown({
    productType: "card",
    quantity: 10,
    pricing,
    shippingDestination: {
      country: "Philippines",
      province: "Cebu",
    },
  });

  assert.deepEqual(breakdown, {
    currency: "PHP",
    unitPricePhp: 950,
    quantity: 10,
    itemSubtotalPhp: 9500,
    shippingFeePhp: 222,
    totalPhp: 9722,
    shippingLabel: "Shipping included",
    shippingAreaCode: "visayas",
    shippingAreaLabel: "Visayas",
    totalWeightGrams: 420,
    billableWeightGrams: 500,
    shippingWeightSurchargePhp: 60,
    shippingIncludedInDisplayedPrice: true,
  });
});

test("withOrderPricingConfig merges full pricing config", () => {
  const next = withOrderPricingConfig(
    { visibility: "public" },
    defaultOrderPricingConfig
  );

  assert.equal(next.visibility, "public");
  assert.deepEqual(
    (next.orderPricing as { shipping: { areaRates: { international: { baseFeePhp: number } } } }).shipping.areaRates
      .international.baseFeePhp,
    defaultOrderPricingConfig.shipping.areaRates.international.baseFeePhp
  );
});

// --- Per-type pricing tests ---

test("defaultOrderPricingConfig has per-type pricing for tag and card", () => {
  const tag = defaultOrderPricingConfig.products.tag;
  const card = defaultOrderPricingConfig.products.card;

  // tag should be a PerTypeProductPricing object, not a flat number
  assert.equal(typeof tag, "object");
  assert.deepEqual(tag, {
    items: 399,
    pets: 499,
    business: 799,
    creator: 599,
    event: 599,
  });
  assert.deepEqual(tag, defaultPerTypeTagPricing);

  // card should also be a PerTypeProductPricing object
  assert.equal(typeof card, "object");
  assert.deepEqual(card, {
    items: 599,
    pets: 699,
    business: 999,
    creator: 799,
    event: 799,
  });
  assert.deepEqual(card, defaultPerTypeCardPricing);
});

test("resolveOrderPricingFromConfig preserves per-type product pricing", () => {
  const customTag: PerTypeProductPricing = {
    items: 300,
    pets: 400,
    business: 700,
    creator: 500,
    event: 500,
  };
  const customCard: PerTypeProductPricing = {
    items: 500,
    pets: 600,
    business: 900,
    creator: 700,
    event: 700,
  };

  const pricing = resolveOrderPricingFromConfig({
    orderPricing: {
      products: {
        tag: customTag,
        card: customCard,
      },
      shipping: { flatFeePhp: 120, label: "Ship it" },
    },
  });

  assert.deepEqual(pricing.products.tag, customTag);
  assert.deepEqual(pricing.products.card, customCard);
});

test("resolveOrderPricingFromConfig returns flat number for legacy flat product price", () => {
  const pricing = resolveOrderPricingFromConfig({
    orderPricing: {
      products: {
        tag: 600,
        card: 1000,
      },
      shipping: { flatFeePhp: 120, label: "Flat" },
    },
  });

  assert.equal(typeof pricing.products.tag, "number");
  assert.equal(pricing.products.tag, 600);
  assert.equal(typeof pricing.products.card, "number");
  assert.equal(pricing.products.card, 1000);
});

test("computeOrderPriceBreakdown uses profileType to select per-type price", () => {
  const pricing = resolveOrderPricingFromConfig({
    orderPricing: {
      products: {
        tag: { items: 399, pets: 499, business: 799, creator: 599, event: 599 },
        card: { items: 599, pets: 699, business: 999, creator: 799, event: 799 },
      },
      shipping: { flatFeePhp: 120, label: "Shipping included" },
    },
  });

  const breakdown = computeOrderPriceBreakdown({
    productType: "tag",
    quantity: 1,
    pricing,
    profileType: "business",
    shippingDestination: { country: "Philippines", city: "Makati" },
  });

  assert.equal(breakdown.unitPricePhp, 799);
});

test("computeOrderPriceBreakdown defaults to items price when profileType is not provided", () => {
  const pricing = resolveOrderPricingFromConfig({
    orderPricing: {
      products: {
        tag: { items: 399, pets: 499, business: 799, creator: 599, event: 599 },
        card: { items: 599, pets: 699, business: 999, creator: 799, event: 799 },
      },
      shipping: { flatFeePhp: 120, label: "Shipping included" },
    },
  });

  const breakdown = computeOrderPriceBreakdown({
    productType: "tag",
    quantity: 1,
    pricing,
    shippingDestination: { country: "Philippines", city: "Makati" },
  });

  assert.equal(breakdown.unitPricePhp, 399);
});

test("withOrderPricingConfig preserves per-type pricing through round-trip", () => {
  const original = defaultOrderPricingConfig;
  const wrapped = withOrderPricingConfig({ visibility: "public" }, original);
  const restored = resolveOrderPricingFromConfig(wrapped);

  assert.deepEqual(restored.products.tag, original.products.tag);
  assert.deepEqual(restored.products.card, original.products.card);
});
