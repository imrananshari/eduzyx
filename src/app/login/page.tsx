import { Suspense } from "react";
import { AuthGateway } from "@/components/auth/AuthGateway";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-4 sm:p-6">
      <Suspense fallback={<div className="rounded-card bg-white p-8 text-sm font-bold text-[#72706c]">Loading...</div>}>
        <AuthGateway />
      </Suspense>
    </main>
  );
}
