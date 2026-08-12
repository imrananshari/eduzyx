import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PastelModuleCard({
  title,
  description,
  href,
  icon: Icon,
  tone = "blue",
  cta = "Open"
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone?: "yellow" | "purple" | "blue";
  cta?: string;
}) {
  const bg = tone === "yellow" ? "bg-pastel-yellow" : tone === "purple" ? "bg-pastel-purple" : "bg-pastel-blue";
  return (
    <article className={cn("rounded-card p-5", bg)}>
      <div className="flex items-center justify-between gap-3">
        <Badge tone={tone === "purple" ? "purple" : tone === "blue" ? "blue" : "yellow"}>Module</Badge>
        <Icon className="size-5" />
      </div>
      <h3 className="mt-5 text-xl font-black">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-[#5f5b55]">{description}</p>
      <Button asChild className="mt-5">
        <Link href={href}>{cta}</Link>
      </Button>
    </article>
  );
}
