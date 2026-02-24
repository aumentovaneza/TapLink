import type { HardwareProductType, OrderStatus, Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { buildBambuSvgExport } from "../lib/bambu-export";
import { loadConfig } from "../lib/config";
import { requireAuth, requireRole } from "../lib/guards";
import { resolveHardwareColorsFromConfig } from "../lib/hardware-options";
import { sendOrderEmail } from "../lib/order-email";
import {
  createInitialPaymentMetadata,
  createTimelineFromConfirmation,
  isPaymentExpired,
  normalizeOrderMetadata,
  PAYMENT_WINDOW_MINUTES,
  readPaymentView,
  readTimelineView,
  withPaymentMetadata,
  withTimelineMetadata,
  type OrderPaymentMetadata,
  type OrderPaymentView,
  type OrderTimelineMetadata,
} from "../lib/order-payment";
import {
  isValidPaymentQrStoragePath,
  paymentQrMethodIdSchema,
  resolvePaymentQrMethodsFromConfig,
  type PaymentQrMethodId,
} from "../lib/payment-qrs";
import { prisma } from "../lib/prisma";

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
const PAYMENT_EXPIRY_STATUS_NOTE = `Payment not confirmed within ${PAYMENT_WINDOW_MINUTES} minutes.`;
const PAYMENT_CHECK_INTERVAL_MS = 60 * 1000;

const acceptedReceiptMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const receiptExtensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type OrderDelegate = {
  create: (...args: any[]) => Promise<any>;
  findMany: (...args: any[]) => Promise<any[]>;
  count: (...args: any[]) => Promise<number>;
  findUnique: (...args: any[]) => Promise<any>;
  update: (...args: any[]) => Promise<any>;
};

const orderStatusSchema = z.enum(["pending", "processing", "ready", "shipped", "completed", "cancelled"]);
const productTypeSchema = z.enum(["tag", "card"]);

const createOrderSchema = z.object({
  productType: productTypeSchema,
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  useDefaultDesign: z.boolean().default(false),
  profileId: z.string().trim().min(1).optional(),
  design: z.object({
    baseColor: z.string().trim().regex(HEX_COLOR_RE),
    textColor: z.string().trim().regex(HEX_COLOR_RE),
    iconColor: z.string().trim().regex(HEX_COLOR_RE),
    primaryText: z.string().trim().min(1).max(72),
    secondaryText: z.string().trim().max(72).optional(),
    iconId: z.string().trim().min(1).max(64),
  }),
  metadata: z.record(z.any()).optional(),
});

const orderParamsSchema = z.object({
  orderId: z.string().trim().min(1),
});

const paymentQrParamsSchema = z.object({
  methodId: paymentQrMethodIdSchema,
});

const listOrdersQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.union([z.literal("all"), orderStatusSchema]).default("all"),
  productType: z.union([z.literal("all"), productTypeSchema]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  statusNote: z.string().trim().max(240).optional(),
});

function toClientProductType(value: HardwareProductType): "tag" | "card" {
  return value === "TAG" ? "tag" : "card";
}

function toDbProductType(value: "tag" | "card"): HardwareProductType {
  return value === "tag" ? "TAG" : "CARD";
}

function toClientOrderStatus(value: OrderStatus): z.infer<typeof orderStatusSchema> {
  if (value === "PENDING") {
    return "pending";
  }
  if (value === "PROCESSING") {
    return "processing";
  }
  if (value === "READY") {
    return "ready";
  }
  if (value === "SHIPPED") {
    return "shipped";
  }
  if (value === "COMPLETED") {
    return "completed";
  }
  return "cancelled";
}

function toDbOrderStatus(value: z.infer<typeof orderStatusSchema>): OrderStatus {
  if (value === "pending") {
    return "PENDING";
  }
  if (value === "processing") {
    return "PROCESSING";
  }
  if (value === "ready") {
    return "READY";
  }
  if (value === "shipped") {
    return "SHIPPED";
  }
  if (value === "completed") {
    return "COMPLETED";
  }
  return "CANCELLED";
}

function formatDateInPhilippines(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function buildPaymentConfirmedEmailText(input: {
  name: string;
  orderId: string;
  productType: "tag" | "card";
  quantity: number;
  timeline: OrderTimelineMetadata;
}): string {
  return [
    `Hi ${input.name},`,
    "",
    `Your payment for order #${input.orderId.slice(-8)} has been confirmed.`,
    `Product: ${input.productType.toUpperCase()} x${input.quantity}`,
    "",
    "Estimated fulfillment timeline:",
    `- Processing target: ${formatDateInPhilippines(input.timeline.expectedProcessingAt)}`,
    `- Done target: ${formatDateInPhilippines(input.timeline.expectedDoneAt)}`,
    `- Sent target: ${formatDateInPhilippines(input.timeline.expectedSentAt)}`,
    "",
    "Your order will be processed within 10 days after payment confirmation.",
    "",
    "Thank you,",
    "Taplink Orders",
  ].join("\n");
}

function buildPaymentExpiredEmailText(input: { name: string; orderId: string; productType: "tag" | "card" }): string {
  return [
    `Hi ${input.name},`,
    "",
    `Your order #${input.orderId.slice(-8)} (${input.productType.toUpperCase()}) was cancelled because payment was not confirmed within ${PAYMENT_WINDOW_MINUTES} minutes.`,
    "",
    "You can place a new order anytime from the hardware configurator.",
    "",
    "Thank you,",
    "Taplink Orders",
  ].join("\n");
}

function readProfileDisplayName(fields: Prisma.JsonValue, fallback: string): string {
  if (fields && typeof fields === "object" && !Array.isArray(fields)) {
    const value = (fields as Record<string, unknown>).name;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

function serializeOrder(
  order: {
    id: string;
    productType: HardwareProductType;
    quantity: number;
    useDefaultDesign: boolean;
    baseColor: string;
    textColor: string;
    iconColor: string;
    primaryText: string;
    secondaryText: string | null;
    iconId: string;
    status: OrderStatus;
    statusNote: string | null;
    createdAt: Date;
    updatedAt: Date;
    processedAt: Date | null;
    metadata?: Prisma.JsonValue | null;
    profile: { id: string; slug: string; fields: Prisma.JsonValue } | null;
    user?: { id: string; name: string; email: string } | null;
    processedBy?: { id: string; name: string; email: string } | null;
  },
  includeUser = false
) {
  const payment = readPaymentView({
    metadata: order.metadata ?? null,
    orderId: order.id,
    productType: order.productType,
    quantity: order.quantity,
    createdAt: order.createdAt,
  });
  const timeline = readTimelineView(order.metadata ?? null);

  return {
    id: order.id,
    productType: toClientProductType(order.productType),
    quantity: order.quantity,
    useDefaultDesign: order.useDefaultDesign,
    design: {
      baseColor: order.baseColor,
      textColor: order.textColor,
      iconColor: order.iconColor,
      primaryText: order.primaryText,
      secondaryText: order.secondaryText ?? "",
      iconId: order.iconId,
    },
    status: toClientOrderStatus(order.status),
    statusNote: order.statusNote,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    processedAt: order.processedAt,
    payment,
    timeline,
    profile: order.profile
      ? {
          id: order.profile.id,
          slug: order.profile.slug,
          name: readProfileDisplayName(order.profile.fields, order.profile.slug),
        }
      : null,
    processedBy: order.processedBy ?? null,
    user: includeUser ? order.user ?? null : undefined,
  };
}

function resolveOrderDelegate():
  | { ok: true; delegate: OrderDelegate }
  | { ok: false; message: string } {
  const delegate = (prisma as unknown as { order?: OrderDelegate }).order;
  if (!delegate) {
    return {
      ok: false,
      message: "Order model is unavailable. Restart the API after running prisma generate and db push.",
    };
  }
  return { ok: true, delegate };
}

type SerializedOrderInput = {
  id: string;
  productType: HardwareProductType;
  quantity: number;
  useDefaultDesign: boolean;
  baseColor: string;
  textColor: string;
  iconColor: string;
  primaryText: string;
  secondaryText: string | null;
  iconId: string;
  status: OrderStatus;
  statusNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
  metadata: Prisma.JsonValue | null;
  profile: { id: string; slug: string; fields: Prisma.JsonValue } | null;
  user?: { id: string; name: string; email: string } | null;
  processedBy?: { id: string; name: string; email: string } | null;
};

const ORDER_SELECT_SQL = `
SELECT
  o."id" AS "id",
  o."productType" AS "productType",
  o."quantity" AS "quantity",
  o."useDefaultDesign" AS "useDefaultDesign",
  o."baseColor" AS "baseColor",
  o."textColor" AS "textColor",
  o."iconColor" AS "iconColor",
  o."primaryText" AS "primaryText",
  o."secondaryText" AS "secondaryText",
  o."iconId" AS "iconId",
  o."status" AS "status",
  o."statusNote" AS "statusNote",
  o."createdAt" AS "createdAt",
  o."updatedAt" AS "updatedAt",
  o."processedAt" AS "processedAt",
  o."metadata" AS "metadata",
  p."id" AS "profile_id",
  p."slug" AS "profile_slug",
  p."fields" AS "profile_fields",
  u."id" AS "user_id",
  u."name" AS "user_name",
  u."email" AS "user_email",
  pb."id" AS "processed_by_id",
  pb."name" AS "processed_by_name",
  pb."email" AS "processed_by_email"
FROM "Order" o
LEFT JOIN "Profile" p ON p."id" = o."profileId"
LEFT JOIN "User" u ON u."id" = o."userId"
LEFT JOIN "User" pb ON pb."id" = o."processedById"
`;

let ensureOrderStoragePromise: Promise<void> | null = null;

async function ensureOrderStorage(): Promise<void> {
  if (!ensureOrderStoragePromise) {
    ensureOrderStoragePromise = (async () => {
      await prisma.$executeRawUnsafe(
        `DO $$ BEGIN CREATE TYPE "HardwareProductType" AS ENUM ('TAG', 'CARD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
      );
      await prisma.$executeRawUnsafe(
        `DO $$ BEGIN CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'SHIPPED', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
      );
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Order" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "processedById" TEXT,
          "profileId" TEXT,
          "productType" "HardwareProductType" NOT NULL,
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "useDefaultDesign" BOOLEAN NOT NULL DEFAULT false,
          "baseColor" TEXT NOT NULL,
          "textColor" TEXT NOT NULL,
          "iconColor" TEXT NOT NULL,
          "primaryText" TEXT NOT NULL,
          "secondaryText" TEXT,
          "iconId" TEXT NOT NULL,
          "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
          "statusNote" TEXT,
          "processedAt" TIMESTAMP(3),
          "metadata" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "Order_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT "Order_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_profileId_idx" ON "Order"("profileId");`);
    })();
  }
  return ensureOrderStoragePromise;
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return new Date(0);
}

function hydrateOrderRow(row: Record<string, unknown>): SerializedOrderInput {
  const profileId = typeof row.profile_id === "string" ? row.profile_id : null;
  const userId = typeof row.user_id === "string" ? row.user_id : null;
  const processedById = typeof row.processed_by_id === "string" ? row.processed_by_id : null;
  const secondaryText = typeof row.secondaryText === "string" ? row.secondaryText : null;
  const statusNote = typeof row.statusNote === "string" ? row.statusNote : null;
  const processedAt = row.processedAt ? toDate(row.processedAt) : null;
  const metadata = asRecord(row.metadata) ? (row.metadata as Prisma.JsonValue) : null;

  return {
    id: String(row.id),
    productType: String(row.productType) as HardwareProductType,
    quantity: Number(row.quantity ?? 1),
    useDefaultDesign: Boolean(row.useDefaultDesign),
    baseColor: String(row.baseColor),
    textColor: String(row.textColor),
    iconColor: String(row.iconColor),
    primaryText: String(row.primaryText),
    secondaryText,
    iconId: String(row.iconId),
    status: String(row.status) as OrderStatus,
    statusNote,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
    processedAt,
    metadata,
    profile: profileId
      ? {
          id: profileId,
          slug: typeof row.profile_slug === "string" ? row.profile_slug : profileId,
          fields:
            row.profile_fields && typeof row.profile_fields === "object"
              ? (row.profile_fields as Prisma.JsonValue)
              : {},
        }
      : null,
    user: userId
      ? {
          id: userId,
          name: typeof row.user_name === "string" ? row.user_name : "",
          email: typeof row.user_email === "string" ? row.user_email : "",
        }
      : null,
    processedBy: processedById
      ? {
          id: processedById,
          name: typeof row.processed_by_name === "string" ? row.processed_by_name : "",
          email: typeof row.processed_by_email === "string" ? row.processed_by_email : "",
        }
      : null,
  };
}

async function rawFindOrderById(orderId: string): Promise<SerializedOrderInput | null> {
  await ensureOrderStorage();
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `${ORDER_SELECT_SQL} WHERE o."id" = $1 LIMIT 1`,
    orderId
  );
  if (!rows[0]) {
    return null;
  }
  return hydrateOrderRow(rows[0]);
}

async function rawCreateOrder(input: {
  userId: string;
  profileId: string | null;
  productType: "tag" | "card";
  quantity: number;
  useDefaultDesign: boolean;
  baseColor: string;
  textColor: string;
  iconColor: string;
  primaryText: string;
  secondaryText: string | null;
  iconId: string;
  metadata?: Record<string, unknown>;
}): Promise<SerializedOrderInput> {
  await ensureOrderStorage();
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "Order" (
        "id",
        "userId",
        "profileId",
        "productType",
        "quantity",
        "useDefaultDesign",
        "baseColor",
        "textColor",
        "iconColor",
        "primaryText",
        "secondaryText",
        "iconId",
        "status",
        "metadata",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4::"HardwareProductType", $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING'::"OrderStatus", $13::jsonb, NOW(), NOW()
      )
    `,
    id,
    input.userId,
    input.profileId,
    toDbProductType(input.productType),
    input.quantity,
    input.useDefaultDesign,
    input.baseColor.toUpperCase(),
    input.textColor.toUpperCase(),
    input.iconColor.toUpperCase(),
    input.primaryText,
    input.secondaryText,
    input.iconId,
    JSON.stringify(input.metadata ?? null)
  );

  const created = await rawFindOrderById(id);
  if (!created) {
    throw new Error("Unable to load created order");
  }
  return created;
}

async function rawListOrdersForUser(userId: string): Promise<SerializedOrderInput[]> {
  await ensureOrderStorage();
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `${ORDER_SELECT_SQL} WHERE o."userId" = $1 ORDER BY o."createdAt" DESC`,
    userId
  );
  return rows.map((row) => hydrateOrderRow(row));
}

async function rawListPendingOrders(): Promise<SerializedOrderInput[]> {
  await ensureOrderStorage();
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `${ORDER_SELECT_SQL} WHERE o."status" = 'PENDING'::"OrderStatus" ORDER BY o."createdAt" DESC`
  );
  return rows.map((row) => hydrateOrderRow(row));
}

function buildAdminRawWhere(query: {
  search?: string;
  status: "all" | z.infer<typeof orderStatusSchema>;
  productType: "all" | z.infer<typeof productTypeSchema>;
}) {
  const clauses: string[] = [];
  const params: Array<string | number | Date> = [];
  let index = 1;

  if (query.search) {
    clauses.push(
      `(o."id" ILIKE $${index} OR u."name" ILIKE $${index} OR u."email" ILIKE $${index} OR p."slug" ILIKE $${index})`
    );
    params.push(`%${query.search}%`);
    index += 1;
  }

  if (query.status !== "all") {
    clauses.push(`o."status" = $${index}::"OrderStatus"`);
    params.push(toDbOrderStatus(query.status));
    index += 1;
  }

  if (query.productType !== "all") {
    clauses.push(`o."productType" = $${index}::"HardwareProductType"`);
    params.push(toDbProductType(query.productType));
    index += 1;
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { whereSql, params, nextIndex: index };
}

async function rawListOrdersForAdmin(query: {
  search?: string;
  status: "all" | z.infer<typeof orderStatusSchema>;
  productType: "all" | z.infer<typeof productTypeSchema>;
  page: number;
  pageSize: number;
}): Promise<{ items: SerializedOrderInput[]; total: number }> {
  await ensureOrderStorage();
  const { whereSql, params, nextIndex } = buildAdminRawWhere(query);
  const offset = (query.page - 1) * query.pageSize;

  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `${ORDER_SELECT_SQL}
     ${whereSql}
     ORDER BY o."createdAt" DESC
     LIMIT $${nextIndex}
     OFFSET $${nextIndex + 1}`,
    ...params,
    query.pageSize,
    offset
  );

  const countRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `
      SELECT COUNT(*)::int AS "total"
      FROM "Order" o
      LEFT JOIN "Profile" p ON p."id" = o."profileId"
      LEFT JOIN "User" u ON u."id" = o."userId"
      ${whereSql}
    `,
    ...params
  );

  return {
    items: rows.map((row) => hydrateOrderRow(row)),
    total: Number(countRows[0]?.total ?? 0),
  };
}

async function rawUpdateOrderStatus(input: {
  orderId: string;
  status: z.infer<typeof orderStatusSchema>;
  statusNote: string | null;
  processedById: string;
}): Promise<SerializedOrderInput | null> {
  await ensureOrderStorage();
  const processedAt = input.status === "pending" ? null : new Date();
  const updatedRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `
      UPDATE "Order"
      SET
        "status" = $2::"OrderStatus",
        "statusNote" = $3,
        "processedById" = $4,
        "processedAt" = $5,
        "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING "id"
    `,
    input.orderId,
    toDbOrderStatus(input.status),
    input.statusNote,
    input.processedById,
    processedAt
  );

  if (!updatedRows[0]) {
    return null;
  }
  return rawFindOrderById(updatedRows[0].id);
}

function toPaymentMetadata(value: OrderPaymentView): OrderPaymentMetadata {
  const payment: OrderPaymentMetadata = {
    status: value.status,
    transactionId: value.transactionId,
    amountPhp: value.amountPhp,
    currency: value.currency,
    unitPricePhp: value.unitPricePhp,
    quantity: value.quantity,
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
  };

  if (value.confirmedAt) {
    payment.confirmedAt = value.confirmedAt;
  }
  if (value.expiredAt) {
    payment.expiredAt = value.expiredAt;
  }
  if (value.cancelledAt) {
    payment.cancelledAt = value.cancelledAt;
  }
  if (value.reference) {
    payment.reference = value.reference;
  }
  if (value.receipt) {
    payment.receipt = value.receipt;
  }
  return payment;
}

async function updateOrderForPaymentFlow(
  orderDelegate: ReturnType<typeof resolveOrderDelegate>,
  input: {
    orderId: string;
    status: OrderStatus;
    statusNote: string | null;
    processedAt: Date | null;
    processedById?: string | null;
    metadata: Record<string, unknown>;
  }
): Promise<SerializedOrderInput | null> {
  if (orderDelegate.ok) {
    const updated = await orderDelegate.delegate.update({
      where: { id: input.orderId },
      data: {
        status: input.status,
        statusNote: input.statusNote,
        processedAt: input.processedAt,
        processedById: typeof input.processedById === "undefined" ? undefined : input.processedById,
        metadata: input.metadata,
      },
      include: {
        profile: {
          select: {
            id: true,
            slug: true,
            fields: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return updated as SerializedOrderInput;
  }

  await ensureOrderStorage();
  const updatedRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `
      UPDATE "Order"
      SET
        "status" = $2::"OrderStatus",
        "statusNote" = $3,
        "processedAt" = $4,
        "processedById" = $5,
        "metadata" = $6::jsonb,
        "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING "id"
    `,
    input.orderId,
    input.status,
    input.statusNote,
    input.processedAt,
    input.processedById ?? null,
    JSON.stringify(input.metadata)
  );

  if (!updatedRows[0]) {
    return null;
  }

  return rawFindOrderById(updatedRows[0].id);
}

function resolveReceiptStoragePath(orderId: string, extension: string): { absolutePath: string; relativePath: string; fileName: string } {
  const fileName = `${orderId}-${Date.now().toString(36)}.${extension}`;
  const relativePath = path.posix.join("uploads", "order-receipts", fileName);
  const absolutePath = path.join(process.cwd(), relativePath);
  return { absolutePath, relativePath, fileName };
}

async function sendPaymentExpiredEmail(
  config: ReturnType<typeof loadConfig>,
  fastify: FastifyInstance,
  order: SerializedOrderInput
): Promise<void> {
  if (!order.user?.email) {
    return;
  }
  await sendOrderEmail(config, fastify.log, {
    to: order.user.email,
    type: "payment_expired",
    orderId: order.id,
    subject: `Order ${order.id.slice(-8)} cancelled due to payment timeout`,
    text: buildPaymentExpiredEmailText({
      name: order.user.name || "there",
      orderId: order.id,
      productType: toClientProductType(order.productType),
    }),
  });
}

async function sendPaymentConfirmedEmail(
  config: ReturnType<typeof loadConfig>,
  fastify: FastifyInstance,
  order: SerializedOrderInput,
  timeline: OrderTimelineMetadata
): Promise<void> {
  if (!order.user?.email) {
    return;
  }
  await sendOrderEmail(config, fastify.log, {
    to: order.user.email,
    type: "payment_confirmed",
    orderId: order.id,
    subject: `Payment confirmed for order ${order.id.slice(-8)}`,
    text: buildPaymentConfirmedEmailText({
      name: order.user.name || "there",
      orderId: order.id,
      productType: toClientProductType(order.productType),
      quantity: order.quantity,
      timeline,
    }),
  });
}

interface PaymentMethodResponse {
  id: PaymentQrMethodId;
  label: string;
  qrImagePath: string | null;
  uploadedAt: string | null;
}

async function resolvePaymentMethodsForCheckout(): Promise<PaymentMethodResponse[]> {
  const settings = await prisma.adminSetting.findUnique({
    where: { id: 1 },
    select: { config: true },
  });
  const paymentMethods = resolvePaymentQrMethodsFromConfig(settings?.config);

  return paymentMethods.map((method) => {
    const qr = method.qr;
    const versionToken = qr ? encodeURIComponent(qr.uploadedAt) : null;

    return {
      id: method.id,
      label: method.label,
      qrImagePath: qr ? `/payment-qrs/${method.id}${versionToken ? `?v=${versionToken}` : ""}` : null,
      uploadedAt: qr?.uploadedAt ?? null,
    };
  });
}

async function expireTimedOutAwaitingPayments(
  config: ReturnType<typeof loadConfig>,
  fastify: FastifyInstance
): Promise<void> {
  const orderDelegate = resolveOrderDelegate();
  const pendingOrders = orderDelegate.ok
    ? ((await orderDelegate.delegate.findMany({
        where: { status: "PENDING" },
        include: {
          profile: {
            select: {
              id: true,
              slug: true,
              fields: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })) as SerializedOrderInput[])
    : await rawListPendingOrders();

  const now = new Date();
  for (const order of pendingOrders) {
    const payment = readPaymentView({
      metadata: order.metadata,
      orderId: order.id,
      productType: order.productType,
      quantity: order.quantity,
      createdAt: order.createdAt,
    });

    if (!isPaymentExpired(payment, now)) {
      continue;
    }

    const nextPayment: OrderPaymentMetadata = {
      ...toPaymentMetadata(payment),
      status: "expired",
      expiredAt: now.toISOString(),
    };
    const nextMetadata = withPaymentMetadata(order.metadata, nextPayment);

    const updated = await updateOrderForPaymentFlow(orderDelegate, {
      orderId: order.id,
      status: "CANCELLED",
      statusNote: PAYMENT_EXPIRY_STATUS_NOTE,
      processedAt: now,
      processedById: null,
      metadata: nextMetadata,
    });

    if (!updated) {
      continue;
    }

    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: "order.payment_expired",
        entityType: "order",
        entityId: updated.id,
        metadata: {
          expiresAt: payment.expiresAt,
        },
      },
    });

    try {
      await sendPaymentExpiredEmail(config, fastify, updated);
    } catch (error) {
      fastify.log.error(
        { err: error, orderId: updated.id },
        "Failed to send payment expiration email"
      );
    }
  }
}

export async function orderRoutes(fastify: FastifyInstance): Promise<void> {
  const config = loadConfig();

  const paymentExpiryTimer = setInterval(() => {
    void expireTimedOutAwaitingPayments(config, fastify);
  }, PAYMENT_CHECK_INTERVAL_MS);
  paymentExpiryTimer.unref?.();

  fastify.addHook("onClose", (_instance, done) => {
    clearInterval(paymentExpiryTimer);
    done();
  });

  void expireTimedOutAwaitingPayments(config, fastify);

  fastify.get<{ Params: { methodId: string } }>("/payment-qrs/:methodId", async (request, reply) => {
    const parsedParams = paymentQrParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ error: "Invalid payment method id", details: parsedParams.error.flatten() });
    }

    const settings = await prisma.adminSetting.findUnique({
      where: { id: 1 },
      select: { config: true },
    });
    const paymentMethods = resolvePaymentQrMethodsFromConfig(settings?.config);
    const method = paymentMethods.find((entry) => entry.id === parsedParams.data.methodId);
    const asset = method?.qr ?? null;

    if (!asset || !isValidPaymentQrStoragePath(asset.storagePath)) {
      return reply.status(404).send({ error: "Payment QR not found." });
    }

    const absolutePath = path.join(process.cwd(), asset.storagePath);
    let imageBuffer: Buffer;
    try {
      imageBuffer = await readFile(absolutePath);
    } catch {
      return reply.status(404).send({ error: "Payment QR not found." });
    }

    reply.header("cache-control", "public, max-age=300");
    return reply.type(asset.mimeType).send(imageBuffer);
  });

  fastify.post("/orders", { preHandler: [requireAuth] }, async (request, reply) => {
    const orderDelegate = resolveOrderDelegate();

    const parsed = createOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const profileId = parsed.data.profileId?.trim() || null;
    if (profileId) {
      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { id: true, ownerId: true },
      });
      if (!profile || profile.ownerId !== request.user.sub) {
        return reply.status(403).send({ error: "You can only attach orders to your own profile" });
      }
    }

    const settings = await prisma.adminSetting.findUnique({
      where: { id: 1 },
      select: { config: true },
    });
    const availableHardwareColors = resolveHardwareColorsFromConfig(settings?.config)[parsed.data.productType];
    const selectableColorHexes = new Set(
      availableHardwareColors
        .filter((color) => color.available && color.plaStock > 0)
        .map((color) => color.hex.toUpperCase())
    );
    const requestedColorHexes = [
      parsed.data.design.baseColor.toUpperCase(),
      parsed.data.design.textColor.toUpperCase(),
      parsed.data.design.iconColor.toUpperCase(),
    ];

    if (requestedColorHexes.some((hex) => !selectableColorHexes.has(hex))) {
      return reply.status(400).send({
        error: "Base, text, and icon colors must be selected from in-stock PLA colors.",
      });
    }

    const initialMetadata = normalizeOrderMetadata((parsed.data.metadata ?? null) as Prisma.JsonValue);

    const created = orderDelegate.ok
      ? await orderDelegate.delegate.create({
          data: {
            userId: request.user.sub,
            profileId,
            productType: toDbProductType(parsed.data.productType),
            quantity: parsed.data.quantity,
            useDefaultDesign: parsed.data.useDefaultDesign,
            baseColor: parsed.data.design.baseColor.toUpperCase(),
            textColor: parsed.data.design.textColor.toUpperCase(),
            iconColor: parsed.data.design.iconColor.toUpperCase(),
            primaryText: parsed.data.design.primaryText,
            secondaryText: parsed.data.design.secondaryText ? parsed.data.design.secondaryText : null,
            iconId: parsed.data.design.iconId,
            metadata: initialMetadata,
          },
          include: {
            profile: {
              select: {
                id: true,
                slug: true,
                fields: true,
              },
            },
            processedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      : await rawCreateOrder({
          userId: request.user.sub,
          profileId,
          productType: parsed.data.productType,
          quantity: parsed.data.quantity,
          useDefaultDesign: parsed.data.useDefaultDesign,
          baseColor: parsed.data.design.baseColor,
          textColor: parsed.data.design.textColor,
          iconColor: parsed.data.design.iconColor,
          primaryText: parsed.data.design.primaryText,
          secondaryText: parsed.data.design.secondaryText ?? null,
          iconId: parsed.data.design.iconId,
          metadata: initialMetadata,
        });

    const initialPayment = createInitialPaymentMetadata({
      orderId: created.id,
      productType: created.productType,
      quantity: created.quantity,
      now: created.createdAt,
    });

    const metadataWithPayment = withPaymentMetadata(created.metadata ?? null, initialPayment);
    const createdWithPayment = await updateOrderForPaymentFlow(orderDelegate, {
      orderId: created.id,
      status: created.status,
      statusNote: created.statusNote,
      processedAt: created.processedAt,
      processedById: created.processedBy?.id ?? null,
      metadata: metadataWithPayment,
    });

    if (!createdWithPayment) {
      return reply.status(500).send({ error: "Unable to initialize payment details for order." });
    }

    await prisma.auditLog.create({
      data: {
        actorId: request.user.sub,
        action: "order.created",
        entityType: "order",
        entityId: createdWithPayment.id,
        metadata: {
          productType: parsed.data.productType,
          quantity: parsed.data.quantity,
          profileId: profileId ?? null,
          paymentWindowMinutes: PAYMENT_WINDOW_MINUTES,
          amountPhp: initialPayment.amountPhp,
        },
      },
    });

    return reply.status(201).send({ order: serializeOrder(createdWithPayment) });
  });

  fastify.get("/orders/mine", { preHandler: [requireAuth] }, async (request, reply) => {
    await expireTimedOutAwaitingPayments(config, fastify);

    const orderDelegate = resolveOrderDelegate();

    const items = orderDelegate.ok
      ? await orderDelegate.delegate.findMany({
          where: { userId: request.user.sub },
          include: {
            profile: {
              select: {
                id: true,
                slug: true,
                fields: true,
              },
            },
            processedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : await rawListOrdersForUser(request.user.sub);

    return {
      items: items.map((item) => serializeOrder(item)),
    };
  });

  async function findOwnedOrder(orderId: string, userId: string): Promise<SerializedOrderInput | null> {
    const orderDelegate = resolveOrderDelegate();
    const order = orderDelegate.ok
      ? ((await orderDelegate.delegate.findUnique({
          where: { id: orderId },
          include: {
            profile: {
              select: {
                id: true,
                slug: true,
                fields: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            processedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })) as SerializedOrderInput | null)
      : await rawFindOrderById(orderId);

    if (!order) {
      return null;
    }
    if (order.user?.id !== userId) {
      return null;
    }
    return order;
  }

  fastify.get<{ Params: { orderId: string } }>(
    "/orders/:orderId/payment",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      await expireTimedOutAwaitingPayments(config, fastify);

      const parsedParams = orderParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid order ID", details: parsedParams.error.flatten() });
      }

      const order = await findOwnedOrder(parsedParams.data.orderId, request.user.sub);
      if (!order) {
        return reply.status(404).send({ error: "Order not found" });
      }

      const payment = readPaymentView({
        metadata: order.metadata,
        orderId: order.id,
        productType: order.productType,
        quantity: order.quantity,
        createdAt: order.createdAt,
      });

      const isPaymentPageUnavailable =
        payment.status === "expired" ||
        payment.status === "cancelled" ||
        order.status === "CANCELLED" ||
        order.status === "SHIPPED" ||
        order.status === "COMPLETED";

      if (isPaymentPageUnavailable) {
        return reply.status(409).send({
          error: "Payment page is no longer available for this order.",
          redirectTo: "/my-tags",
        });
      }

      const now = new Date();
      const expiresAtMs = new Date(payment.expiresAt).getTime();
      const countdownMs = Number.isNaN(expiresAtMs) ? 0 : Math.max(0, expiresAtMs - now.getTime());
      const paymentMethods = await resolvePaymentMethodsForCheckout();

      return reply.send({
        order: serializeOrder(order),
        paymentWindowMinutes: PAYMENT_WINDOW_MINUTES,
        countdownMs,
        paymentMethods,
      });
    }
  );

  fastify.post<{ Params: { orderId: string } }>(
    "/orders/:orderId/payment/cancel",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsedParams = orderParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid order ID", details: parsedParams.error.flatten() });
      }

      const orderDelegate = resolveOrderDelegate();
      const order = await findOwnedOrder(parsedParams.data.orderId, request.user.sub);
      if (!order) {
        return reply.status(404).send({ error: "Order not found" });
      }

      const payment = readPaymentView({
        metadata: order.metadata,
        orderId: order.id,
        productType: order.productType,
        quantity: order.quantity,
        createdAt: order.createdAt,
      });

      if (payment.status !== "awaiting_confirmation" || order.status !== "PENDING") {
        return reply.status(409).send({ error: "Order payment can no longer be cancelled from this page." });
      }

      const now = new Date();
      const nextPayment: OrderPaymentMetadata = {
        ...toPaymentMetadata(payment),
        status: "cancelled",
        cancelledAt: now.toISOString(),
      };
      const nextMetadata = withPaymentMetadata(order.metadata, nextPayment);

      const updated = await updateOrderForPaymentFlow(orderDelegate, {
        orderId: order.id,
        status: "CANCELLED",
        statusNote: "Cancelled by user before payment confirmation.",
        processedAt: now,
        processedById: null,
        metadata: nextMetadata,
      });

      if (!updated) {
        return reply.status(500).send({ error: "Unable to cancel order." });
      }

      await prisma.auditLog.create({
        data: {
          actorId: request.user.sub,
          action: "order.payment_cancelled",
          entityType: "order",
          entityId: updated.id,
          metadata: {
            reason: "user_cancelled_before_confirmation",
          },
        },
      });

      try {
        await sendOrderEmail(config, fastify.log, {
          to: updated.user?.email ?? request.user.email,
          type: "payment_cancelled",
          orderId: updated.id,
          subject: `Order ${updated.id.slice(-8)} cancelled`,
          text: buildPaymentExpiredEmailText({
            name: updated.user?.name || "there",
            orderId: updated.id,
            productType: toClientProductType(updated.productType),
          }),
        });
      } catch (error) {
        fastify.log.error({ err: error, orderId: updated.id }, "Failed to send payment cancellation email");
      }

      return reply.send({
        order: serializeOrder(updated),
      });
    }
  );

  fastify.post<{ Params: { orderId: string } }>(
    "/orders/:orderId/payment/confirm",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parsedParams = orderParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid order ID", details: parsedParams.error.flatten() });
      }

      const orderDelegate = resolveOrderDelegate();
      const order = await findOwnedOrder(parsedParams.data.orderId, request.user.sub);
      if (!order) {
        return reply.status(404).send({ error: "Order not found" });
      }

      const payment = readPaymentView({
        metadata: order.metadata,
        orderId: order.id,
        productType: order.productType,
        quantity: order.quantity,
        createdAt: order.createdAt,
      });

      if (payment.status !== "awaiting_confirmation" || order.status !== "PENDING") {
        return reply.status(409).send({ error: "This order no longer accepts payment confirmation." });
      }

      const now = new Date();
      if (isPaymentExpired(payment, now)) {
        const expiredPayment: OrderPaymentMetadata = {
          ...toPaymentMetadata(payment),
          status: "expired",
          expiredAt: now.toISOString(),
        };
        const expiredMetadata = withPaymentMetadata(order.metadata, expiredPayment);
        const expiredOrder = await updateOrderForPaymentFlow(orderDelegate, {
          orderId: order.id,
          status: "CANCELLED",
          statusNote: PAYMENT_EXPIRY_STATUS_NOTE,
          processedAt: now,
          processedById: null,
          metadata: expiredMetadata,
        });

        if (expiredOrder) {
          try {
            await sendPaymentExpiredEmail(config, fastify, expiredOrder);
          } catch (error) {
            fastify.log.error({ err: error, orderId: expiredOrder.id }, "Failed to send payment expiration email");
          }
        }

        return reply.status(410).send({
          error: "Payment window expired. Order has been cancelled.",
        });
      }

      let receiptFile: Awaited<ReturnType<typeof request.file>>;
      try {
        receiptFile = await request.file({
          limits: {
            files: 1,
            fileSize: RECEIPT_MAX_BYTES,
          },
        });
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "FST_REQ_FILE_TOO_LARGE") {
          return reply.status(413).send({ error: "Receipt image is too large. Max 5MB." });
        }
        throw error;
      }

      if (!receiptFile) {
        return reply.status(400).send({ error: "Receipt image is required." });
      }

      if (!acceptedReceiptMimeTypes.has(receiptFile.mimetype)) {
        return reply.status(400).send({ error: "Unsupported receipt file type. Use PNG, JPG, or WebP." });
      }

      const extension = receiptExtensionByMimeType[receiptFile.mimetype];
      if (!extension) {
        return reply.status(400).send({ error: "Unsupported receipt file type. Use PNG, JPG, or WebP." });
      }

      let receiptBuffer: Buffer;
      try {
        receiptBuffer = await receiptFile.toBuffer();
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "FST_REQ_FILE_TOO_LARGE") {
          return reply.status(413).send({ error: "Receipt image is too large. Max 5MB." });
        }
        throw error;
      }

      if (receiptBuffer.length === 0) {
        return reply.status(400).send({ error: "Receipt image is empty." });
      }
      if (receiptBuffer.length > RECEIPT_MAX_BYTES) {
        return reply.status(413).send({ error: "Receipt image is too large. Max 5MB." });
      }

      const referenceField = asRecord(receiptFile.fields?.reference);
      const referenceValue = referenceField && typeof referenceField.value === "string" ? referenceField.value.trim() : "";
      const reference = referenceValue.slice(0, 80);

      const { absolutePath, relativePath, fileName } = resolveReceiptStoragePath(order.id, extension);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, receiptBuffer);

      const timeline = createTimelineFromConfirmation(now);
      const confirmedPayment: OrderPaymentMetadata = {
        ...toPaymentMetadata(payment),
        status: "confirmed",
        confirmedAt: now.toISOString(),
        reference: reference || undefined,
        receipt: {
          fileName,
          storagePath: relativePath,
          mimeType: receiptFile.mimetype,
          sizeBytes: receiptBuffer.length,
          uploadedAt: now.toISOString(),
        },
      };

      const metadataWithPayment = withPaymentMetadata(order.metadata, confirmedPayment);
      const metadataWithTimeline = withTimelineMetadata(metadataWithPayment as Prisma.JsonValue, timeline);

      const updated = await updateOrderForPaymentFlow(orderDelegate, {
        orderId: order.id,
        status: "PROCESSING",
        statusNote: "Payment confirmed. Order queued for production.",
        processedAt: now,
        processedById: null,
        metadata: metadataWithTimeline,
      });

      if (!updated) {
        return reply.status(500).send({ error: "Unable to confirm payment." });
      }

      await prisma.auditLog.create({
        data: {
          actorId: request.user.sub,
          action: "order.payment_confirmed",
          entityType: "order",
          entityId: updated.id,
          metadata: {
            reference: reference || null,
            receiptFileName: fileName,
            expectedProcessingAt: timeline.expectedProcessingAt,
            expectedDoneAt: timeline.expectedDoneAt,
            expectedSentAt: timeline.expectedSentAt,
          },
        },
      });

      try {
        await sendPaymentConfirmedEmail(config, fastify, updated, timeline);
      } catch (error) {
        fastify.log.error({ err: error, orderId: updated.id }, "Failed to send payment confirmation email");
      }

      return reply.send({
        order: serializeOrder(updated),
      });
    }
  );

  fastify.get("/admin/orders", { preHandler: [requireRole("ADMIN")] }, async (request, reply) => {
    await expireTimedOutAwaitingPayments(config, fastify);

    const parsed = listOrdersQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query", details: parsed.error.flatten() });
    }

    const query = parsed.data;
    const orderDelegate = resolveOrderDelegate();

    if (!orderDelegate.ok) {
      const raw = await rawListOrdersForAdmin(query);
      return reply.send({
        items: raw.items.map((item) => serializeOrder(item, true)),
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: raw.total,
          totalPages: Math.max(1, Math.ceil(raw.total / query.pageSize)),
        },
      });
    }

    const whereAnd: Prisma.OrderWhereInput[] = [];

    if (query.search) {
      whereAnd.push({
        OR: [
          { id: { contains: query.search, mode: "insensitive" } },
          { user: { name: { contains: query.search, mode: "insensitive" } } },
          { user: { email: { contains: query.search, mode: "insensitive" } } },
          { profile: { is: { slug: { contains: query.search, mode: "insensitive" } } } },
        ],
      });
    }

    if (query.status !== "all") {
      whereAnd.push({
        status: toDbOrderStatus(query.status),
      });
    }

    if (query.productType !== "all") {
      whereAnd.push({
        productType: toDbProductType(query.productType),
      });
    }

    const where: Prisma.OrderWhereInput = whereAnd.length > 0 ? { AND: whereAnd } : {};
    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      orderDelegate.delegate.findMany({
        where,
        include: {
          profile: {
            select: {
              id: true,
              slug: true,
              fields: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      orderDelegate.delegate.count({ where }),
    ]);

    return reply.send({
      items: items.map((item: any) => serializeOrder(item, true)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    });
  });

  fastify.patch<{ Params: { orderId: string } }>(
    "/admin/orders/:orderId/status",
    { preHandler: [requireRole("ADMIN")] },
    async (request, reply) => {
      const parsedParams = orderParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid order ID", details: parsedParams.error.flatten() });
      }

      const parsedBody = updateOrderStatusSchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.status(400).send({ error: "Invalid request body", details: parsedBody.error.flatten() });
      }

      const orderDelegate = resolveOrderDelegate();
      const statusNote = parsedBody.data.statusNote?.trim() || null;
      if (!orderDelegate.ok) {
        const rawExisting = await rawFindOrderById(parsedParams.data.orderId);
        if (!rawExisting) {
          return reply.status(404).send({ error: "Order not found" });
        }

        const payment = readPaymentView({
          metadata: rawExisting.metadata,
          orderId: rawExisting.id,
          productType: rawExisting.productType,
          quantity: rawExisting.quantity,
          createdAt: rawExisting.createdAt,
        });
        if (
          payment.status !== "confirmed" &&
          parsedBody.data.status !== "pending" &&
          parsedBody.data.status !== "cancelled"
        ) {
          return reply.status(409).send({ error: "Payment must be confirmed before processing the order." });
        }

        const rawUpdated = await rawUpdateOrderStatus({
          orderId: rawExisting.id,
          status: parsedBody.data.status,
          statusNote,
          processedById: request.user.sub,
        });

        if (!rawUpdated) {
          return reply.status(404).send({ error: "Order not found" });
        }

        await prisma.auditLog.create({
          data: {
            actorId: request.user.sub,
            action: "order.status_updated",
            entityType: "order",
            entityId: rawUpdated.id,
            metadata: {
              status: parsedBody.data.status,
              statusNote,
            },
          },
        });

        return reply.send({
          order: serializeOrder(rawUpdated, true),
        });
      }

      const existing = await orderDelegate.delegate.findUnique({
        where: { id: parsedParams.data.orderId },
        select: {
          id: true,
          productType: true,
          quantity: true,
          createdAt: true,
          metadata: true,
        },
      });
      if (!existing) {
        return reply.status(404).send({ error: "Order not found" });
      }

      const payment = readPaymentView({
        metadata: existing.metadata,
        orderId: existing.id,
        productType: existing.productType,
        quantity: existing.quantity,
        createdAt: existing.createdAt,
      });
      if (
        payment.status !== "confirmed" &&
        parsedBody.data.status !== "pending" &&
        parsedBody.data.status !== "cancelled"
      ) {
        return reply.status(409).send({ error: "Payment must be confirmed before processing the order." });
      }

      const nextStatus = toDbOrderStatus(parsedBody.data.status);

      const updated = await orderDelegate.delegate.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          statusNote,
          processedById: request.user.sub,
          processedAt: parsedBody.data.status === "pending" ? null : new Date(),
        },
        include: {
          profile: {
            select: {
              id: true,
              slug: true,
              fields: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: request.user.sub,
          action: "order.status_updated",
          entityType: "order",
          entityId: updated.id,
          metadata: {
            status: parsedBody.data.status,
            statusNote,
          },
        },
      });

      return reply.send({
        order: serializeOrder(updated, true),
      });
    }
  );

  fastify.get<{ Params: { orderId: string } }>(
    "/admin/orders/:orderId/bambu-svg",
    { preHandler: [requireRole("ADMIN")] },
    async (request, reply) => {
      const parsedParams = orderParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid order ID", details: parsedParams.error.flatten() });
      }

      const orderDelegate = resolveOrderDelegate();

      const order = orderDelegate.ok
        ? await orderDelegate.delegate.findUnique({
            where: { id: parsedParams.data.orderId },
            select: {
              id: true,
              productType: true,
              useDefaultDesign: true,
              baseColor: true,
              textColor: true,
              iconColor: true,
              primaryText: true,
              secondaryText: true,
              iconId: true,
            },
          })
        : await rawFindOrderById(parsedParams.data.orderId);

      if (!order) {
        return reply.status(404).send({ error: "Order not found" });
      }

      const exportResult = await buildBambuSvgExport({
        orderId: order.id,
        productType: toClientProductType(order.productType),
        useDefaultDesign: order.useDefaultDesign,
        baseColor: order.baseColor,
        textColor: order.textColor,
        iconColor: order.iconColor,
        primaryText: order.primaryText,
        secondaryText: order.secondaryText,
        iconId: order.iconId,
      });

      await prisma.auditLog.create({
        data: {
          actorId: request.user.sub,
          action: "order.bambu_exported",
          entityType: "order",
          entityId: order.id,
          metadata: {
            productType: toClientProductType(order.productType),
            iconId: order.iconId,
          },
        },
      });

      reply.header("content-type", "image/svg+xml; charset=utf-8");
      reply.header("content-disposition", `attachment; filename="${exportResult.fileName}"`);
      reply.header("cache-control", "no-store");

      return reply.send(exportResult.svg);
    }
  );
}
