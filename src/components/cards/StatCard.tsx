import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "yellow",
  progress
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: "yellow" | "purple" | "blue";
  progress?: number;
}) {
  const bg = tone === "yellow" ? "bg-pastel-yellow" : tone === "purple" ? "bg-pastel-purple" : "bg-pastel-blue";
  return (
    <article className={cn("rounded-card p-5", bg)}>
      <div className="flex items-start justify-between gap-4">
        <Badge tone={tone === "purple" ? "purple" : tone === "blue" ? "blue" : "yellow"}>{title}</Badge>
        <div className="flex size-11 items-center justify-center rounded-[16px] bg-white">
          <Icon className="size-5" />
        </div>
      </div>
      <strong className="mt-5 block text-3xl font-black">{value}</strong>
      <p className="mt-2 text-sm leading-6 text-[#5f5b55]">{description}</p>
      {typeof progress === "number" ? <Progress value={progress} className="mt-5" /> : null}
    </article>
  );
}
