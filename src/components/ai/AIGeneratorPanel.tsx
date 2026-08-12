"use client";

import * as React from "react";
import { Copy, Sparkles } from "lucide-react";
import { aiExamples } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function AIGeneratorPanel() {
  const [output, setOutput] = React.useState(aiExamples[0].output);
  const [prompt, setPrompt] = React.useState("Draft a friendly homework reminder for Grade 8A.");
  const [feature, setFeature] = React.useState("homework");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <section className="rounded-card bg-pastel-purple p-5">
        <Badge tone="purple">Gemini-ready</Badge>
        <h2 className="mt-4 text-2xl font-black">AI Assistant</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f5b55]">Generate text only: notices, homework, remarks, summaries, and parent messages.</p>
        <div className="mt-5 flex flex-col gap-3">
          <select className="h-11 rounded-pill border-0 bg-white px-4 text-sm font-bold outline-none" value={feature} onChange={(event) => setFeature(event.target.value)}>
            <option value="notice">AI notice generator</option>
            <option value="homework">AI homework generator</option>
            <option value="reportRemarks">Report card remarks</option>
            <option value="parentRewrite">Parent message rewriter</option>
            <option value="feeReminder">Fee reminder message</option>
            <option value="performanceSummary">Student performance summary</option>
          </select>
          <Textarea placeholder="Ask Gemini to draft a message..." value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          <Button
            variant="purple"
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const response = await fetch("/api/ai/generate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ feature, prompt })
                });
                const data = (await response.json()) as { text?: string; error?: string; mocked?: boolean };
                if (!response.ok) throw new Error(data.error ?? "AI request failed.");
                setOutput(`${data.text}${data.mocked ? "\n\n(Mock response: add GEMINI_API_KEY to use Gemini live.)" : ""}`);
              } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : "AI request failed.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <Sparkles className="size-4" />
            {loading ? "Generating..." : "Generate with AI"}
          </Button>
        </div>
        {error ? <p className="mt-3 rounded-[18px] bg-white px-4 py-3 text-sm font-bold text-cta">{error}</p> : null}
      </section>
      <section className="rounded-card bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black">Generated output</h3>
          <Button variant="ghost" size="sm">
            <Copy className="size-4" />
            Copy
          </Button>
        </div>
        <p className="mt-4 rounded-[20px] bg-canvas p-4 text-sm leading-7 text-[#5f5b55]">{output}</p>
        <Button className="mt-4">Use generated text</Button>
      </section>
    </div>
  );
}
