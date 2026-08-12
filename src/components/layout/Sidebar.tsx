"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { itemsForRole } from "@/data/navigation";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

export function Sidebar({ role, isOpen }: { role: Role; isOpen: boolean }) {
  const pathname = usePathname();
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col bg-ink px-2 py-4 transition-all duration-300 md:flex", isOpen ? "w-[236px]" : "w-[64px] items-center")}>
      <div className={cn("flex h-14 w-full items-center", isOpen ? "justify-start px-1" : "justify-center")}>
        <Link href="/" className={cn("flex h-12 items-center rounded-[18px] bg-sun text-ink ring-2 ring-white/10", isOpen ? "w-full gap-3 px-3" : "size-12 justify-center")} aria-label="EduManage home">
          <Sparkles className="size-5 shrink-0" />
          {isOpen ? (
            <span className="leading-none">
              <span className="block text-sm font-black">EduManage</span>
              <span className="block text-[10px] font-black uppercase text-ink/60">School OS</span>
            </span>
          ) : null}
        </Link>
      </div>
      <nav className={cn("mt-4 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-[24px]  p-1.5", isOpen ? "w-full" : "items-center")}>
        {itemsForRole(role).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={`${role}-${item.href}-${item.label}`}
              href={item.href}
              title={item.label}
              className={cn(
                "group relative flex h-16 items-center overflow-hidden rounded-[20px] text-sm font-black text-white transition",
                "hover:bg-white hover:text-ink hover:ring-2 hover:ring-white/20",
                isOpen ? "w-full justify-start gap-4 px-3.5" : "size-14 justify-center",
                active && "bg-sun text-ink ring-5 ring-white/10 hover:bg-sun hover:text-ink"
              )}
            >
              {active && isOpen ? <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-cta" /> : null}
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-[15px] transition", active ? "bg-cta/90" : "bg-white/10 text-white group-hover:bg-pastel-purple group-hover:text-ink")}>
                <Icon className="size-3 shrink-0" />
              </span>
              {isOpen ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
