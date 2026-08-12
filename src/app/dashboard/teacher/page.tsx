import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function TeacherDashboardPage() {
  return (
    <DashboardLayout role="teacher">
      <DashboardHome role="teacher" />
    </DashboardLayout>
  );
}
