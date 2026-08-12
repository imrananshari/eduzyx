import { renderWhatsAppTemplate, whatsappMessageTemplates } from "./messageTemplates";
import type { WhatsAppMessagePayload } from "./whatsappTypes";

export async function sendWhatsAppMessage(payload: WhatsAppMessagePayload) {
  const template = whatsappMessageTemplates[payload.category];
  const body = renderWhatsAppTemplate(template, payload.variables);

  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return {
      body,
      mocked: true,
      status: "mocked"
    };
  }

  throw new Error("Live WhatsApp Cloud API sending is intentionally disabled for the MVP.");
}
