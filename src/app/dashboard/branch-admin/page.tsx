import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function BranchAdminDashboardPage() {
  return (
    <DashboardLayout role="branch_admin">
      <DashboardHome role="branch_admin" />
    </DashboardLayout>
  );
}
