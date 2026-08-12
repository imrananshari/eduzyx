"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ tabs }: { tabs: { value: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = React.useState(tabs[0]?.value);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 rounded-pill bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={cn("rounded-pill px-4 py-2 text-sm font-black transition", active === tab.value ? "bg-ink text-white" : "text-[#72706c] hover:bg-canvas")}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((tab) => tab.value === active)?.content}</div>
    </div>
  );
}
