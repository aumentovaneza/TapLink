import { loadConfig } from "./config";

export interface LostItemScanNotification {
  ownerEmail: string;
  ownerName: string;
  itemName: string;
  profileType: "pets" | "items";
  scanCity?: string | null;
  scanCountry?: string | null;
  scanTime: string;
  profileUrl: string;
}

export async function sendLostItemScanNotification(notification: LostItemScanNotification): Promise<boolean> {
  const config = loadConfig();
  const webhookUrl = config.NOTIFICATION_EMAIL_WEBHOOK_URL;

  if (!webhookUrl) {
    return false;
  }

  const locationParts = [notification.scanCity, notification.scanCountry].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(", ") : "Unknown location";

  const typeLabel = notification.profileType === "pets" ? "pet" : "item";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: notification.ownerEmail,
        subject: `Your ${typeLabel} "${notification.itemName}" was just scanned!`,
        text: [
          `Hi ${notification.ownerName},`,
          "",
          `Your ${typeLabel} "${notification.itemName}" was scanned at ${notification.scanTime}.`,
          `Location: ${locationString}`,
          "",
          `View your profile: ${notification.profileUrl}`,
          "",
          "If you marked this ${typeLabel} as lost, someone may have found it. Check your profile for finder reports.",
          "",
          "— Taparoo",
        ].join("\n"),
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
