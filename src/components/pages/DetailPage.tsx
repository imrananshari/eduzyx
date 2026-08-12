import { Share2 } from "lucide-react";
import { AccordionRows } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import type { Role } from "@/types";

export function DetailPage({
  title,
  subtitle,
  parentHref,
  parentLabel,
  role = "admin"
}: {
  title: string;
  subtitle: string;
  parentHref: string;
  parentLabel: string;
  role?: Role;
}) {
  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col gap-5">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard/admin" }, { label: parentLabel, href: parentHref }, { label: title }]} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <section className="flex flex-col gap-5">
            <div className="flex aspect-video items-center justify-center rounded-card bg-pastel-blue p-8 text-center">
              <div>
                <Badge tone="blue">ImageKit media placeholder</Badge>
                <h1 className="mt-4 text-3xl font-black">{title}</h1>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#5f5b55]">{subtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="yellow">24 records</Badge>
              <Badge tone="orange">Active</Badge>
              <Badge tone="white">Score 92%</Badge>
              <Badge tone="purple">AI ready</Badge>
              <Button variant="ghost">
                <Share2 className="size-4" />
                Share
              </Button>
            </div>
            <Tabs
              tabs={[
                { value: "description", label: "Description", content: <p className="rounded-card bg-white p-5 text-sm leading-7 text-[#5f5b55]">This detail screen follows the reusable 60/40 pattern with media, tabs, stats, expandable metadata, and service-ready placeholders.</p> },
                { value: "materials", label: "Materials", content: <p className="rounded-card bg-white p-5 text-sm leading-7 text-[#5f5b55]">ImageKit-ready documents, images, videos, and worksheets can attach here later.</p> },
                { value: "home", label: "Home Task", content: <p className="rounded-card bg-white p-5 text-sm leading-7 text-[#5f5b55]">Homework and action items render with status badges and due dates.</p> },
                { value: "activity", label: "Activity", content: <p className="rounded-card bg-white p-5 text-sm leading-7 text-[#5f5b55]">Audit events, updates, and user actions can appear here.</p> }
              ]}
            />
          </section>
          <aside className="rounded-card bg-white p-5">
            <h2 className="text-xl font-black">Details</h2>
            <div className="mt-4">
              <AccordionRows
                rows={[
                  { title: "Profile summary", meta: "Updated today", body: "Role-aware profile and relationship data with Neon DB-ready structure." },
                  { title: "Documents", meta: "3 files", body: "ImageKit placeholders support images, PDFs, and videos without live upload yet." },
                  { title: "Automation", meta: "WhatsApp + AI", body: "Official WhatsApp Cloud API and Gemini service placeholders are wired for later backend use." }
                ]}
              />
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
