import { Suspense } from "react";
import { UserInviteAccept } from "@/components/auth/UserInviteAccept";

export default function UserInvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <Suspense fallback={<div className="text-sm font-black text-ink">Loading invite...</div>}>
        <UserInviteAccept />
      </Suspense>
    </main>
  );
}
