import { HomeworkForm } from "@/components/forms/EntityForms";
import { ModulePage } from "@/components/pages/ModulePage";
import { AICard } from "@/components/cards/AICard";
import { homework } from "@/data/mockData";

export default function HomeworkPage() {
  return (
    <ModulePage
      title="Homework / Assignment Management"
      description="Create homework, attach ImageKit-ready media, view parent/student status, and use AI homework generator placeholders."
      rows={homework.map((item) => ({ title: item.title, subject: item.subject, class: item.className, dueDate: item.dueDate, status: item.status }))}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <HomeworkForm />
        <AICard title="AI homework generator" />
      </div>
    </ModulePage>
  );
}
