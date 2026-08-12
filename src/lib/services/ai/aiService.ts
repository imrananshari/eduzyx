import { aiPromptTemplates } from "./aiPromptTemplates";
import { generateWithGemini } from "./geminiProvider";
import type { AIRequestPayload } from "./aiTypes";

export async function generateAIText(payload: AIRequestPayload) {
  const template = aiPromptTemplates[payload.feature];
  return generateWithGemini({
    ...payload,
    prompt: template.replace("{{prompt}}", payload.prompt)
  });
}
