import { getPhysicalSpec, type PhysicalProductSpec, type ProductType } from "./physical-specs";

type ProductZone = PhysicalProductSpec["zones"]["printSafe"][number];
type LucideIconNode = Array<[string, Record<string, string>]>;

export interface BambuSvgExportInput {
  orderId: string;
  productType: ProductType;
  useDefaultDesign: boolean;
  baseColor: string;
  textColor: string;
  iconColor: string;
  primaryText: string;
  secondaryText: string | null;
  iconId: string;
}

export interface BambuSvgExportResult {
  fileName: string;
  svg: string;
}

const LUCIDE_MODULE_BY_ICON_ID: Record<string, string> = {
  wifi: "wifi",
  zap: "zap",
  briefcase: "briefcase",
  user: "user",
  building: "building-2",
  store: "store",
  shopping: "shopping-bag",
  coffee: "coffee",
  utensils: "utensils",
  chef: "chef-hat",
  paw: "paw-print",
  dog: "dog",
  heart: "heart",
  stethoscope: "stethoscope",
  dumbbell: "dumbbell",
  graduation: "graduation-cap",
  camera: "camera",
  video: "clapperboard",
  music: "music-2",
  mic: "mic-2",
  creator: "sparkles",
  megaphone: "megaphone",
  lightbulb: "lightbulb",
  rocket: "rocket",
  shield: "shield-check",
  wrench: "wrench",
  home: "home",
  location: "map-pin",
  bed: "bed-double",
  leaf: "leaf",
  gift: "gift",
  ticket: "ticket",
  calendar: "calendar-days",
  handshake: "handshake",
  globe: "globe-2",
  "at-sign": "at-sign",
  badge: "badge-check",
  star: "star",
  plane: "plane",
  bike: "bike",
  car: "car",
  banknote: "banknote",
  phone: "phone",
  flame: "flame",
  gamepad: "gamepad-2",
  bell: "bell",
  "book-open": "book-open",
  "book-user": "book-user",
  bot: "bot",
  brain: "brain",
  brush: "brush",
  bus: "bus",
  cake: "cake",
  calculator: "calculator",
  castle: "castle",
  "circle-dollar": "circle-dollar-sign",
  "clipboard-list": "clipboard-list",
  cloud: "cloud",
  code: "code-2",
  compass: "compass",
  cpu: "cpu",
  crown: "crown",
  diamond: "diamond",
  dollar: "dollar-sign",
  "door-open": "door-open",
  factory: "factory",
  feather: "feather",
  film: "film",
  flag: "flag",
  flower: "flower-2",
  fuel: "fuel",
  gem: "gem",
  hammer: "hammer",
  headphones: "headphones",
  hospital: "hospital",
  hotel: "hotel",
  image: "image",
  key: "key-round",
  laptop: "laptop",
  library: "library",
  lock: "lock",
  medal: "medal",
  mountain: "mountain",
  package: "package",
  paintbrush: "paintbrush",
  "pen-tool": "pen-tool",
  pizza: "pizza",
  scan: "scan-line",
  school: "school",
  send: "send",
  server: "server",
  ship: "ship",
  cart: "shopping-cart",
  sun: "sun",
  tablet: "tablet",
  train: "train",
  tree: "tree-pine",
  trophy: "trophy",
  truck: "truck",
  users: "users",
  wallet: "wallet",
  watch: "watch",
};

const lucideIconCache = new Map<string, Promise<LucideIconNode | null>>();

function normalizeHex(value: string, fallback: string): string {
  const normalized = value.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(normalized)) {
    return normalized;
  }
  return fallback;
}

function formatMm(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeOrderSuffix(orderId: string): string {
  const compact = orderId.replace(/[^a-zA-Z0-9_-]/g, "");
  const suffix = compact.slice(-8);
  return suffix || "order";
}

function prettifyIconId(iconId: string): string {
  return iconId
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function iconToken(iconId: string): string {
  const words = prettifyIconId(iconId)
    .split(" ")
    .filter(Boolean);
  const initials = words.map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  return initials || "IC";
}

function findZone(spec: PhysicalProductSpec, key: "text-primary" | "text-secondary" | "icon-or-logo"): ProductZone | null {
  return spec.zones.printSafe.find((zone) => zone.id.includes(key)) ?? null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function resolveLucideIconNode(iconId: string): Promise<LucideIconNode | null> {
  const moduleName = LUCIDE_MODULE_BY_ICON_ID[iconId.trim().toLowerCase()];
  if (!moduleName) {
    return null;
  }

  const existing = lucideIconCache.get(moduleName);
  if (existing) {
    return existing;
  }

  const loadingPromise = import(`lucide-react/dist/esm/icons/${moduleName}.js`)
    .then((module) => {
      const node = (module as { __iconNode?: unknown }).__iconNode;
      if (!Array.isArray(node)) {
        return null;
      }
      return node as LucideIconNode;
    })
    .catch(() => null);

  lucideIconCache.set(moduleName, loadingPromise);
  return loadingPromise;
}

function splitTextLines(text: string, maxLines: number, maxCharsPerLine: number): string[] {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return [];
  }

  const words = cleaned.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = "";
      if (lines.length >= maxLines) {
        break;
      }
    }

    if (word.length <= maxCharsPerLine) {
      current = word;
      continue;
    }

    const broken = word.slice(0, maxCharsPerLine - 1);
    lines.push(`${broken}…`);
    if (lines.length >= maxLines) {
      current = "";
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  return lines;
}

function buildTextMarkup(args: {
  zone: ProductZone;
  text: string;
  color: string;
  align: "start" | "middle";
  maxLines: number;
  fontSizeMm: number;
}): string {
  const { zone, text, color, align, maxLines, fontSizeMm } = args;
  const charsPerLine = Math.max(4, Math.floor(zone.widthMm / Math.max(0.5, fontSizeMm * 0.58)));
  const lines = splitTextLines(text, maxLines, charsPerLine);
  if (lines.length === 0) {
    return "";
  }

  const lineHeightMm = fontSizeMm * 1.22;
  const blockHeight = lineHeightMm * lines.length;
  const firstBaseline = zone.yMm + (zone.heightMm - blockHeight) / 2 + fontSizeMm;
  const textAnchor = align === "middle" ? "middle" : "start";
  const x = align === "middle" ? zone.xMm + zone.widthMm / 2 : zone.xMm + 0.7;

  const tspans = lines
    .map((line, index) => {
      const y = firstBaseline + index * lineHeightMm;
      return `<tspan x="${formatMm(x)}" y="${formatMm(y)}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `<text text-anchor="${textAnchor}" fill="${color}" font-family="Arial, Helvetica, sans-serif" font-size="${formatMm(fontSizeMm)}">${tspans}</text>`;
}

function buildFallbackIconMarkup(zone: ProductZone, iconColor: string, iconId: string): string {
  const edge = Math.min(zone.widthMm, zone.heightMm);
  const inset = edge * 0.14;
  const x = zone.xMm + inset;
  const y = zone.yMm + inset;
  const width = zone.widthMm - inset * 2;
  const height = zone.heightMm - inset * 2;
  const radius = Math.min(width, height) * 0.22;
  const strokeWidth = clamp(edge * 0.06, 0.35, 1);
  const tokenSize = clamp(Math.min(width, height) * 0.31, 1.8, 6.2);

  return `
<g id="icon" fill="none" stroke="${iconColor}" stroke-width="${formatMm(strokeWidth)}">
  <rect x="${formatMm(x)}" y="${formatMm(y)}" width="${formatMm(width)}" height="${formatMm(height)}" rx="${formatMm(radius)}" />
</g>
<text
  id="icon-fallback-token"
  x="${formatMm(zone.xMm + zone.widthMm / 2)}"
  y="${formatMm(zone.yMm + zone.heightMm / 2 + tokenSize * 0.34)}"
  text-anchor="middle"
  fill="${iconColor}"
  font-family="Arial, Helvetica, sans-serif"
  font-size="${formatMm(tokenSize)}"
  font-weight="700"
>
  ${escapeXml(iconToken(iconId))}
</text>
`.trim();
}

function renderWifiIconMarkup(zone: ProductZone, iconColor: string): string {
  const centerX = zone.xMm + zone.widthMm / 2;
  const topY = zone.yMm + zone.heightMm * 0.28;
  const width = zone.widthMm * 0.72;
  const strokeWidth = clamp(Math.min(zone.widthMm, zone.heightMm) * 0.09, 0.45, 1.5);

  const r1 = width / 2;
  const r2 = width * 0.34;
  const r3 = width * 0.18;
  const y2 = topY + zone.heightMm * 0.18;
  const y3 = topY + zone.heightMm * 0.35;
  const dotY = topY + zone.heightMm * 0.56;
  const dotR = clamp(Math.min(zone.widthMm, zone.heightMm) * 0.045, 0.45, 1.2);

  return `
<g
  id="icon-wifi"
  fill="none"
  stroke="${iconColor}"
  stroke-width="${formatMm(strokeWidth)}"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M ${formatMm(centerX - r1)} ${formatMm(topY)} Q ${formatMm(centerX)} ${formatMm(topY - r1 * 0.78)} ${formatMm(centerX + r1)} ${formatMm(topY)}" />
  <path d="M ${formatMm(centerX - r2)} ${formatMm(y2)} Q ${formatMm(centerX)} ${formatMm(y2 - r2 * 0.82)} ${formatMm(centerX + r2)} ${formatMm(y2)}" />
  <path d="M ${formatMm(centerX - r3)} ${formatMm(y3)} Q ${formatMm(centerX)} ${formatMm(y3 - r3 * 0.86)} ${formatMm(centerX + r3)} ${formatMm(y3)}" />
  <circle cx="${formatMm(centerX)}" cy="${formatMm(dotY)}" r="${formatMm(dotR)}" fill="${iconColor}" stroke="none" />
</g>
`.trim();
}

function renderKnownIconMarkup(zone: ProductZone, iconColor: string, iconId: string): string | null {
  const normalized = iconId.trim().toLowerCase();
  if (normalized === "wifi") {
    return renderWifiIconMarkup(zone, iconColor);
  }
  return null;
}

function renderLucideIconNodeMarkup(zone: ProductZone, iconColor: string, iconNode: LucideIconNode): string {
  const sizeMm = Math.min(zone.widthMm, zone.heightMm) * 0.88;
  const translateX = zone.xMm + (zone.widthMm - sizeMm) / 2;
  const translateY = zone.yMm + (zone.heightMm - sizeMm) / 2;
  const scale = sizeMm / 24;

  const nodes = iconNode
    .map(([tag, attrs]) => {
      const attrsMarkup = Object.entries(attrs)
        .filter(([name]) => name !== "key")
        .map(([name, value]) => `${name}="${escapeXml(String(value))}"`)
        .join(" ");
      return `<${tag}${attrsMarkup ? ` ${attrsMarkup}` : ""} />`;
    })
    .join("");

  return `
<g
  id="icon"
  fill="none"
  stroke="${iconColor}"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  transform="translate(${formatMm(translateX)} ${formatMm(translateY)}) scale(${formatMm(scale)})"
>
  ${nodes}
</g>
`.trim();
}

export async function buildBambuSvgExport(input: BambuSvgExportInput): Promise<BambuSvgExportResult> {
  const spec = getPhysicalSpec(input.productType);
  const primaryTextZone = findZone(spec, "text-primary");
  const secondaryTextZone = findZone(spec, "text-secondary");
  const iconZone = findZone(spec, "icon-or-logo");
  const knownIconLayer = iconZone ? renderKnownIconMarkup(iconZone, normalizeHex(input.iconColor, "#F59E0B"), input.iconId) : null;
  const lucideIconNode = knownIconLayer ? null : await resolveLucideIconNode(input.iconId);

  const baseColor = normalizeHex(input.baseColor, "#111827");
  const textColor = normalizeHex(input.textColor, "#F8FAFC");
  const iconColor = normalizeHex(input.iconColor, "#F59E0B");

  const primaryText = input.primaryText.trim();
  const secondaryText = (input.secondaryText ?? "").trim();
  const iconLabel = prettifyIconId(input.iconId);

  const primaryFontSize = clamp(
    input.productType === "card"
      ? spec.constraints.text.minFontSizeMm * 2.6
      : spec.constraints.text.minFontSizeMm * 2.1,
    spec.constraints.text.minFontSizeMm,
    input.productType === "card" ? 5.8 : 2.8
  );
  const secondaryFontSize = clamp(spec.constraints.text.minFontSizeMm * 1.7, spec.constraints.text.minFontSizeMm, 3.2);

  const textLayers: string[] = [];
  if (primaryTextZone && primaryText) {
    textLayers.push(
      buildTextMarkup({
        zone: primaryTextZone,
        text: primaryText,
        color: textColor,
        align: input.productType === "tag" ? "middle" : "start",
        maxLines: input.productType === "tag" ? 2 : 3,
        fontSizeMm: primaryFontSize,
      })
    );
  }
  if (secondaryTextZone && secondaryText) {
    textLayers.push(
      buildTextMarkup({
        zone: secondaryTextZone,
        text: secondaryText,
        color: textColor,
        align: "start",
        maxLines: 2,
        fontSizeMm: secondaryFontSize,
      })
    );
  }

  const iconLayer = iconZone
    ? knownIconLayer
      ? knownIconLayer
      : lucideIconNode
      ? renderLucideIconNodeMarkup(iconZone, iconColor, lucideIconNode)
      : buildFallbackIconMarkup(iconZone, iconColor, iconLabel)
    : "";
  const orderSuffix = safeOrderSuffix(input.orderId);
  const fileName = `taplink-${input.productType}-${orderSuffix}-bambu-v1.svg`;
  const patternId = `dot-grid-${orderSuffix}`;
  const patternStep = input.productType === "card" ? 2.2 : 1.45;
  const dotRadius = input.productType === "card" ? 0.095 : 0.08;
  const dotOpacity = input.productType === "card" ? 0.18 : 0.2;

  const description = [
    "Taplink Bambu SVG Export v1",
    `Order: ${input.orderId}`,
    `Type: ${input.productType.toUpperCase()}`,
    `Icon ID: ${iconLabel || "Unknown"}`,
    `Default Design: ${input.useDefaultDesign ? "Yes" : "No"}`,
    "Note: unsupported icons fall back to a placement token.",
  ].join(" | ");

  const svg = `
<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${formatMm(spec.physical.widthMm)}mm"
  height="${formatMm(spec.physical.heightMm)}mm"
  viewBox="0 0 ${formatMm(spec.physical.widthMm)} ${formatMm(spec.physical.heightMm)}"
>
  <title>Taplink ${input.productType.toUpperCase()} Export</title>
  <desc>${escapeXml(description)}</desc>
  <defs>
    <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternStep}" height="${patternStep}">
      <circle cx="1" cy="1" r="${dotRadius}" fill="#FFFFFF" fill-opacity="${dotOpacity}" />
    </pattern>
  </defs>
  <g id="base">
    <rect
      x="0"
      y="0"
      width="${formatMm(spec.physical.widthMm)}"
      height="${formatMm(spec.physical.heightMm)}"
      rx="${formatMm(spec.physical.cornerRadiusMm)}"
      fill="${baseColor}"
    />
    <rect
      x="0"
      y="0"
      width="${formatMm(spec.physical.widthMm)}"
      height="${formatMm(spec.physical.heightMm)}"
      rx="${formatMm(spec.physical.cornerRadiusMm)}"
      fill="url(#${patternId})"
      opacity="0.2"
    />
  </g>
  ${iconLayer ? `<g id="icon-layer">${iconLayer}</g>` : ""}
  ${textLayers.length > 0 ? `<g id="text-layer">${textLayers.join("")}</g>` : ""}
</svg>
`.trim();

  return {
    fileName,
    svg,
  };
}
