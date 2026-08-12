import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function StaffDashboardPage() {
  return (
    <DashboardLayout role="staff">
      <DashboardHome role="staff" />
    </DashboardLayout>
  );
}
