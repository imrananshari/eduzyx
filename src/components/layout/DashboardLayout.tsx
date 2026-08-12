"use client";

import * as React from "react";
import type { ReactNode } from "react";
import type { Role } from "@/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";

export function DashboardLayout({ role = "admin", children }: { role?: Role; children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const sidebarOffset = sidebarOpen ? "md:ml-[236px]" : "md:ml-[64px]";

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar role={role} isOpen={sidebarOpen} />
      <Topbar role={role} sidebarOffset={sidebarOffset} sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen((value) => !value)} />
      <main className={cn("px-4 pb-8 pt-6 transition-all duration-300 lg:px-8 lg:pt-8", sidebarOffset)}>{children}</main>
    </div>
  );
}
