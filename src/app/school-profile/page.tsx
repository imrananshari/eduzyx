import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SchoolProfileManager } from "@/components/school/SchoolProfileManager";

export default function SchoolProfilePage() {
  return (
    <DashboardLayout role="admin">
      <SchoolProfileManager />
    </DashboardLayout>
  );
}
