import { ModulePage } from "@/components/pages/ModulePage";
import { results } from "@/data/mockData";

export default function ResultsPage() {
  return (
    <ModulePage
      title="Results"
      description="Student and parent result views, marks, grade display, report card PDF placeholder, and publish flow."
      rows={results.map((item) => ({ student: item.student, exam: item.exam, score: item.score, grade: item.grade }))}
    />
  );
}
