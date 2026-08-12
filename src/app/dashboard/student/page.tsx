import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function StudentDashboardPage() {
  return (
    <DashboardLayout role="student">
      <DashboardHome role="student" />
    </DashboardLayout>
  );
}
