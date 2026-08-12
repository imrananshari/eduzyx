import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function BossDashboardPage() {
  return (
    <DashboardLayout role="boss">
      <DashboardHome role="boss" />
    </DashboardLayout>
  );
}
