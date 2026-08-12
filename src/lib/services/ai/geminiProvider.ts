import type { AIRequestPayload, AIResponse } from "./aiTypes";

export async function generateWithGemini(payload: AIRequestPayload): Promise<AIResponse> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      text: `Mock Gemini output for ${payload.feature}: ${payload.prompt}`,
      provider: "gemini",
      mocked: true
    };
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [
          {
            text: "You are EduManage AI. Generate helpful school-management text only. Do not calculate official marks, fees, attendance, or final records."
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: payload.prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n").trim();

  return {
    text: text || "Gemini returned an empty response.",
    provider: "gemini",
    mocked: false
  };
}
