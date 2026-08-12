import Link from "next/link";
import { Bot, CreditCard, FileBarChart, Image, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PastelModuleCard } from "@/components/cards/PastelModuleCard";
import { AuthLinks } from "@/components/auth/AuthGateway";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-xl font-black">EduManage</Link>
        <nav className="hidden items-center gap-5 text-sm font-bold md:flex">
          <a href="#features">Features</a>
          <a href="#roles">Roles</a>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link href="/login">Login</Link></Button>
          <Button asChild><Link href="/login?mode=signup">Sign up</Link></Button>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-6xl">Manage your entire school from one smart dashboard.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f5b55]">Attendance, fees, homework, results, notices, WhatsApp alerts, AI tools, payments, and media management in one bold school platform.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link href="/request-demo">Request Demo</Link></Button>
            <Button variant="secondary" asChild><a href="#features">View Features</a></Button>
            <AuthLinks />
          </div>
        </div>
        <div className="rounded-card bg-ink p-5 text-white">
          <Badge tone="yellow">Live MVP preview</Badge>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Students", "Attendance", "Fees", "AI tools"].map((item, index) => (
              <div key={item} className={index % 2 ? "rounded-[22px] bg-pastel-purple p-4 text-ink" : "rounded-[22px] bg-pastel-yellow p-4 text-ink"}>
                <p className="text-sm font-black">{item}</p>
                <p className="mt-4 text-3xl font-black">{index === 0 ? "1.2k" : index === 1 ? "92%" : index === 2 ? "74%" : "24"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="features" className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-3">
        <PastelModuleCard title="AI + WhatsApp automation" description="Gemini-ready text generation and official WhatsApp Cloud API templates." href="/ai-assistant" icon={Bot} tone="purple" />
        <PastelModuleCard title="Fees and payments" description="Stripe-ready payment flows, transaction history, and receipt placeholders." href="/fees" icon={CreditCard} tone="yellow" />
        <PastelModuleCard title="Reports and media" description="PDF-ready reports plus ImageKit placeholders for documents, images, and videos." href="/reports" icon={FileBarChart} tone="blue" />
      </section>
      <section id="roles" className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-4">
        <PastelModuleCard title="Role dashboards" description="Admin, teacher, parent, student, and accountant workspaces." href="/login" icon={Users} tone="blue" />
        <PastelModuleCard title="Secure structure" description="Auth.js-ready role permissions and access menus." href="/settings" icon={ShieldCheck} tone="yellow" />
        <PastelModuleCard title="Media content" description="ImageKit-ready uploads for profiles and study material." href="/media" icon={Image} tone="purple" />
        <PastelModuleCard title="Parent messages" description="Fee, attendance, result, homework, and notice templates." href="/whatsapp-automation" icon={MessageCircle} tone="yellow" />
      </section>
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="rounded-card bg-ink p-8 text-white md:flex md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black">Ready to run a smarter school?</h2>
            <p className="mt-2 text-sm text-white/70">Start with the MVP and connect Neon, ImageKit, Gemini, WhatsApp, and Stripe when you are ready.</p>
          </div>
          <Button className="mt-6 md:mt-0" asChild><Link href="/request-demo">Request Demo</Link></Button>
        </div>
      </section>
      <footer className="mx-auto max-w-7xl px-5 py-8 text-sm font-bold text-[#72706c]">EduManage / School Management System SaaS</footer>
    </main>
  );
}
