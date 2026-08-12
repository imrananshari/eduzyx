import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function AdminDashboardPage() {
  return (
    <DashboardLayout role="admin">
      <DashboardHome role="admin" />
    </DashboardLayout>
  );
}
