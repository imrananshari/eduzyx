import { cn } from "@/lib/utils";

export function Progress({ value, className, indicatorClassName }: { value: number; className?: string; indicatorClassName?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-pill bg-white/70", className)}>
      <div className={cn("h-full rounded-pill bg-cta", indicatorClassName)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
