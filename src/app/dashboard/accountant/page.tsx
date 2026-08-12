import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function AccountantDashboardPage() {
  return (
    <DashboardLayout role="accountant">
      <DashboardHome role="accountant" />
    </DashboardLayout>
  );
}
