import { CalendarDays } from "lucide-react";
import { ModulePage } from "@/components/pages/ModulePage";
import { PastelModuleCard } from "@/components/cards/PastelModuleCard";
import { lessons } from "@/data/mockData";

export default function TimetablePage() {
  return (
    <ModulePage
      title="Timetable Management"
      description="Weekly class timetable, teacher timetable, periods, subject assignment, break display, and exam timetable placeholder."
      rows={lessons.map((lesson) => ({ lesson: lesson.title, class: lesson.subtitle, teacher: lesson.owner, time: lesson.time }))}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <PastelModuleCard title="Monday" description="Math, Science, Break, English, Art." href="/timetable" icon={CalendarDays} tone="blue" />
        <PastelModuleCard title="Teacher view" description="Assigned periods and substitution-ready slots." href="/timetable" icon={CalendarDays} tone="purple" />
        <PastelModuleCard title="Exam timetable" description="Draft schedule placeholder for exam module." href="/exams" icon={CalendarDays} tone="yellow" />
      </div>
    </ModulePage>
  );
}
