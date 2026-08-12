import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function SimpleList({
  rows,
  statusTone = "blue"
}: {
  rows: { title: string; subtitle: string; owner?: string; meta: string; status?: string }[];
  statusTone?: "yellow" | "orange" | "purple" | "blue" | "dark" | "white";
}) {
  return (
    <div className="rounded-card bg-white p-3">
      {rows.map((row) => (
        <div key={`${row.title}-${row.meta}`} className="flex items-center justify-between gap-4 rounded-[18px] px-3 py-4 odd:bg-canvas/70">
          <div className="flex min-w-0 items-center gap-3">
            {row.owner ? <Avatar className="shrink-0">{row.owner.split(" ").map((part) => part[0]).join("").slice(0, 2)}</Avatar> : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{row.title}</p>
              <p className="truncate text-xs text-[#72706c]">{row.subtitle}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            {row.status ? <Badge tone={statusTone}>{row.status}</Badge> : null}
            <p className="mt-1 text-xs font-bold text-[#72706c]">{row.meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
