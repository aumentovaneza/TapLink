import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  BadgeCheck,
  Banknote,
  Bell,
  BedDouble,
  Bike,
  BookOpen,
  BookUser,
  Bot,
  Brain,
  Briefcase,
  Brush,
  Building2,
  Bus,
  Cake,
  Calculator,
  CalendarDays,
  Camera,
  Car,
  Castle,
  Check,
  ChefHat,
  CircleDollarSign,
  Clapperboard,
  ClipboardList,
  Cloud,
  Code2,
  Coffee,
  Compass,
  Cpu,
  Crown,
  Diamond,
  Dog,
  DollarSign,
  DoorOpen,
  Dumbbell,
  Factory,
  Feather,
  Film,
  Flag,
  Flame,
  Flower2,
  Fuel,
  Gamepad2,
  Gem,
  Gift,
  Globe2,
  GraduationCap,
  Hammer,
  Handshake,
  Headphones,
  Heart,
  Home,
  Hospital,
  Hotel,
  Image,
  KeyRound,
  Laptop,
  Leaf,
  Library,
  Lightbulb,
  Lock,
  MapPin,
  Medal,
  Megaphone,
  Mic2,
  Mountain,
  Music2,
  Package,
  Palette,
  Paintbrush,
  PawPrint,
  PenTool,
  Phone,
  Plane,
  Pizza,
  Rocket,
  ScanLine,
  School,
  Send,
  Server,
  Ship,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Sun,
  Tablet,
  Ticket,
  Train,
  TreePine,
  Trophy,
  Truck,
  Upload,
  User,
  Users,
  Utensils,
  Wallet,
  Watch,
  Wifi,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ApiError, apiRequest } from "../lib/api";
import {
  defaultHardwareColors,
  type HardwareColorCatalog,
  type HardwareColorOption,
  normalizeHardwareColorCatalog,
  type ProductType,
} from "../lib/hardware-options";
import {
  computeOrderPriceBreakdown,
  defaultOrderPricingConfig,
  normalizeOrderPricingConfig,
  type OrderPricingConfig,
} from "../lib/order-pricing";
import { PROFILE_TYPES, BUSINESS_CATEGORIES, type ProfileType, type BusinessCategory } from "../lib/profile-types";
import { getAccessToken } from "../lib/session";

interface ProductZone {
  id: string;
  label: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

interface ProductSpec {
  type: ProductType;
  displayName: string;
  units: "mm";
  physical: {
    widthMm: number;
    heightMm: number;
    thicknessMm: number;
    cornerRadiusMm: number;
  };
  zones: {
    printSafe: ProductZone[];
    blocked: ProductZone[];
  };
  constraints: {
    text: {
      maxCharacters: number;
      maxLines: number;
      minFontSizeMm: number;
      minStrokeWidthMm: number;
    };
    icon: {
      minSizeMm: number;
      maxSizeMm: number;
    };
    logo: {
      allowed: boolean;
      maxWidthMm: number;
      maxHeightMm: number;
    };
  };
}

interface SpecsBundle {
  version: string;
  releasedAt: string;
  units: "mm";
  products: Record<ProductType, ProductSpec>;
}

interface SpecsResponse {
  specs: SpecsBundle;
  options?: {
    colors?: unknown;
    pricing?: unknown;
  };
}

interface CreateOrderResponse {
  order: {
    id: string;
    status: string;
    payment?: {
      amountPhp?: number;
      status?: string;
    };
    pricing?: {
      totalPhp?: number;
    };
  };
}

interface DesignState {
  baseColor: string;
  textColor: string;
  iconColor: string;
  primaryText: string;
  secondaryText: string;
  iconId: string;
  logoSvg: string | null;
}

interface ShippingFormState {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  notes: string;
  confirm: boolean;
}

const iconChoices: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "wifi", label: "NFC", icon: Wifi },
  { id: "zap", label: "Flash", icon: Zap },
  { id: "briefcase", label: "Business", icon: Briefcase },
  { id: "user", label: "Personal", icon: User },
  { id: "building", label: "Brand", icon: Building2 },
  { id: "store", label: "Store", icon: Store },
  { id: "shopping", label: "Shop", icon: ShoppingBag },
  { id: "coffee", label: "Cafe", icon: Coffee },
  { id: "utensils", label: "Food", icon: Utensils },
  { id: "chef", label: "Chef", icon: ChefHat },
  { id: "paw", label: "Pet", icon: PawPrint },
  { id: "dog", label: "Dog", icon: Dog },
  { id: "heart", label: "Health", icon: Heart },
  { id: "stethoscope", label: "Medical", icon: Stethoscope },
  { id: "dumbbell", label: "Fitness", icon: Dumbbell },
  { id: "graduation", label: "Education", icon: GraduationCap },
  { id: "camera", label: "Photo", icon: Camera },
  { id: "video", label: "Video", icon: Clapperboard },
  { id: "music", label: "Music", icon: Music2 },
  { id: "mic", label: "Podcast", icon: Mic2 },
  { id: "creator", label: "Creator", icon: Sparkles },
  { id: "megaphone", label: "Marketing", icon: Megaphone },
  { id: "lightbulb", label: "Ideas", icon: Lightbulb },
  { id: "rocket", label: "Startup", icon: Rocket },
  { id: "shield", label: "Security", icon: ShieldCheck },
  { id: "wrench", label: "Service", icon: Wrench },
  { id: "home", label: "Home", icon: Home },
  { id: "location", label: "Location", icon: MapPin },
  { id: "bed", label: "Hospitality", icon: BedDouble },
  { id: "leaf", label: "Eco", icon: Leaf },
  { id: "gift", label: "Gift", icon: Gift },
  { id: "ticket", label: "Event", icon: Ticket },
  { id: "calendar", label: "Schedule", icon: CalendarDays },
  { id: "handshake", label: "Partnership", icon: Handshake },
  { id: "globe", label: "Global", icon: Globe2 },
  { id: "at-sign", label: "Contact", icon: AtSign },
  { id: "badge", label: "Verified", icon: BadgeCheck },
  { id: "star", label: "Premium", icon: Star },
  { id: "plane", label: "Travel", icon: Plane },
  { id: "bike", label: "Cycling", icon: Bike },
  { id: "car", label: "Automotive", icon: Car },
  { id: "banknote", label: "Finance", icon: Banknote },
  { id: "phone", label: "Call", icon: Phone },
  { id: "flame", label: "Hot", icon: Flame },
  { id: "gamepad", label: "Gaming", icon: Gamepad2 },
  { id: "bell", label: "Notifications", icon: Bell },
  { id: "book-open", label: "Book", icon: BookOpen },
  { id: "book-user", label: "Directory", icon: BookUser },
  { id: "bot", label: "AI Bot", icon: Bot },
  { id: "brain", label: "Learning", icon: Brain },
  { id: "brush", label: "Art", icon: Brush },
  { id: "bus", label: "Transit", icon: Bus },
  { id: "cake", label: "Celebration", icon: Cake },
  { id: "calculator", label: "Accounting", icon: Calculator },
  { id: "castle", label: "Attraction", icon: Castle },
  { id: "circle-dollar", label: "Pricing", icon: CircleDollarSign },
  { id: "clipboard-list", label: "Checklist", icon: ClipboardList },
  { id: "cloud", label: "Cloud", icon: Cloud },
  { id: "code", label: "Developer", icon: Code2 },
  { id: "compass", label: "Direction", icon: Compass },
  { id: "cpu", label: "Tech", icon: Cpu },
  { id: "crown", label: "VIP", icon: Crown },
  { id: "diamond", label: "Luxury", icon: Diamond },
  { id: "dollar", label: "Payments", icon: DollarSign },
  { id: "door-open", label: "Open", icon: DoorOpen },
  { id: "factory", label: "Manufacturing", icon: Factory },
  { id: "feather", label: "Writing", icon: Feather },
  { id: "film", label: "Cinema", icon: Film },
  { id: "flag", label: "Flag", icon: Flag },
  { id: "flower", label: "Floral", icon: Flower2 },
  { id: "fuel", label: "Fuel", icon: Fuel },
  { id: "gem", label: "Gem", icon: Gem },
  { id: "hammer", label: "Construction", icon: Hammer },
  { id: "headphones", label: "Audio", icon: Headphones },
  { id: "hospital", label: "Hospital", icon: Hospital },
  { id: "hotel", label: "Hotel", icon: Hotel },
  { id: "image", label: "Gallery", icon: Image },
  { id: "key", label: "Access", icon: KeyRound },
  { id: "laptop", label: "Laptop", icon: Laptop },
  { id: "library", label: "Library", icon: Library },
  { id: "lock", label: "Private", icon: Lock },
  { id: "medal", label: "Achievement", icon: Medal },
  { id: "mountain", label: "Outdoors", icon: Mountain },
  { id: "package", label: "Delivery", icon: Package },
  { id: "paintbrush", label: "Paint", icon: Paintbrush },
  { id: "pen-tool", label: "Design", icon: PenTool },
  { id: "pizza", label: "Pizza", icon: Pizza },
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "school", label: "School", icon: School },
  { id: "send", label: "Send", icon: Send },
  { id: "server", label: "Server", icon: Server },
  { id: "ship", label: "Shipping", icon: Ship },
  { id: "cart", label: "Cart", icon: ShoppingCart },
  { id: "sun", label: "Day", icon: Sun },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "train", label: "Train", icon: Train },
  { id: "tree", label: "Nature", icon: TreePine },
  { id: "trophy", label: "Trophy", icon: Trophy },
  { id: "truck", label: "Truck", icon: Truck },
  { id: "users", label: "Team", icon: Users },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "watch", label: "Watch", icon: Watch },
];

const searchableIconChoices = iconChoices.map((choice) => ({
  ...choice,
  search: `${choice.label} ${choice.id}`.toLowerCase(),
}));

const fallbackSpecs: SpecsBundle = {
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
          { id: "tag-text-primary", label: "Primary Text", xMm: 4, yMm: 18, widthMm: 24, heightMm: 9 },
          { id: "tag-icon-or-logo", label: "Icon or Logo", xMm: 10, yMm: 7, widthMm: 12, heightMm: 8 },
        ],
        blocked: [{ id: "tag-nfc-reserved", label: "NFC Reserved Area", xMm: 11, yMm: 27, widthMm: 10, heightMm: 4 }],
      },
      constraints: {
        text: { maxCharacters: 18, maxLines: 2, minFontSizeMm: 1.2, minStrokeWidthMm: 0.3 },
        icon: { minSizeMm: 6, maxSizeMm: 12 },
        logo: { allowed: true, maxWidthMm: 12, maxHeightMm: 8 },
      },
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
          { id: "card-text-primary", label: "Primary Text", xMm: 5, yMm: 29, widthMm: 48, heightMm: 18 },
          { id: "card-text-secondary", label: "Secondary Text", xMm: 5, yMm: 16, widthMm: 48, heightMm: 10 },
          { id: "card-icon-or-logo", label: "Icon or Logo", xMm: 57, yMm: 9, widthMm: 23, heightMm: 23 },
        ],
        blocked: [{ id: "card-nfc-reserved", label: "NFC Reserved Area", xMm: 3, yMm: 3, widthMm: 14, heightMm: 12 }],
      },
      constraints: {
        text: { maxCharacters: 48, maxLines: 4, minFontSizeMm: 1.1, minStrokeWidthMm: 0.2 },
        icon: { minSizeMm: 8, maxSizeMm: 23 },
        logo: { allowed: true, maxWidthMm: 23, maxHeightMm: 23 },
      },
    },
  },
};

const defaultDesignByType: Record<ProductType, DesignState> = {
  tag: {
    baseColor: "#111827",
    textColor: "#F8FAFC",
    iconColor: "#EA580C",
    primaryText: "Tap to connect",
    secondaryText: "",
    iconId: "wifi",
    logoSvg: null,
  },
  card: {
    baseColor: "#0F172A",
    textColor: "#F8FAFC",
    iconColor: "#D97706",
    primaryText: "Alex Rivera",
    secondaryText: "Digital Card",
    iconId: "briefcase",
    logoSvg: null,
  },
};

const defaultShippingForm: ShippingFormState = {
  fullName: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Philippines",
  notes: "",
  confirm: false,
};

const iconMap: Record<string, LucideIcon> = Object.fromEntries(iconChoices.map((choice) => [choice.id, choice.icon]));

function findZone(spec: ProductSpec, key: "text-primary" | "text-secondary" | "icon-or-logo"): ProductZone | null {
  return spec.zones.printSafe.find((zone) => zone.id.includes(key)) || null;
}

function isColorSelectable(option: HardwareColorOption): boolean {
  return option.available && option.plaStock > 0;
}

function pickFirstAvailableColor(options: HardwareColorOption[]): string {
  return options.find((option) => isColorSelectable(option))?.hex || options[0]?.hex || "#111827";
}

function clampText(value: string, maxCharacters: number): string {
  return value.slice(0, maxCharacters);
}

function zoneStyle(zone: ProductZone, spec: ProductSpec): CSSProperties {
  return {
    left: `${(zone.xMm / spec.physical.widthMm) * 100}%`,
    top: `${(zone.yMm / spec.physical.heightMm) * 100}%`,
    width: `${(zone.widthMm / spec.physical.widthMm) * 100}%`,
    height: `${(zone.heightMm / spec.physical.heightMm) * 100}%`,
  };
}

function swatchButtonBorder(isDark: boolean, selected: boolean): string {
  if (selected) {
    return isDark ? "2px solid #F59E0B" : "2px solid #EA580C";
  }
  return isDark ? "1px solid #334155" : "1px solid #E2E8F0";
}

function formatMm(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function validateShippingForm(shipping: ShippingFormState): string | null {
  if (!shipping.fullName.trim()) return "Recipient full name is required.";
  if (!shipping.phone.trim()) return "Phone number is required.";
  if (!shipping.line1.trim()) return "Address line 1 is required.";
  if (!shipping.city.trim()) return "City is required.";
  if (!shipping.province.trim()) return "Province/State is required.";
  if (!shipping.postalCode.trim()) return "Postal code is required.";
  if (!shipping.country.trim()) return "Country is required.";
  if (!shipping.confirm) return "Please confirm that the shipping information is correct.";
  return null;
}

export function HardwareSetup() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [profileType, setProfileType] = useState<ProfileType>("items");
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory | null>(null);
  const [productType, setProductType] = useState<ProductType>("tag");
  const [quantity, setQuantity] = useState(1);
  const [useDefaultDesign, setUseDefaultDesign] = useState(false);
  const [design, setDesign] = useState<DesignState>(defaultDesignByType.tag);
  const [specs, setSpecs] = useState<SpecsBundle>(fallbackSpecs);
  const [hardwareColors, setHardwareColors] = useState<HardwareColorCatalog>(defaultHardwareColors);
  const [orderPricing, setOrderPricing] = useState<OrderPricingConfig>(defaultOrderPricingConfig);
  const [shipping, setShipping] = useState<ShippingFormState>(defaultShippingForm);
  const [iconSearch, setIconSearch] = useState("");
  const [specError, setSpecError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderNotice, setOrderNotice] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/svg+xml" && !file.name.endsWith(".svg")) {
      setOrderError("Please upload an SVG file.");
      return;
    }

    if (file.size > 50_000) {
      setOrderError("SVG file must be under 50KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const svgContent = reader.result as string;
      setDesign((current) => ({ ...current, logoSvg: svgContent }));
      setOrderError("");
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-uploaded
    event.target.value = "";
  }, []);

  const currentSpec = specs.products[productType];
  const baseColorOptions = hardwareColors[productType];
  const selectableColorOptions = useMemo(
    () => baseColorOptions.filter((option) => isColorSelectable(option)),
    [baseColorOptions]
  );
  const filteredIconChoices = useMemo(() => {
    const query = iconSearch.trim().toLowerCase();
    if (!query) {
      return searchableIconChoices;
    }
    return searchableIconChoices.filter((choice) => choice.search.includes(query));
  }, [iconSearch]);
  const priceBreakdown = useMemo(
    () =>
      computeOrderPriceBreakdown({
        productType,
        quantity,
        pricing: orderPricing,
        profileType,
        shippingDestination: {
          country: shipping.country,
          province: shipping.province,
          city: shipping.city,
        },
      }),
    [orderPricing, productType, quantity, profileType, shipping.country, shipping.province, shipping.city]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSpecs() {
      try {
        const response = await apiRequest<SpecsResponse>("/configurator/specs");
        if (!cancelled && response?.specs?.products?.tag && response?.specs?.products?.card) {
          setSpecs(response.specs);
          if (response.options?.colors) {
            setHardwareColors(normalizeHardwareColorCatalog(response.options.colors));
          }
          if (response.options?.pricing) {
            setOrderPricing(normalizeOrderPricingConfig(response.options.pricing));
          }
          setSpecError("");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError) {
          setSpecError(error.message);
        } else if (error instanceof Error) {
          setSpecError(error.message);
        } else {
          setSpecError("Unable to load live hardware specs. Showing local defaults.");
        }
      }
    }

    void loadSpecs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDesign((current) => {
      const selectableHexes = new Set(selectableColorOptions.map((option) => option.hex));
      const fallbackHex = pickFirstAvailableColor(baseColorOptions);
      const normalizeColor = (value: string): string => (selectableHexes.has(value) ? value : fallbackHex);

      const seed = useDefaultDesign ? defaultDesignByType[productType] : current;
      const next: DesignState = {
        ...seed,
        baseColor: normalizeColor(seed.baseColor),
        textColor: normalizeColor(seed.textColor),
        iconColor: normalizeColor(seed.iconColor),
      };

      if (productType === "tag" && next.secondaryText) {
        next.secondaryText = "";
      }

      if (
        next.baseColor === current.baseColor &&
        next.textColor === current.textColor &&
        next.iconColor === current.iconColor &&
        next.primaryText === current.primaryText &&
        next.secondaryText === current.secondaryText &&
        next.iconId === current.iconId &&
        next.logoSvg === current.logoSvg
      ) {
        return current;
      }

      return next;
    });
  }, [baseColorOptions, productType, selectableColorOptions, useDefaultDesign]);

  const maxCharacters = currentSpec.constraints.text.maxCharacters;
  useEffect(() => {
    setDesign((current) => {
      const primaryText = clampText(current.primaryText, maxCharacters);
      const secondaryText = clampText(current.secondaryText, maxCharacters);
      if (primaryText === current.primaryText && secondaryText === current.secondaryText) {
        return current;
      }
      return { ...current, primaryText, secondaryText };
    });
  }, [maxCharacters]);

  const previewShape = useMemo<"card" | "teardrop" | "badge">(() => {
    if (profileType === "business" || profileType === "creator") return "card";
    if (profileType === "event") return "badge";
    return "teardrop"; // items, pets
  }, [profileType]);

  // Auto-set productType based on profile type
  useEffect(() => {
    if (profileType === "business" || profileType === "creator") {
      setProductType("card");
    } else {
      setProductType("tag");
    }
  }, [profileType]);

  const previewSize = useMemo(() => {
    if (previewShape === "card") {
      const baseWidth = 370;
      const ratio = currentSpec.physical.heightMm / currentSpec.physical.widthMm;
      return { width: baseWidth, height: Math.round(baseWidth * ratio) };
    }
    if (previewShape === "badge") return { width: 240, height: 320 };
    // teardrop — based on real NFC key fob ratio ~32×41mm
    return { width: 192, height: 246 };
  }, [currentSpec.physical.heightMm, currentSpec.physical.widthMm, previewShape]);

  const IconComponent = iconMap[design.iconId] || Wifi;
  const primaryTextZone = findZone(currentSpec, "text-primary");
  const secondaryTextZone = findZone(currentSpec, "text-secondary");
  const iconZone = findZone(currentSpec, "icon-or-logo");

  const updateDesign = <K extends keyof DesignState>(key: K, value: DesignState[K]) => {
    setDesign((current) => ({ ...current, [key]: value }));
  };

  const updateShipping = <K extends keyof ShippingFormState>(key: K, value: ShippingFormState[K]) => {
    setShipping((current) => ({ ...current, [key]: value }));
  };
  const shippingValidationError = validateShippingForm(shipping);

  const submitOrder = async () => {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    const shippingError = shippingValidationError;
    if (shippingError) {
      setOrderError(shippingError);
      return;
    }

    setSubmittingOrder(true);
    setOrderError("");
    setOrderNotice("");

    try {
      const response = await apiRequest<CreateOrderResponse>("/orders", {
        method: "POST",
        auth: true,
        body: {
          profileType,
          businessCategory: profileType === "business" ? businessCategory : undefined,
          productType,
          quantity,
          useDefaultDesign,
          design: {
            baseColor: design.baseColor,
            textColor: design.textColor,
            iconColor: design.iconColor,
            primaryText: design.primaryText || (productType === "card" ? "Digital Card" : "Tap to connect"),
            secondaryText: design.secondaryText,
            iconId: design.iconId,
            logoSvg: profileType === "business" ? design.logoSvg : undefined,
          },
          shipping: {
            fullName: shipping.fullName.trim(),
            phone: shipping.phone.trim(),
            email: shipping.email.trim(),
            line1: shipping.line1.trim(),
            line2: shipping.line2.trim(),
            city: shipping.city.trim(),
            province: shipping.province.trim(),
            postalCode: shipping.postalCode.trim(),
            country: shipping.country.trim(),
            notes: shipping.notes.trim(),
            confirm: shipping.confirm,
          },
        },
      });

      const totalPhp = response.order.pricing?.totalPhp ?? response.order.payment?.amountPhp;
      const amountLabel = typeof totalPhp === "number" ? ` (PHP ${totalPhp.toLocaleString("en-PH")})` : "";
      setOrderNotice(`Order #${response.order.id.slice(-8)} created${amountLabel}. Redirecting to payment...`);
      navigate(`/orders/${encodeURIComponent(response.order.id)}/payment`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate("/login");
        return;
      }
      setOrderError(error instanceof Error ? error.message : "Unable to submit order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className={`min-h-screen pt-20 pb-14 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(220,38,38,0.1), rgba(234,88,12,0.12))",
              border: "1px solid rgba(220,38,38,0.2)",
              color: "#EA580C",
            }}
          >
            <Palette size={14} />
            <span style={{ fontWeight: 600 }}>Tag/Card Hardware Configurator</span>
          </div>

          <h1
            className={`${isDark ? "text-white" : "text-slate-900"}`}
            style={{ fontSize: "clamp(2rem, 4vw, 2.9rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            Set Up Your NFC Tag or Card
          </h1>
          <p className={`mt-3 max-w-3xl text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Pick your hardware, customize available colors/text/icon, and watch it render in real time. Hardware and profile are linked together after activation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className={`rounded-3xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <p className={`mb-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight: 700 }}>
                1. Select profile type
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PROFILE_TYPES.map((pt) => {
                  const selected = profileType === pt.id;
                  const profileIconMap: Record<ProfileType, typeof Package> = {
                    items: Package,
                    pets: PawPrint,
                    business: Building2,
                    creator: Sparkles,
                    event: CalendarDays,
                  };
                  const Icon = profileIconMap[pt.id];
                  return (
                    <button
                      key={pt.id}
                      onClick={() => {
                        setProfileType(pt.id);
                        if (pt.id !== "business") {
                          setBusinessCategory(null);
                        }
                      }}
                      className={`overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? isDark
                            ? "border-orange-400/50 bg-orange-500/10"
                            : "border-orange-300 bg-orange-50"
                          : isDark
                          ? "border-slate-700 bg-slate-950/60 hover:border-slate-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon size={18} className="shrink-0" style={{ color: selected ? "#EA580C" : isDark ? "#94A3B8" : "#64748B" }} />
                          <p className={`truncate ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                            {pt.label}
                          </p>
                        </div>
                        {selected && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
                            <Check size={12} /> Selected
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {pt.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {profileType === "business" && (
                <div className="mt-4">
                  <p className={`mb-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                    Business category
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {BUSINESS_CATEGORIES.map((cat) => {
                      const selected = businessCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setBusinessCategory(cat.id)}
                          className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                            selected
                              ? isDark
                                ? "border-orange-400/50 bg-orange-500/10 text-white"
                                : "border-orange-300 bg-orange-50 text-slate-900"
                              : isDark
                              ? "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-600"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span style={{ fontWeight: selected ? 700 : 500 }}>{cat.label}</span>
                            {selected && <Check size={14} className="text-emerald-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className={`rounded-3xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <p className={`mb-1 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight: 700 }}>
                2. Order details
              </p>
              <p className={`mb-4 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                Hardware format: <span className="capitalize" style={{ fontWeight: 600 }}>{previewShape === "card" ? "NFC Card" : previewShape === "teardrop" ? "NFC Teardrop Tag" : "NFC Event Badge"}</span> (based on your profile type)
              </p>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={useDefaultDesign}
                  onChange={(event) => setUseDefaultDesign(event.target.checked)}
                  className="h-4 w-4 accent-orange-500"
                />
                <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Use default design
                </span>
              </label>
              <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                Turn this on if the customer wants a ready-made design instead of custom settings.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <label className={`mb-1.5 block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
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
                    className={`h-10 w-full rounded-lg border px-3 text-sm outline-none ${
                      isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-300 bg-white text-slate-800"
                    }`}
                  />
                </div>
                <div className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`mb-1.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                    Current Pricing
                  </p>
                  <div className={`space-y-0.5 text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    <p>Unit: PHP {priceBreakdown.unitPricePhp.toLocaleString("en-PH")}</p>
                    <p>Subtotal ({priceBreakdown.quantity}): PHP {priceBreakdown.itemSubtotalPhp.toLocaleString("en-PH")}</p>
                    <p>
                      {priceBreakdown.shippingLabel} ({priceBreakdown.shippingAreaLabel}) : PHP{" "}
                      {priceBreakdown.shippingFeePhp.toLocaleString("en-PH")}
                    </p>
                    <p>
                      Weight: {priceBreakdown.totalWeightGrams}g (billable {priceBreakdown.billableWeightGrams}g)
                    </p>
                    <p className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                      All-in total: PHP {priceBreakdown.totalPhp.toLocaleString("en-PH")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className={`rounded-3xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <p className={`mb-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight: 700 }}>
                3. Customize colors
              </p>

              <div className="space-y-4">
                <div>
                  <p className={`mb-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                    {productType === "card" ? "Card color" : "Tag color"} (subject to availability)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {baseColorOptions.map((option) => {
                      const selectable = isColorSelectable(option);
                      const isSelected = design.baseColor === option.hex;
                      const availabilityNote = !option.available
                        ? "Disabled by admin"
                        : option.plaStock <= 0
                        ? "PLA out of stock"
                        : `${option.plaStock} PLA in stock`;
                      return (
                        <button
                          key={option.id}
                          onClick={() => updateDesign("baseColor", option.hex)}
                          disabled={!selectable || useDefaultDesign}
                          title={`${option.name} (${availabilityNote})`}
                          className={`relative h-10 w-10 rounded-xl transition-all ${
                            selectable && !useDefaultDesign ? "hover:scale-105" : "cursor-not-allowed opacity-45"
                          }`}
                          style={{
                            background: option.hex,
                            border: swatchButtonBorder(isDark, isSelected),
                          }}
                        >
                          {!selectable && (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white" style={{ fontWeight: 700 }}>
                              {option.plaStock <= 0 ? "OUT" : "OFF"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className={`mb-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                    Text color (in-stock PLA)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {baseColorOptions.map((option) => {
                      const selectable = isColorSelectable(option);
                      const availabilityNote = !option.available
                        ? "Disabled by admin"
                        : option.plaStock <= 0
                        ? "PLA out of stock"
                        : `${option.plaStock} PLA in stock`;
                      return (
                        <button
                          key={`text-${option.id}`}
                          onClick={() => updateDesign("textColor", option.hex)}
                          disabled={!selectable || useDefaultDesign}
                          className={`relative h-9 w-9 rounded-lg transition-all ${
                            selectable && !useDefaultDesign ? "hover:scale-105" : "cursor-not-allowed opacity-45"
                          }`}
                          style={{ background: option.hex, border: swatchButtonBorder(isDark, design.textColor === option.hex) }}
                          title={`${option.name} (${availabilityNote})`}
                        >
                          {!selectable && (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white" style={{ fontWeight: 700 }}>
                              {option.plaStock <= 0 ? "OUT" : "OFF"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {profileType !== "business" && (
                  <div>
                    <p className={`mb-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Icon color (in-stock PLA)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {baseColorOptions.map((option) => {
                        const selectable = isColorSelectable(option);
                        const availabilityNote = !option.available
                          ? "Disabled by admin"
                          : option.plaStock <= 0
                          ? "PLA out of stock"
                          : `${option.plaStock} PLA in stock`;
                        return (
                          <button
                            key={`icon-${option.id}`}
                            onClick={() => updateDesign("iconColor", option.hex)}
                            disabled={!selectable || useDefaultDesign}
                            className={`relative h-9 w-9 rounded-lg transition-all ${
                              selectable && !useDefaultDesign ? "hover:scale-105" : "cursor-not-allowed opacity-45"
                            }`}
                            style={{ background: option.hex, border: swatchButtonBorder(isDark, design.iconColor === option.hex) }}
                            title={`${option.name} (${availabilityNote})`}
                          >
                            {!selectable && (
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white" style={{ fontWeight: 700 }}>
                                {option.plaStock <= 0 ? "OUT" : "OFF"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className={`rounded-3xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <p className={`mb-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight: 700 }}>
                4. Add text {profileType === "business" ? "and logo" : "and icon"}
              </p>

              <div className="space-y-4">
                <div>
                  <label className={`mb-1.5 block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                    Primary text (max {maxCharacters} chars)
                  </label>
                  <input
                    value={design.primaryText}
                    onChange={(event) => updateDesign("primaryText", clampText(event.target.value, maxCharacters))}
                    disabled={useDefaultDesign}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all ${
                      isDark
                        ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:border-orange-400"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-400"
                    } ${useDefaultDesign ? "cursor-not-allowed opacity-65" : ""}`}
                    placeholder={productType === "card" ? "Alex Rivera" : "Tap to connect"}
                  />
                </div>

                {productType === "card" && (
                  <div>
                    <label className={`mb-1.5 block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Secondary text
                    </label>
                    <input
                      value={design.secondaryText}
                      onChange={(event) => updateDesign("secondaryText", clampText(event.target.value, maxCharacters))}
                      disabled={useDefaultDesign}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all ${
                        isDark
                          ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:border-orange-400"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-400"
                      } ${useDefaultDesign ? "cursor-not-allowed opacity-65" : ""}`}
                      placeholder="Digital Card"
                    />
                  </div>
                )}

                {/* Business: SVG logo upload — Others: icon grid */}
                {profileType === "business" ? (
                  <div>
                    <label className={`mb-1.5 block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Logo (SVG only, max 50KB)
                    </label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept=".svg,image/svg+xml"
                      onChange={handleLogoUpload}
                      disabled={useDefaultDesign}
                      className="hidden"
                    />

                    {design.logoSvg ? (
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border p-3 ${
                            isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"
                          }`}
                          dangerouslySetInnerHTML={{ __html: design.logoSvg }}
                        />
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            disabled={useDefaultDesign}
                            className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                              isDark
                                ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            } ${useDefaultDesign ? "cursor-not-allowed opacity-65" : ""}`}
                          >
                            Replace
                          </button>
                          <button
                            onClick={() => setDesign((current) => ({ ...current, logoSvg: null }))}
                            disabled={useDefaultDesign}
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                          >
                            <X size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={useDefaultDesign}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition-all ${
                          isDark
                            ? "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                            : "border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600"
                        } ${useDefaultDesign ? "cursor-not-allowed opacity-65" : ""}`}
                      >
                        <Upload size={18} />
                        Upload your SVG logo
                      </button>
                    )}
                    <p className={`mt-2 text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Your logo will be placed on the card. For best results, use a square or near-square SVG.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className={`mb-1.5 block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Icon selection ({filteredIconChoices.length} options)
                    </label>
                    <input
                      value={iconSearch}
                      onChange={(event) => setIconSearch(event.target.value)}
                      disabled={useDefaultDesign}
                      placeholder="Search icon (e.g. cafe, pet, creator)"
                      className={`mb-2.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all ${
                        isDark
                          ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:border-orange-400"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-400"
                      } ${useDefaultDesign ? "cursor-not-allowed opacity-65" : ""}`}
                    />
                    <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                      {filteredIconChoices.map((choice) => {
                        const Icon = choice.icon;
                        const selected = design.iconId === choice.id;
                        return (
                          <button
                            key={choice.id}
                            onClick={() => updateDesign("iconId", choice.id)}
                            disabled={useDefaultDesign}
                            className={`rounded-xl border p-2 text-center transition-all ${
                              selected
                                ? isDark
                                  ? "border-orange-400/50 bg-orange-500/10"
                                  : "border-orange-300 bg-orange-50"
                                : isDark
                                ? "border-slate-700 bg-slate-950 hover:border-slate-600"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            } ${useDefaultDesign ? "cursor-not-allowed opacity-65" : ""}`}
                          >
                            <Icon size={16} className="mx-auto mb-1" style={{ color: selected ? "#EA580C" : isDark ? "#CBD5E1" : "#64748B" }} />
                            <span className={`text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>{choice.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {filteredIconChoices.length === 0 && (
                      <p className={`mt-2 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                        No icons found for "{iconSearch}". Try another keyword.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className={`rounded-3xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <p className={`mb-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight: 700 }}>
                5. Shipping information
              </p>
              <p className={`mb-3 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                This address is used for fulfillment and shipping confirmation.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={shipping.fullName}
                  onChange={(event) => updateShipping("fullName", event.target.value)}
                  placeholder="Full name"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
                <input
                  value={shipping.phone}
                  onChange={(event) => updateShipping("phone", event.target.value)}
                  placeholder="Phone number"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
                <input
                  value={shipping.email}
                  onChange={(event) => updateShipping("email", event.target.value)}
                  placeholder="Email (optional)"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
                <input
                  value={shipping.country}
                  onChange={(event) => updateShipping("country", event.target.value)}
                  placeholder="Country"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
                <input
                  value={shipping.line1}
                  onChange={(event) => updateShipping("line1", event.target.value)}
                  placeholder="Address line 1"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none sm:col-span-2 ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
                <input
                  value={shipping.line2}
                  onChange={(event) => updateShipping("line2", event.target.value)}
                  placeholder="Address line 2 (optional)"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none sm:col-span-2 ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
                <input
                  value={shipping.city}
                  onChange={(event) => updateShipping("city", event.target.value)}
                  placeholder="City"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
                <input
                  value={shipping.province}
                  onChange={(event) => updateShipping("province", event.target.value)}
                  placeholder="Province / State"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
                <input
                  value={shipping.postalCode}
                  onChange={(event) => updateShipping("postalCode", event.target.value)}
                  placeholder="Postal code"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
                <input
                  value={shipping.notes}
                  onChange={(event) => updateShipping("notes", event.target.value)}
                  placeholder="Delivery notes (optional)"
                  className={`h-10 rounded-xl border px-3 text-sm outline-none sm:col-span-2 ${isDark ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                />
              </div>

              <label className="mt-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={shipping.confirm}
                  onChange={(event) => updateShipping("confirm", event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-orange-500"
                />
                <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  I confirm this shipping information is complete and correct.
                </span>
              </label>
            </section>

            <section className={`rounded-3xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <p className={`mb-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight: 700 }}>
                Hardware constraints (3D print ready)
              </p>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>Physical size</p>
                  <p style={{ fontWeight: 700 }}>
                    {formatMm(currentSpec.physical.widthMm)} × {formatMm(currentSpec.physical.heightMm)} mm
                  </p>
                </div>
                <div className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>Text limits</p>
                  <p style={{ fontWeight: 700 }}>
                    {currentSpec.constraints.text.maxCharacters} chars · {currentSpec.constraints.text.maxLines} lines
                  </p>
                </div>
              </div>
              {specError && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-500">
                  <AlertCircle size={12} />
                  {specError}
                </p>
              )}
            </section>
          </div>

          <div className="lg:sticky lg:top-24">
            <section className={`rounded-3xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <div className="mb-4 flex items-center justify-between">
                <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight: 700 }}>
                  Live Hardware Preview
                </p>
                <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                  {profileType} · {previewShape === "card" ? "Card" : previewShape === "teardrop" ? "Tag" : "Badge"}
                </span>
              </div>

              <motion.div
                key={`${profileType}-${productType}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22 }}
                className="mx-auto"
                style={{ width: previewSize.width, maxWidth: "100%" }}
              >
                {/* Clip-path SVG definitions for non-rectangular shapes */}
                {/* ── Teardrop shape preview ── */}
                {previewShape === "teardrop" && (
                  <div className="relative mx-auto" style={{ width: previewSize.width, height: previewSize.height, maxWidth: "100%" }}>
                    {/*
                      NFC teardrop tag keychain shape — based on real 3D-printed
                      teardrop fob that holds a 25mm NFC chip (~26mm wide).
                      Shaped like a guitar pick / elongated egg: very rounded body
                      with a gentle taper toward the top where a keyring hole sits.
                      viewBox 0 0 192 246 matches previewSize.
                    */}
                    <svg viewBox="0 0 192 246" width={previewSize.width} height={previewSize.height}
                      xmlns="http://www.w3.org/2000/svg" className="block" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))" }}>
                      <defs>
                        {/* Teardrop body — guitar-pick / elongated-egg silhouette */}
                        <path id="td-body"
                          d="M 96,8
                             C 82,8 72,14 66,24
                             Q 42,60 24,108
                             Q 6,156 24,194
                             Q 42,236 96,240
                             Q 150,236 168,194
                             Q 186,156 168,108
                             Q 150,60 126,24
                             C 120,14 110,8 96,8 Z" />
                        <clipPath id="td-clip"><use href="#td-body" /></clipPath>
                      </defs>

                      {/* Filled body */}
                      <use href="#td-body" fill={design.baseColor}
                        stroke={isDark ? "rgba(148,163,184,0.32)" : "rgba(15,23,42,0.14)"}
                        strokeWidth="1.5" />

                      {/* Content inside the clip */}
                      <g clipPath="url(#td-clip)">
                        {/* Dot texture */}
                        <pattern id="td-dots" width="12" height="12" patternUnits="userSpaceOnUse">
                          <circle cx="6" cy="6" r="0.8" fill="rgba(255,255,255,0.45)" />
                        </pattern>
                        <use href="#td-body" fill="url(#td-dots)" opacity="0.2" />

                        {/* Subtle paw watermark for pets */}
                        {profileType === "pets" && (
                          <g transform="translate(96,125)" opacity="0.07">
                            {/* Simple paw: heel pad + 4 toes */}
                            <ellipse cx="0" cy="12" rx="18" ry="14" fill={design.textColor} />
                            <circle cx="-14" cy="-6" r="7" fill={design.textColor} />
                            <circle cx="-5" cy="-14" r="7" fill={design.textColor} />
                            <circle cx="5" cy="-14" r="7" fill={design.textColor} />
                            <circle cx="14" cy="-6" r="7" fill={design.textColor} />
                          </g>
                        )}

                        {/* Icon */}
                        <foreignObject x="56" y="90" width="80" height="80">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                            <IconComponent size={38} style={{ color: design.iconColor }} strokeWidth={2.2} />
                          </div>
                        </foreignObject>

                        {/* Primary text */}
                        <foreignObject x="24" y="180" width="144" height="40">
                          <p style={{
                            color: design.textColor, fontWeight: 700, fontSize: "0.78rem",
                            lineHeight: 1.2, letterSpacing: "0.01em", textAlign: "center",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            width: "100%",
                          }}>
                            {design.primaryText || "Primary text"}
                          </p>
                        </foreignObject>
                      </g>

                      {/* Keyring hole */}
                      <circle cx="96" cy="22" r="6"
                        fill={isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.5)"}
                        stroke={isDark ? "rgba(148,163,184,0.3)" : "rgba(15,23,42,0.12)"}
                        strokeWidth="1" />
                    </svg>
                  </div>
                )}

                {/* ── Card / Badge shape preview ── */}
                {previewShape !== "teardrop" && (
                  <div
                    className="relative mx-auto shadow-2xl"
                    style={{
                      width: previewSize.width,
                      maxWidth: "100%",
                      height: previewSize.height,
                      background: design.baseColor,
                      borderRadius: previewShape === "card"
                        ? `${(currentSpec.physical.cornerRadiusMm / currentSpec.physical.heightMm) * 100}%`
                        : "0",
                      border: isDark ? "1px solid rgba(148,163,184,0.28)" : "1px solid rgba(15,23,42,0.12)",
                      overflow: "hidden",
                      clipPath: previewShape === "badge" ? "url(#badge-clip)" : "none",
                    }}
                  >
                    {/* Badge clip-path definition */}
                    {previewShape === "badge" && (
                      <svg width="0" height="0" style={{ position: "absolute" }}>
                        <defs>
                          <clipPath id="badge-clip" clipPathUnits="objectBoundingBox">
                            <path d="M 0.3,0 L 0.7,0 L 0.7,0.06 C 0.7,0.08 0.72,0.1 0.74,0.1 L 1,0.1 L 1,0.92 C 1,0.96 0.96,1 0.92,1 L 0.08,1 C 0.04,1 0,0.96 0,0.92 L 0,0.1 L 0.26,0.1 C 0.28,0.1 0.3,0.08 0.3,0.06 Z" />
                          </clipPath>
                        </defs>
                      </svg>
                    )}

                    {/* Dot texture */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                      }}
                    />

                    {/* Badge accent */}
                    {previewShape === "badge" && (
                      <>
                        <div className="absolute top-0 left-[30%] right-[30%] h-[10%] flex items-center justify-center">
                          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />
                        </div>
                        <div className="absolute top-[3%] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                          style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
                          title="Lanyard hole"
                        />
                      </>
                    )}

                    {/* Icon or Logo */}
                    {iconZone && (
                      <div className="absolute flex items-center justify-center"
                        style={previewShape === "card" ? zoneStyle(iconZone, currentSpec) : {
                          left: "50%", top: "30%", transform: "translate(-50%, -50%)",
                        }}
                      >
                        {profileType === "business" && design.logoSvg ? (
                          <div
                            className="flex items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-[46px] [&>svg]:max-w-[46px]"
                            style={{
                              width: previewShape === "card"
                                ? Math.min((iconZone.heightMm / currentSpec.physical.heightMm) * previewSize.height * 0.85, 46)
                                : 40,
                              height: previewShape === "card"
                                ? Math.min((iconZone.heightMm / currentSpec.physical.heightMm) * previewSize.height * 0.85, 46)
                                : 40,
                            }}
                            dangerouslySetInnerHTML={{ __html: design.logoSvg }}
                          />
                        ) : (
                          <IconComponent
                            size={previewShape === "card"
                              ? Math.min((iconZone.heightMm / currentSpec.physical.heightMm) * previewSize.height * 0.85, 46)
                              : 40
                            }
                            style={{ color: design.iconColor }}
                            strokeWidth={2.2}
                          />
                        )}
                      </div>
                    )}

                    {/* Secondary text (card shape only) */}
                    {secondaryTextZone && previewShape === "card" && (
                      <div className="absolute flex items-start" style={zoneStyle(secondaryTextZone, currentSpec)}>
                        <p className="w-full truncate" style={{
                          color: design.textColor, fontWeight: 500, fontSize: "0.76rem",
                          lineHeight: 1.2, letterSpacing: "0.01em",
                        }}>
                          {design.secondaryText || "Secondary text"}
                        </p>
                      </div>
                    )}

                    {/* Primary text */}
                    {primaryTextZone && (
                      <div
                        className={`absolute flex ${previewShape === "card" ? "items-start" : "items-center justify-center text-center"}`}
                        style={previewShape === "card" ? zoneStyle(primaryTextZone, currentSpec) : {
                          left: "10%", right: "10%", bottom: "16%",
                        }}
                      >
                        <p className={previewShape === "card" ? "w-full" : "w-full truncate"} style={{
                          color: design.textColor, fontWeight: 700,
                          fontSize: previewShape === "card" ? "0.94rem" : "0.78rem",
                          lineHeight: 1.14, letterSpacing: "0.01em",
                        }}>
                          {design.primaryText || "Primary text"}
                        </p>
                      </div>
                    )}

                    {/* Blocked zones (card only) */}
                    {previewShape === "card" && currentSpec.zones.blocked.map((zone) => (
                      <div
                        key={zone.id}
                        className="absolute rounded border border-dashed"
                        style={{
                          ...zoneStyle(zone, currentSpec),
                          borderColor: "rgba(239,68,68,0.55)",
                          background: "rgba(239,68,68,0.12)",
                        }}
                        title={zone.label}
                      />
                    ))}
                  </div>
                )}

                {/* Shape label */}
                <p className={`mt-2 text-center text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {previewShape === "teardrop" && (profileType === "pets" ? "Pet teardrop tag" : "Teardrop tag")}
                  {previewShape === "card" && "Card format"}
                  {previewShape === "badge" && "Event badge"}
                </p>
              </motion.div>

              <p className={`mt-4 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                Preview updates in real time while you customize.
              </p>

              <div className={`mt-4 rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 700 }}>
                  Order Summary
                </p>
                <div className={`mt-2 space-y-1 text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  <p>{currentSpec.displayName} x{priceBreakdown.quantity}</p>
                  <p>Unit price: PHP {priceBreakdown.unitPricePhp.toLocaleString("en-PH")}</p>
                  <p>Items subtotal: PHP {priceBreakdown.itemSubtotalPhp.toLocaleString("en-PH")}</p>
                  <p>
                    {priceBreakdown.shippingLabel} ({priceBreakdown.shippingAreaLabel}): PHP{" "}
                    {priceBreakdown.shippingFeePhp.toLocaleString("en-PH")}
                  </p>
                  <p>Weight class: {priceBreakdown.billableWeightGrams}g billable</p>
                  <p className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                    Total due (shipping included): PHP {priceBreakdown.totalPhp.toLocaleString("en-PH")}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  onClick={() => void submitOrder()}
                  disabled={submittingOrder || Boolean(shippingValidationError)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 700 }}
                >
                  {submittingOrder ? "Submitting Order..." : "Place Hardware Order"}
                </button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    to="/editor"
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm transition-all ${
                      isDark
                        ? "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    Continue to Profile Setup
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/templates"
                    className={`flex flex-1 items-center justify-center rounded-xl border py-3 text-sm transition-all ${
                      isDark
                        ? "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    View Profile Templates
                  </Link>
                </div>
              </div>
              {orderNotice && (
                <p className="mt-3 text-xs text-emerald-500">{orderNotice}</p>
              )}
              {!orderNotice && shippingValidationError && (
                <p className="mt-3 text-xs text-amber-500">{shippingValidationError}</p>
              )}
              {orderError && (
                <p className="mt-1 text-xs text-rose-500">{orderError}</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
