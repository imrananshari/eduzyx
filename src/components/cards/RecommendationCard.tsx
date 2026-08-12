import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RecommendationCard() {
  return (
    <article className="rounded-card bg-ink p-5 text-white">
      <Badge tone="yellow">AI Assistant</Badge>
      <h3 className="mt-5 text-xl font-black">Generate parent updates in seconds</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">Turn attendance, homework, and fee status into polished messages.</p>
      <div className="mt-4">
        <AvatarStack items={["RT", "AM", "NK"]} extra={4} />
      </div>
      <Button className="mt-5 w-full" variant="purple">Generate with AI</Button>
    </article>
  );
}
