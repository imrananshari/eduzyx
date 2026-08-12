import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function ParentDashboardPage() {
  return (
    <DashboardLayout role="parent">
      <DashboardHome role="parent" />
    </DashboardLayout>
  );
}
