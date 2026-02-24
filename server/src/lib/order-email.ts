import type { FastifyBaseLogger } from "fastify";

import type { AppConfig } from "./config";

interface OrderEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  orderId: string;
  type: "payment_confirmed" | "payment_expired" | "payment_cancelled";
}

function truncate(value: string, max = 180): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...`;
}

export async function sendOrderEmail(config: AppConfig, logger: FastifyBaseLogger, input: OrderEmailInput): Promise<void> {
  const webhookUrl = config.ORDER_EMAIL_WEBHOOK_URL;
  const from = config.ORDER_EMAIL_FROM;

  if (!webhookUrl) {
    logger.info(
      {
        orderId: input.orderId,
        emailType: input.type,
        to: input.to,
        subject: input.subject,
        preview: truncate(input.text),
      },
      "Order email simulated (ORDER_EMAIL_WEBHOOK_URL not configured)"
    );
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      orderId: input.orderId,
      type: input.type,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Email webhook failed (${response.status}): ${message || "no response body"}`);
  }
}

