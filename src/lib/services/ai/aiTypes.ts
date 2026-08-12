export type AIFeature = "notice" | "homework" | "reportRemarks" | "performanceSummary" | "feeReminder" | "parentRewrite" | "chatbot";

export type AIRequestPayload = {
  feature: AIFeature;
  prompt: string;
  context?: Record<string, unknown>;
};

export type AIResponse = {
  text: string;
  provider: "gemini";
  mocked: boolean;
};
