import { Suspense } from "react";
import { ParentInviteAccept } from "@/components/auth/ParentInviteAccept";

export default function ParentInvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <Suspense fallback={<div className="text-sm font-black text-ink">Loading invite...</div>}>
        <ParentInviteAccept />
      </Suspense>
    </main>
  );
}
