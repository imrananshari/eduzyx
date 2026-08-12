import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <section className="max-w-xl rounded-card bg-pastel-purple p-8 text-center">
        <CircleAlert className="mx-auto size-12 text-cta" />
        <h1 className="mt-4 text-3xl font-black">Payment failed</h1>
        <p className="mt-2 text-sm leading-6 text-[#72706c]">Show retry guidance and Stripe error details once live payments are connected.</p>
        <Button className="mt-5" asChild><Link href="/payments">Try again</Link></Button>
      </section>
    </main>
  );
}
