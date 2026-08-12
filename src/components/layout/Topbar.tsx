"use client";

import * as React from "react";
import { Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import type { Role } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMockUser } from "@/lib/auth/mockAuth";
import { authClient } from "@/lib/auth/client";
import { readStoredProfile } from "@/lib/auth/profile";
import { roleLabel } from "@/lib/auth/roles";
import { cachedJson, invalidateApiCache } from "@/lib/client/apiCache";
import { cn } from "@/lib/utils";
import type { AppSession } from "@/lib/auth/appSession";

export function Topbar({
  role,
  sidebarOffset = "md:ml-[64px]",
  sidebarOpen = false,
  onSidebarToggle
}: {
  role: Role;
  sidebarOffset?: string;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [appSession, setAppSession] = React.useState<AppSession | null>(null);
  const user = getMockUser(role);
  const session = authClient.useSession();
  const neonUser = session.data?.user;
  const storedProfile = readStoredProfile(neonUser?.email ?? appSession?.email);
  const email = neonUser?.email ?? appSession?.email ?? storedProfile?.email ?? "session@edumanage.app";
  const displayName = appSession?.name ?? neonUser?.name ?? storedProfile?.fullName ?? user.name;
  const displayRole = appSession?.role ?? storedProfile?.role ?? role;
  const displayImage = appSession?.image ?? neonUser?.image ?? null;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  React.useEffect(() => {
    let alive = true;
    cachedJson<{ session: AppSession | null }>("/api/custom-auth/session", { ttlMs: 5 * 60_000 })
      .then((data: { session: AppSession | null }) => {
        if (alive) setAppSession(data.session);
      })
      .catch(() => {
        if (alive) setAppSession(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <header className={cn("sticky top-0 z-20 flex min-h-[82px] items-center gap-4 bg-pastel-yellow px-4 py-4 backdrop-blur transition-all duration-300 lg:px-8", sidebarOffset)}>
      <Button size="icon" variant="dark" className="md:hidden" aria-label="Open navigation">
        <Menu className="size-5" />
      </Button>
      <Button
        size="icon"
        variant="dark"
        className="absolute -left-4 top-1/2 z-50 hidden size-9 -translate-y-1/2 ring-4 ring-pastel-blue md:inline-flex"
        onClick={onSidebarToggle}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
      </Button>
      <div className="mx-auto flex max-w-xl flex-1 items-center gap-2 rounded-pill bg-white px-2 py-1 ring-2 ring-ink/5">
        <Search className="ml-3 size-5 text-[#72706c]" />
        <Input className="h-8 border-0 bg-transparent px-1" placeholder="Search students, fees, homework..." />
        <Button size="icon" className="shrink-0" aria-label="Search">
          <Search className="size-4" />
        </Button>
      </div>
      <Button size="icon" variant="ghost" aria-label="Notifications">
        <Bell className="size-5" />
      </Button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((value) => !value)}
          className="flex items-center gap-2 rounded-pill bg-white px-2 py-2 text-left ring-2 ring-ink/5"
        >
          <Avatar imageUrl={displayImage}>{initials || user.avatar}</Avatar>
          <span className="hidden sm:block">
            <span className="block max-w-32 truncate text-sm font-black">{displayName}</span>
            <span className="block text-xs font-bold text-[#72706c]">{roleLabel(displayRole)}</span>
          </span>
          <ChevronDown className={cn("size-4 transition", profileOpen && "rotate-180")} />
        </button>
        {profileOpen ? (
          <div className="absolute right-0 top-[calc(100%+10px)] w-72 rounded-[24px] bg-white p-4 ring-2 ring-ink/10">
            <div className="flex items-center gap-3">
              <Avatar className="size-12" imageUrl={displayImage}>{initials || user.avatar}</Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{displayName}</p>
                <p className="truncate text-xs font-bold text-[#72706c]">{email}</p>
                <p className="text-xs font-black text-cta">{roleLabel(displayRole)}</p>
              </div>
            </div>
            <Button className="mt-4 w-full" variant="dark" asChild onClick={() => invalidateApiCache()}>
              <a href="/api/custom-auth/signout">
                <LogOut className="size-4" />
                Logout
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
