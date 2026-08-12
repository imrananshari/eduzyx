import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-canvas p-5">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-xl font-black">EduManage</Link>
        <h1 className="mt-10 text-4xl font-black">Pricing placeholder</h1>
        <p className="mt-2 text-sm leading-6 text-[#72706c]">Stripe-ready plans can be wired after product validation.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Starter", "Growth", "Campus"].map((plan, index) => (
            <article key={plan} className={index === 1 ? "rounded-card bg-pastel-yellow p-5" : "rounded-card bg-white p-5"}>
              <Badge tone={index === 1 ? "orange" : "blue"}>{plan}</Badge>
              <h2 className="mt-5 text-3xl font-black">{index === 0 ? "MVP" : index === 1 ? "Scale" : "Custom"}</h2>
              <p className="mt-2 text-sm leading-6 text-[#72706c]">Role dashboards, modules, service placeholders, and support scope.</p>
              <Button className="mt-5">Request Demo</Button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
