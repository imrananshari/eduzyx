import { ModulePage } from "@/components/pages/ModulePage";
import { NoticeForm } from "@/components/forms/EntityForms";
import { AICard } from "@/components/cards/AICard";
import { notices } from "@/data/mockData";

export default function NoticesPage() {
  return (
    <ModulePage
      title="Notice / Announcement System"
      description="School-wide and class-specific notices with AI generator, WhatsApp trigger, email, and push placeholders."
      rows={notices.map((notice) => ({ title: notice.title, audience: notice.audience, date: notice.date, channel: notice.channel }))}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <NoticeForm />
        <AICard title="AI notice generator" />
      </div>
    </ModulePage>
  );
}
