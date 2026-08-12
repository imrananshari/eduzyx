import { ModulePage } from "@/components/pages/ModulePage";
import { AICard } from "@/components/cards/AICard";
import { exams } from "@/data/mockData";

export default function ExamsPage() {
  return (
    <ModulePage
      title="Exam & Result Management"
      description="Create exams, subjects, mark entry, grade calculation placeholder, result publish button, report card PDF, and AI remarks."
      rows={exams.map((item) => ({ exam: item.title, class: item.className, starts: item.starts, status: item.status }))}
    >
      <AICard title="AI report card remarks generator" />
    </ModulePage>
  );
}
