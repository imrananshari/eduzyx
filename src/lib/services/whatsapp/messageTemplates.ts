import type { WhatsAppTemplateCategory } from "./whatsappTypes";

export const whatsappMessageTemplates: Record<WhatsAppTemplateCategory, string> = {
  attendance_absent_alert: "Hi {{parent}}, {{student}} is marked absent today. Please confirm.",
  fee_reminder: "Your fee payment of {{amount}} is due on {{date}}. Pay securely from EduManage.",
  fee_payment_receipt: "Payment received for {{student}}. Receipt number: {{receipt}}.",
  homework_alert: "New homework for {{class}}: {{title}}. Due {{dueDate}}.",
  exam_reminder: "{{exam}} starts on {{date}}. Please check the timetable.",
  result_published: "{{exam}} results are now available in EduManage.",
  school_notice: "School notice: {{title}}. Open EduManage for details.",
  admission_follow_up: "Thanks for your inquiry. Our admissions team will follow up soon.",
  ptm_reminder: "Reminder: Parent-teacher meeting for {{student}} is scheduled at {{time}}.",
  chatbot: "Hi, I am the EduManage assistant. How can I help?"
};

export function renderWhatsAppTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((message, [key, value]) => message.replaceAll(`{{${key}}}`, value), template);
}
