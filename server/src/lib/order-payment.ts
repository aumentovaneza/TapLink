import type { HardwareProductType, Prisma } from "@prisma/client";

export const PAYMENT_WINDOW_MINUTES = 15;
export const PAYMENT_WINDOW_MS = PAYMENT_WINDOW_MINUTES * 60 * 1000;
export const PROCESSING_DAYS_AFTER_CONFIRMATION = 10;
export const DONE_DAYS_AFTER_CONFIRMATION = 11;
export const SENT_DAYS_AFTER_CONFIRMATION = 12;

const UNIT_PRICE_PHP: Record<HardwareProductType, number> = {
  TAG: 600,
  CARD: 900,
};

export type OrderPaymentState =
  | "awaiting_confirmation"
  | "confirmed"
  | "expired"
  | "cancelled";

export interface OrderPaymentMetadata {
  status: OrderPaymentState;
  transactionId: string;
  amountPhp: number;
  currency: "PHP";
  unitPricePhp: number;
  quantity: number;
  createdAt: string;
  expiresAt: string;
  confirmedAt?: string;
  expiredAt?: string;
  cancelledAt?: string;
  reference?: string;
  receipt?: {
    fileName: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
  };
}

export interface OrderTimelineMetadata {
  expectedProcessingAt: string;
  expectedDoneAt: string;
  expectedSentAt: string;
}

export interface OrderPaymentView {
  status: OrderPaymentState;
  transactionId: string;
  amountPhp: number;
  currency: "PHP";
  unitPricePhp: number;
  quantity: number;
  createdAt: string;
  expiresAt: string;
  confirmedAt: string | null;
  expiredAt: string | null;
  cancelledAt: string | null;
  reference: string | null;
  receipt:
    | {
        fileName: string;
        storagePath: string;
        mimeType: string;
        sizeBytes: number;
        uploadedAt: string;
      }
    | null;
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function createTransactionId(orderId: string): string {
  const compact = orderId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (compact.length >= 6) {
    return `${compact.slice(-6, -3)}-${compact.slice(-3)}`;
  }
  const padded = compact.padStart(6, "0");
  return `${padded.slice(0, 3)}-${padded.slice(3)}`;
}

export function unitPricePhpForProduct(productType: HardwareProductType): number {
  return UNIT_PRICE_PHP[productType];
}

export function createInitialPaymentMetadata(input: {
  orderId: string;
  productType: HardwareProductType;
  quantity: number;
  now?: Date;
}): OrderPaymentMetadata {
  const now = input.now ?? new Date();
  const unitPricePhp = unitPricePhpForProduct(input.productType);
  const amountPhp = unitPricePhp * input.quantity;

  return {
    status: "awaiting_confirmation",
    transactionId: createTransactionId(input.orderId),
    amountPhp,
    currency: "PHP",
    unitPricePhp,
    quantity: input.quantity,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PAYMENT_WINDOW_MS).toISOString(),
  };
}

export function createTimelineFromConfirmation(baseDate: Date): OrderTimelineMetadata {
  return {
    expectedProcessingAt: addDays(baseDate, PROCESSING_DAYS_AFTER_CONFIRMATION).toISOString(),
    expectedDoneAt: addDays(baseDate, DONE_DAYS_AFTER_CONFIRMATION).toISOString(),
    expectedSentAt: addDays(baseDate, SENT_DAYS_AFTER_CONFIRMATION).toISOString(),
  };
}

export function normalizeOrderMetadata(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  const parsed = asRecord(value);
  return parsed ? { ...parsed } : {};
}

export function readPaymentView(args: {
  metadata: Prisma.JsonValue | null | undefined;
  orderId: string;
  productType: HardwareProductType;
  quantity: number;
  createdAt: Date;
}): OrderPaymentView {
  const metadata = normalizeOrderMetadata(args.metadata);
  const paymentRecord = asRecord(metadata.payment);
  const fallback = createInitialPaymentMetadata({
    orderId: args.orderId,
    productType: args.productType,
    quantity: args.quantity,
    now: args.createdAt,
  });

  const status = readString(paymentRecord ?? {}, "status");
  const rawStatus: OrderPaymentState =
    status === "confirmed" || status === "expired" || status === "cancelled" || status === "awaiting_confirmation"
      ? status
      : fallback.status;

  const transactionId = readString(paymentRecord ?? {}, "transactionId") ?? fallback.transactionId;
  const amountPhp = readNumber(paymentRecord ?? {}, "amountPhp") ?? fallback.amountPhp;
  const unitPricePhp = readNumber(paymentRecord ?? {}, "unitPricePhp") ?? fallback.unitPricePhp;
  const quantity = readNumber(paymentRecord ?? {}, "quantity") ?? fallback.quantity;
  const createdAt = readString(paymentRecord ?? {}, "createdAt") ?? fallback.createdAt;
  const expiresAt = readString(paymentRecord ?? {}, "expiresAt") ?? fallback.expiresAt;
  const confirmedAt = readString(paymentRecord ?? {}, "confirmedAt");
  const expiredAt = readString(paymentRecord ?? {}, "expiredAt");
  const cancelledAt = readString(paymentRecord ?? {}, "cancelledAt");
  const reference = readString(paymentRecord ?? {}, "reference");
  const receiptRecord = asRecord(paymentRecord?.receipt);

  const receipt = receiptRecord
    ? {
        fileName: readString(receiptRecord, "fileName") ?? "receipt",
        storagePath: readString(receiptRecord, "storagePath") ?? "",
        mimeType: readString(receiptRecord, "mimeType") ?? "application/octet-stream",
        sizeBytes: readNumber(receiptRecord, "sizeBytes") ?? 0,
        uploadedAt: readString(receiptRecord, "uploadedAt") ?? createdAt,
      }
    : null;

  return {
    status: rawStatus,
    transactionId,
    amountPhp,
    currency: "PHP",
    unitPricePhp,
    quantity,
    createdAt,
    expiresAt,
    confirmedAt,
    expiredAt,
    cancelledAt,
    reference,
    receipt,
  };
}

export function readTimelineView(metadata: Prisma.JsonValue | null | undefined): OrderTimelineMetadata | null {
  const root = normalizeOrderMetadata(metadata);
  const timelineRecord = asRecord(root.timeline);
  if (!timelineRecord) {
    return null;
  }

  const expectedProcessingAt = readString(timelineRecord, "expectedProcessingAt");
  const expectedDoneAt = readString(timelineRecord, "expectedDoneAt");
  const expectedSentAt = readString(timelineRecord, "expectedSentAt");
  if (!expectedProcessingAt || !expectedDoneAt || !expectedSentAt) {
    return null;
  }

  return {
    expectedProcessingAt,
    expectedDoneAt,
    expectedSentAt,
  };
}

export function isPaymentExpired(payment: OrderPaymentView, now: Date): boolean {
  if (payment.status !== "awaiting_confirmation") {
    return false;
  }
  const expiresAtMs = new Date(payment.expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) {
    return false;
  }
  return expiresAtMs <= now.getTime();
}

export function withPaymentMetadata(
  metadata: Prisma.JsonValue | null | undefined,
  payment: OrderPaymentMetadata
): Record<string, unknown> {
  const root = normalizeOrderMetadata(metadata);
  return {
    ...root,
    payment,
  };
}

export function withTimelineMetadata(
  metadata: Prisma.JsonValue | null | undefined,
  timeline: OrderTimelineMetadata
): Record<string, unknown> {
  const root = normalizeOrderMetadata(metadata);
  return {
    ...root,
    timeline,
  };
}

