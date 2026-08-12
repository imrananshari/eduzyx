import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { WhatsAppTemplateCard } from "@/components/cards/WhatsAppTemplateCard";
import { WhatsAppPreviewPanel } from "@/components/whatsapp/WhatsAppPreviewPanel";
import { SearchFilterBar } from "@/components/tables/SearchFilterBar";
import { whatsappTemplates } from "@/data/mockData";

export default function WhatsAppAutomationPage() {
  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        <PageHeader title="WhatsApp Automation" description="Official WhatsApp Cloud API-ready templates, toggles, message previews, test-send placeholders, delivery status, and filters." />
        <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
          <section className="flex flex-col gap-4">
            <SearchFilterBar placeholder="Filter by template type..." />
            <div className="grid gap-4 md:grid-cols-2">
              {whatsappTemplates.map((template) => <WhatsAppTemplateCard key={template.id} template={template} />)}
            </div>
          </section>
          <WhatsAppPreviewPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}
