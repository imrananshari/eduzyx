import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AICard({ title = "AI notice generator" }: { title?: string }) {
  return (
    <article className="rounded-card bg-pastel-purple p-5">
      <Badge tone="purple">AI</Badge>
      <div className="mt-5 flex size-12 items-center justify-center rounded-[18px] bg-grape text-white">
        <Bot className="size-6" />
      </div>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5f5b55]">Gemini-ready text generation for notices, homework, report remarks, and parent messages.</p>
      <Button className="mt-5" variant="purple">Use AI</Button>
    </article>
  );
}
