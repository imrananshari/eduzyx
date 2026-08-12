export type WhatsAppTemplateCategory =
  | "attendance_absent_alert"
  | "fee_reminder"
  | "fee_payment_receipt"
  | "homework_alert"
  | "exam_reminder"
  | "result_published"
  | "school_notice"
  | "admission_follow_up"
  | "ptm_reminder"
  | "chatbot";

export type WhatsAppMessagePayload = {
  to: string;
  category: WhatsAppTemplateCategory;
  variables: Record<string, string>;
};

export type WhatsAppQueueItem = WhatsAppMessagePayload & {
  id: string;
  status: "queued" | "sent" | "failed" | "mocked";
};
