"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccordionRows({ rows }: { rows: { title: string; meta: string; body: string }[] }) {
  const [open, setOpen] = React.useState(rows[0]?.title);
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.title} className="rounded-[20px] bg-white p-4">
          <button className="flex w-full items-center justify-between gap-4 text-left" onClick={() => setOpen(open === row.title ? "" : row.title)}>
            <span>
              <span className="block text-sm font-black">{row.title}</span>
              <span className="text-xs text-[#72706c]">{row.meta}</span>
            </span>
            <ChevronDown className={cn("size-4 transition", open === row.title && "rotate-180")} />
          </button>
          {open === row.title ? <p className="mt-3 text-sm leading-6 text-[#72706c]">{row.body}</p> : null}
        </div>
      ))}
    </div>
  );
}
