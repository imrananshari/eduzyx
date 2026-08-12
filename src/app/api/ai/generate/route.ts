import { NextResponse } from "next/server";
import { generateAIText } from "@/lib/services/ai/aiService";
import type { AIFeature } from "@/lib/services/ai/aiTypes";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { feature?: AIFeature; prompt?: string };

    if (!body.prompt || !body.feature) {
      return NextResponse.json({ error: "Feature and prompt are required." }, { status: 400 });
    }

    const result = await generateAIText({ feature: body.feature, prompt: body.prompt });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI generation failed." },
      { status: 500 }
    );
  }
}
