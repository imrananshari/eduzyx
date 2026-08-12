import { Bot, Zap } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RightPanel({ title = "Smart alerts", action = "View report" }: { title?: string; action?: string }) {
  return (
    <aside className="rounded-card bg-ink p-5 text-white lg:sticky lg:top-24">
      <Badge tone="yellow">Recommendation</Badge>
      <div className="mt-5 flex size-14 items-center justify-center rounded-[20px] bg-grape">
        <Bot className="size-7" />
      </div>
      <h2 className="mt-5 text-2xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-white/70">
        AI spotted 12 pending fee reminders, 3 attendance absences, and a notice draft ready to polish.
      </p>
      <div className="mt-5">
        <AvatarStack items={["AS", "MI", "KK"]} extra={8} />
      </div>
      <Button className="mt-6 w-full">
        <Zap className="size-4" />
        {action}
      </Button>
    </aside>
  );
}
