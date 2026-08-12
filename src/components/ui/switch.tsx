"use client";

import { cn } from "@/lib/utils";

export function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange?: (value: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn("flex h-7 w-12 items-center rounded-pill p-1 transition", checked ? "bg-cta" : "bg-ink/20")}
    >
      <span className={cn("size-5 rounded-full bg-white transition", checked ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}
