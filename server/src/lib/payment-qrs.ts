import path from "node:path";

import { z } from "zod";

const PAYMENT_QR_METHOD_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const paymentQrMethodIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(PAYMENT_QR_METHOD_ID_RE);

export const paymentQrAssetSchema = z.object({
  fileName: z.string().trim().min(1),
  storagePath: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.coerce.number().int().nonnegative(),
  uploadedAt: z.string().trim().min(1),
});

export const paymentQrMethodSchema = z.object({
  id: paymentQrMethodIdSchema,
  label: z.string().trim().min(1).max(80),
  qr: paymentQrAssetSchema.nullable().optional(),
});

export const paymentQrMethodListSchema = z.array(paymentQrMethodSchema).min(1).max(20);

export type PaymentQrMethodId = z.infer<typeof paymentQrMethodIdSchema>;
export type PaymentQrAsset = z.infer<typeof paymentQrAssetSchema>;
export type PaymentQrMethod = {
  id: PaymentQrMethodId;
  label: string;
  qr: PaymentQrAsset | null;
};

const LEGACY_LABELS: Record<string, string> = {
  gotyme: "GoTyme QR",
  gcash: "GCash QR",
};

const DEFAULT_METHODS: PaymentQrMethod[] = [
  { id: "gotyme", label: "GoTyme QR", qr: null },
  { id: "gcash", label: "GCash QR", qr: null },
];

export const PAYMENT_QR_STORAGE_PREFIX = path.posix.join("uploads", "payment-qrs");

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toMethodId(raw: string): string {
  const id = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return id || "method";
}

function normalizePaymentQrAsset(value: unknown): PaymentQrAsset | null {
  const parsed = paymentQrAssetSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function normalizeMethodEntry(raw: unknown, fallbackId?: string): PaymentQrMethod | null {
  const record = asRecord(raw);

  const rawId = typeof record.id === "string" && record.id.trim() ? record.id : fallbackId ?? "";
  const idCandidate = toMethodId(rawId);
  const idParsed = paymentQrMethodIdSchema.safeParse(idCandidate);
  if (!idParsed.success) {
    return null;
  }

  const label = typeof record.label === "string" && record.label.trim()
    ? record.label.trim().slice(0, 80)
    : LEGACY_LABELS[idParsed.data] ?? idParsed.data.toUpperCase();

  if (!label) {
    return null;
  }

  const qr = normalizePaymentQrAsset(record.qr ?? record.asset ?? record);

  return {
    id: idParsed.data,
    label,
    qr,
  };
}

function dedupeAndNormalizeMethods(input: PaymentQrMethod[]): PaymentQrMethod[] {
  const seen = new Set<string>();
  const result: PaymentQrMethod[] = [];

  for (const method of input) {
    const id = toMethodId(method.id);
    const parsed = paymentQrMethodIdSchema.safeParse(id);
    if (!parsed.success) {
      continue;
    }
    if (seen.has(parsed.data)) {
      continue;
    }
    const label = method.label.trim().slice(0, 80);
    if (!label) {
      continue;
    }
    seen.add(parsed.data);
    result.push({
      id: parsed.data,
      label,
      qr: method.qr ?? null,
    });
  }

  if (result.length > 0) {
    return result;
  }

  return DEFAULT_METHODS.map((method) => ({ ...method }));
}

export function isPaymentQrMethodId(value: string): value is PaymentQrMethodId {
  return paymentQrMethodIdSchema.safeParse(value).success;
}

export function resolvePaymentQrMethodsFromConfig(config: unknown): PaymentQrMethod[] {
  const root = asRecord(config);
  const rawPaymentQRCodes = root.paymentQRCodes;

  if (Array.isArray(rawPaymentQRCodes)) {
    const methods = rawPaymentQRCodes
      .map((entry) => normalizeMethodEntry(entry))
      .filter((entry): entry is PaymentQrMethod => Boolean(entry));
    return dedupeAndNormalizeMethods(methods);
  }

  const legacyRecord = asRecord(rawPaymentQRCodes);
  const legacyEntries = Object.entries(legacyRecord)
    .map(([legacyKey, value]) => normalizeMethodEntry(value, legacyKey))
    .filter((entry): entry is PaymentQrMethod => Boolean(entry));
  if (legacyEntries.length > 0) {
    return dedupeAndNormalizeMethods(legacyEntries);
  }

  return DEFAULT_METHODS.map((method) => ({ ...method }));
}

export function withPaymentQrMethodsConfig(
  config: unknown,
  methods: PaymentQrMethod[]
): Record<string, unknown> {
  const root = asRecord(config);
  const normalizedMethods = dedupeAndNormalizeMethods(methods).map((method) => ({
    id: method.id,
    label: method.label,
    qr: method.qr,
  }));

  return {
    ...root,
    paymentQRCodes: normalizedMethods,
  };
}

export function isValidPaymentQrStoragePath(storagePath: string): boolean {
  const normalized = path.posix.normalize(storagePath).replace(/^\/+/, "");
  if (!normalized.startsWith(`${PAYMENT_QR_STORAGE_PREFIX}/`)) {
    return false;
  }

  const relative = path.posix.relative(PAYMENT_QR_STORAGE_PREFIX, normalized);
  if (!relative || relative.startsWith("..") || path.posix.isAbsolute(relative)) {
    return false;
  }
  return true;
}
