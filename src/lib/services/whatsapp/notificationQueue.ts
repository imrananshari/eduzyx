import type { WhatsAppQueueItem, WhatsAppMessagePayload } from "./whatsappTypes";

export function enqueueWhatsAppNotification(payload: WhatsAppMessagePayload): WhatsAppQueueItem {
  return {
    ...payload,
    id: `mock-wa-${Date.now()}`,
    status: "queued"
  };
}
