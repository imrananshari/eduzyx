import { ModulePage } from "@/components/pages/ModulePage";

const reportRows = [
  { report: "Student report", type: "Students", status: "Ready", export: "PDF placeholder" },
  { report: "Attendance report", type: "Attendance", status: "Ready", export: "PDF placeholder" },
  { report: "Fee report", type: "Fees", status: "Draft", export: "PDF placeholder" },
  { report: "Class performance report", type: "Results", status: "Ready", export: "PDF placeholder" }
];

export default function ReportsPage() {
  return (
    <ModulePage
      title="Basic Reports + PDF Generation"
      description="Student, attendance, fee, exam, pending payment, and class performance reports with clean cards and PDF export placeholders."
      rows={reportRows}
    />
  );
}
