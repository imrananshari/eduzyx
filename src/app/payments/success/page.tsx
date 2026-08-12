import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <section className="max-w-xl rounded-card bg-pastel-yellow p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-cta" />
        <h1 className="mt-4 text-3xl font-black">Payment successful</h1>
        <p className="mt-2 text-sm leading-6 text-[#72706c]">Stripe webhook and receipt generation can be connected later.</p>
        <Button className="mt-5" asChild><Link href="/payments">Back to payments</Link></Button>
      </section>
    </main>
  );
}
