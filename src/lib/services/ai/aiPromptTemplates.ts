import type { AIFeature } from "./aiTypes";

export const aiPromptTemplates: Record<AIFeature, string> = {
  notice: "Write a concise school notice for: {{prompt}}",
  homework: "Create age-appropriate homework instructions for: {{prompt}}",
  reportRemarks: "Write warm report card remarks. Do not calculate marks. Context: {{prompt}}",
  performanceSummary: "Summarize student performance from provided data only. Context: {{prompt}}",
  feeReminder: "Rewrite this fee reminder in a polite tone: {{prompt}}",
  parentRewrite: "Rewrite this parent message clearly and warmly: {{prompt}}",
  chatbot: "Answer as a school assistant using provided context only: {{prompt}}"
};
