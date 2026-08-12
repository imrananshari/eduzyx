import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "yellow" | "orange" | "purple" | "blue" | "dark" | "white";

const toneClass: Record<BadgeTone, string> = {
  yellow: "bg-sun text-ink",
  orange: "bg-cta text-white",
  purple: "bg-grape text-white",
  blue: "bg-pastel-blue text-ink",
  dark: "bg-ink text-white",
  white: "bg-white text-ink"
};

export function Badge({ className, tone = "yellow", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn("inline-flex w-fit items-center rounded-pill px-3 py-1 text-[11px] font-black uppercase tracking-normal", toneClass[tone], className)} {...props} />;
}
