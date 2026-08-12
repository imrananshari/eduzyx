import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function SuperadminDashboardPage() {
  return (
    <DashboardLayout role="superadmin">
      <DashboardHome role="superadmin" />
    </DashboardLayout>
  );
}
