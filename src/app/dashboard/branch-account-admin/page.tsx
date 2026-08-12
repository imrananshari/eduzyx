import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function BranchAccountAdminDashboardPage() {
  return (
    <DashboardLayout role="branch_account_admin">
      <DashboardHome role="branch_account_admin" />
    </DashboardLayout>
  );
}
