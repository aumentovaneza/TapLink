import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { motion, useScroll, useTransform } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Package,
  Palette,
  PawPrint,
  Ruler,
  Sparkles,
  Type,
  Truck,
  Zap,
} from "lucide-react";

import { ApiError, apiRequest } from "../lib/api";
import {
  defaultHardwareColors,
  normalizeHardwareColorCatalog,
  type HardwareColorCatalog,
  type ProductType,
} from "../lib/hardware-options";
import {
  computeOrderPriceBreakdown,
  defaultOrderPricingConfig,
  normalizeOrderPricingConfig,
  shippingAreaOptions,
  type OrderPricingConfig,
  type PerTypeProductPricing,
  type ShippingAreaCode,
} from "../lib/order-pricing";
import { PROFILE_TYPES, type ProfileType } from "../lib/profile-types";
import { SUBSCRIPTION_TIERS } from "../lib/subscription-tiers";

interface ProductSpecSummary {
  type: ProductType;
  displayName: string;
  physical: {
    widthMm: number;
    heightMm: number;
    thicknessMm: number;
  };
  constraints: {
    text: {
      maxCharacters: number;
      maxLines: number;
    };
    icon: {
      minSizeMm: number;
      maxSizeMm: number;
    };
  };
}

interface SpecsResponse {
  specs: {
    products: Record<ProductType, ProductSpecSummary>;
  };
  options?: {
    colors?: unknown;
    pricing?: unknown;
  };
}

function getUnitPrice(productPrice: number | PerTypeProductPricing, profileType?: ProfileType | null): number {
  if (typeof productPrice === "number") return productPrice;
  if (profileType && profileType in productPrice) return productPrice[profileType];
  return productPrice.items;
}

const profileTypeIcons: Record<ProfileType, typeof Package> = {
  items: Package,
  pets: PawPrint,
  business: Building2,
  creator: Sparkles,
  event: Calendar,
};

function countSelectableColors(items: HardwareColorCatalog[ProductType]): number {
  return items.filter((color) => color.available && color.plaStock > 0).length;
}

export function Pricing() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [pricing, setPricing] = useState<OrderPricingConfig>(defaultOrderPricingConfig);
  const [colors, setColors] = useState<HardwareColorCatalog>(defaultHardwareColors);
  const [specs, setSpecs] = useState<Record<ProductType, ProductSpecSummary> | null>(null);
  const [profileType, setProfileType] = useState<ProfileType>("items");
  const [productType, setProductType] = useState<ProductType>("tag");
  const [quantity, setQuantity] = useState(1);
  const [shippingAreaCode, setShippingAreaCode] = useState<ShippingAreaCode>("luzon");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiRequest<SpecsResponse>("/configurator/specs");
        if (cancelled) {
          return;
        }
        if (response.options?.pricing) {
          setPricing(normalizeOrderPricingConfig(response.options.pricing));
        }
        if (response.options?.colors) {
          setColors(normalizeHardwareColorCatalog(response.options.colors));
        }
        if (response.specs?.products) {
          setSpecs(response.specs.products);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const fallbackMessage =
          err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Unable to load pricing data.";
        setError(fallbackMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const breakdown = useMemo(
    () =>
      computeOrderPriceBreakdown({
        productType,
        quantity,
        pricing,
        profileType,
        shippingDestination: {
          areaCode: shippingAreaCode,
        },
      }),
    [pricing, productType, profileType, quantity, shippingAreaCode]
  );

  const tagSelectableColors = countSelectableColors(colors.tag);
  const cardSelectableColors = countSelectableColors(colors.card);

  const priceExamples = [
    { qty: 1, label: "Starter" },
    { qty: 5, label: "Small batch" },
    { qty: 10, label: "Team set" },
  ].map((item) => ({
    ...item,
    cost: computeOrderPriceBreakdown({
      productType,
      quantity: item.qty,
      pricing,
      profileType,
      shippingDestination: { areaCode: shippingAreaCode },
    }).totalPhp,
  }));

  const parallaxRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: parallaxRef,
    offset: ["start end", "end start"],
  });
  const orbOneY = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const orbTwoY = useTransform(scrollYProgress, [0, 1], [-80, 110]);
  const cardYSlow = useTransform(scrollYProgress, [0, 1], [48, -42]);
  const cardYMid = useTransform(scrollYProgress, [0, 1], [78, -64]);
  const cardYFast = useTransform(scrollYProgress, [0, 1], [112, -86]);

  const featureCards = [
    {
      icon: Palette,
      title: "In-stock PLA color selection",
      description: `${tagSelectableColors} selectable tag colors and ${cardSelectableColors} selectable card colors from current inventory.`,
    },
    {
      icon: Type,
      title: "Primary and secondary text",
      description: specs
        ? `Tag: ${specs.tag.constraints.text.maxCharacters} chars, ${specs.tag.constraints.text.maxLines} line(s). Card: ${specs.card.constraints.text.maxCharacters} chars, ${specs.card.constraints.text.maxLines} line(s).`
        : "Per-product text limits are enforced directly in the customization flow.",
    },
    {
      icon: Sparkles,
      title: "Icon style customization",
      description: "Select icon style and icon color to match your hardware body and brand identity.",
    },
    {
      icon: Ruler,
      title: "Print-safe hardware specs",
      description: specs
        ? `Tag icon range: ${specs.tag.constraints.icon.minSizeMm}mm to ${specs.tag.constraints.icon.maxSizeMm}mm. Card icon range: ${specs.card.constraints.icon.minSizeMm}mm to ${specs.card.constraints.icon.maxSizeMm}mm.`
        : "Layout zones are constrained to production-ready print-safe dimensions.",
    },
    {
      icon: CheckCircle2,
      title: "Default design option",
      description: "Skip manual customization and place an order using the ready-made default design.",
    },
    {
      icon: Truck,
      title: "Area + weight shipping computation",
      description: "Shipping is calculated by destination zone and billable weight, then already covered in your displayed all-in total.",
    },
  ];

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}>
      <section className={`relative overflow-hidden border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: isDark
              ? "radial-gradient(95% 90% at 10% 10%, rgba(220,38,38,0.32), transparent 56%), radial-gradient(80% 80% at 90% 0%, rgba(234,88,12,0.25), transparent 58%)"
              : "radial-gradient(90% 90% at 12% 10%, rgba(220,38,38,0.14), transparent 58%), radial-gradient(85% 85% at 90% 0%, rgba(234,88,12,0.14), transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <p
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                  isDark ? "bg-slate-900/70 text-orange-300 border border-orange-400/30" : "bg-orange-50 text-orange-700 border border-orange-200"
                }`}
                style={{ fontWeight: 700 }}
              >
                <Zap size={13} />
                Hardware Pricing
              </p>
              <h1
                className={`mt-4 ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ fontSize: "clamp(2rem, 4.8vw, 3.4rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08 }}
              >
                Destination-Aware Shipping
                <br />
                <span style={{ background: "linear-gradient(135deg, #DC2626, #EA580C, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Already Included
                </span>
              </h1>
              <p className={`mt-5 max-w-2xl text-base sm:text-lg ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ lineHeight: 1.7 }}>
                Pricing now considers shipping area and billable weight, while keeping checkout simple with an all-in total and no surprise add-on charge.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/hardware-setup"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 700 }}
                >
                  Customize Hardware
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/templates"
                  className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm transition-all ${
                    isDark ? "border-slate-700 text-slate-200 hover:bg-slate-900" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  See Profile Templates
                </Link>
              </div>
              {error && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-500">
                  <AlertCircle size={13} />
                  {error}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className={`rounded-2xl border p-5 ${isDark ? "border-slate-700 bg-slate-900/90" : "border-slate-200 bg-white/95"} backdrop-blur-sm`}
            >
              <p className={`text-xs uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 700 }}>
                Live All-in Estimate
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {PROFILE_TYPES.map((pt) => {
                  const Icon = profileTypeIcons[pt.id];
                  const isActive = profileType === pt.id;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => setProfileType(pt.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                        isActive
                          ? isDark
                            ? "bg-orange-500/15 border border-orange-400/50 text-orange-300"
                            : "bg-orange-50 border border-orange-300 text-orange-700"
                          : isDark
                          ? "border border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                          : "border border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      }`}
                      style={{ fontWeight: isActive ? 700 : 500 }}
                    >
                      <Icon size={12} />
                      {pt.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["tag", "card"] as ProductType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductType(type)}
                    className={`rounded-xl border px-3 py-2 text-left transition-all ${
                      productType === type
                        ? isDark
                          ? "border-orange-400/50 bg-orange-500/10 text-white"
                          : "border-orange-300 bg-orange-50 text-slate-900"
                        : isDark
                        ? "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs" style={{ fontWeight: 700 }}>
                      {type === "tag" ? "NFC Tag" : "NFC Card"}
                    </p>
                    <p className={`mt-0.5 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      PHP {getUnitPrice(pricing.products[type], profileType).toLocaleString("en-PH")} / unit
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <label className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`} style={{ fontWeight: 700 }}>
                    Destination Area
                  </label>
                  <select
                    value={shippingAreaCode}
                    onChange={(event) => setShippingAreaCode(event.target.value as ShippingAreaCode)}
                    className={`mt-1.5 h-9 w-full rounded-lg border px-2 text-sm outline-none ${
                      isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {shippingAreaOptions.map((area) => (
                      <option key={area.code} value={area.code}>
                        {area.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <label className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`} style={{ fontWeight: 700 }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={quantity}
                      onChange={(event) => {
                        const parsed = Number.parseInt(event.target.value, 10);
                        setQuantity(Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(20, parsed)));
                      }}
                      className={`h-8 w-20 rounded-lg border px-2 text-sm outline-none ${
                        isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-300 bg-white text-slate-700"
                      }`}
                    />
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Math.min(20, Number.parseInt(event.target.value, 10) || 1)))}
                    className="mt-3 w-full accent-orange-500"
                  />
                </div>
              </div>

              <div className={`mt-4 space-y-1 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                <p>Items: PHP {breakdown.itemSubtotalPhp.toLocaleString("en-PH")}</p>
                <p>
                  Shipping coverage ({breakdown.shippingAreaLabel}): PHP {breakdown.shippingFeePhp.toLocaleString("en-PH")}
                </p>
                <p>
                  Weight: {breakdown.totalWeightGrams}g, billable {breakdown.billableWeightGrams}g
                </p>
                <p className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 800 }}>
                  All-in total: PHP {breakdown.totalPhp.toLocaleString("en-PH")}
                </p>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                  Shipping is already part of the shown total.
                </p>
              </div>

              <div className={`mt-4 rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                <p className={`text-[11px] uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-500"}`} style={{ fontWeight: 700 }}>
                  Quick Totals
                </p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {priceExamples.map((example) => (
                    <div key={`${productType}-${shippingAreaCode}-${example.qty}`} className={`rounded-lg border px-2.5 py-2 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
                      <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 700 }}>
                        {example.label}
                      </p>
                      <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        {example.qty} unit{example.qty > 1 ? "s" : ""}
                      </p>
                      <p className={`text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                        PHP {example.cost.toLocaleString("en-PH")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className={`py-12 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-2xl border p-5 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-2">
                <Zap size={16} className={isDark ? "text-orange-300" : "text-orange-600"} />
                <p className={`${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight: 700 }}>
                  NFC Tag
                </p>
              </div>
              <p className="mt-2 text-2xl" style={{ fontWeight: 800 }}>
                PHP {getUnitPrice(pricing.products.tag, profileType).toLocaleString("en-PH")}
              </p>
              <p className={`mt-0.5 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>base per unit ({PROFILE_TYPES.find((pt) => pt.id === profileType)?.label})</p>
            </div>

            <div className={`rounded-2xl border p-5 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-2">
                <CreditCard size={16} className={isDark ? "text-orange-300" : "text-orange-600"} />
                <p className={`${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight: 700 }}>
                  NFC Card
                </p>
              </div>
              <p className="mt-2 text-2xl" style={{ fontWeight: 800 }}>
                PHP {getUnitPrice(pricing.products.card, profileType).toLocaleString("en-PH")}
              </p>
              <p className={`mt-0.5 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>base per unit ({PROFILE_TYPES.find((pt) => pt.id === profileType)?.label})</p>
            </div>

            <div className={`rounded-2xl border p-5 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-2">
                <Truck size={16} className={isDark ? "text-orange-300" : "text-orange-600"} />
                <p className={`${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight: 700 }}>
                  Shipping
                </p>
              </div>
              <p className="mt-2 text-sm" style={{ fontWeight: 700 }}>
                Based on destination area + billable weight
              </p>
              <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Covered in your displayed all-in total so there are no extra checkout surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`py-12 ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className={isDark ? "text-white" : "text-slate-900"} style={{ fontSize: "clamp(1.45rem, 3vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Subscription Tiers
            </h2>
            <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Some profile types include optional subscription plans for advanced features.
            </p>
          </div>

          <div className="mt-3 mb-6 flex flex-wrap gap-1.5">
            {PROFILE_TYPES.map((pt) => {
              const Icon = profileTypeIcons[pt.id];
              const isActive = profileType === pt.id;
              return (
                <button
                  key={pt.id}
                  onClick={() => setProfileType(pt.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                    isActive
                      ? isDark
                        ? "bg-orange-500/15 border border-orange-400/50 text-orange-300"
                        : "bg-orange-50 border border-orange-300 text-orange-700"
                      : isDark
                      ? "border border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                      : "border border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                  style={{ fontWeight: isActive ? 700 : 500 }}
                >
                  <Icon size={12} />
                  {pt.label}
                </button>
              );
            })}
          </div>

          {(() => {
            const tierConfig = SUBSCRIPTION_TIERS[profileType];
            if (!tierConfig.hasSubscription) {
              return (
                <div className={`rounded-2xl border p-6 text-center ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <CheckCircle2 size={28} className={isDark ? "text-green-400 mx-auto" : "text-green-600 mx-auto"} />
                  <p className={`mt-3 text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight: 700 }}>
                    One-time purchase, no subscription needed
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {profileType === "items" ? "Items" : "Pets"} profiles are fully functional with just a hardware purchase.
                  </p>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tierConfig.tiers.map((tier) => {
                  const isPopular = tier.tier === "basic";
                  return (
                    <div
                      key={tier.tier}
                      className={`rounded-2xl border p-5 relative ${
                        isPopular
                          ? isDark
                            ? "border-orange-400/50 bg-orange-500/5"
                            : "border-orange-300 bg-orange-50/50"
                          : isDark
                          ? "border-slate-700 bg-slate-950"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      {isPopular && (
                        <span
                          className="absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] text-white"
                          style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 700 }}
                        >
                          Popular
                        </span>
                      )}
                      <p className={`text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight: 700 }}>
                        {tier.label}
                      </p>
                      <p className="mt-2 text-2xl" style={{ fontWeight: 800 }}>
                        {tier.monthlyPricePhp === 0 ? (
                          "Free"
                        ) : (
                          <>
                            PHP {tier.monthlyPricePhp.toLocaleString("en-PH")}
                            <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 500 }}>
                              /mo
                            </span>
                          </>
                        )}
                      </p>
                      <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {tier.tier === "free"
                          ? "Basic features included"
                          : tier.tier === "basic"
                          ? "Expanded features and customization"
                          : "Full access to all premium features"}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      <section ref={parallaxRef} className={`relative overflow-hidden py-16 ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <motion.div
          style={{ y: orbOneY }}
          className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full blur-3xl"
          aria-hidden
        >
          <div className="h-full w-full rounded-full bg-orange-500/20" />
        </motion.div>
        <motion.div
          style={{ y: orbTwoY }}
          className="pointer-events-none absolute -right-16 bottom-8 h-80 w-80 rounded-full blur-3xl"
          aria-hidden
        >
          <div className="h-full w-full rounded-full bg-amber-400/15" />
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className={isDark ? "text-white" : "text-slate-900"} style={{ fontSize: "clamp(1.45rem, 3vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Hardware Customization Features
            </h2>
            <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Parallax overview of what you can tune before placing an order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map((item, index) => {
              const y = index % 3 === 0 ? cardYSlow : index % 3 === 1 ? cardYMid : cardYFast;
              return (
                <motion.div
                  key={item.title}
                  style={{ y }}
                  className={`rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-950/90" : "border-slate-200 bg-slate-50/95"} backdrop-blur-sm`}
                >
                  <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: isDark ? "rgba(251,146,60,0.12)" : "rgba(251,146,60,0.18)" }}>
                    <item.icon size={16} className={isDark ? "text-orange-300" : "text-orange-600"} />
                  </div>
                  <p className={`${isDark ? "text-white" : "text-slate-900"} text-sm`} style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`} style={{ lineHeight: 1.6 }}>
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #DC2626 0%, #EA580C 55%, #F59E0B 100%)" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-white" style={{ fontSize: "clamp(1.4rem, 2.6vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Ready to Place a Hardware Order?
          </h3>
          <p className="mt-3 text-white/85 text-sm sm:text-base" style={{ lineHeight: 1.7 }}>
            Pick tag or card, customize the design, confirm shipping details, and check out with one all-in total.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/hardware-setup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm text-orange-700 transition-all hover:bg-slate-100"
              style={{ fontWeight: 700 }}
            >
              Start Hardware Setup
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/claim"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm text-white transition-all hover:bg-white/10"
              style={{ fontWeight: 600 }}
            >
              Activate Existing Tag
            </Link>
          </div>
          {!loading && (
            <p className="mt-4 text-xs text-white/70">
              Prices shown are from the latest active configuration.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
