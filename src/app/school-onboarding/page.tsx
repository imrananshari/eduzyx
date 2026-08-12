import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SchoolOnboardingWizard } from "@/components/onboarding/SchoolOnboardingWizard";

export default function SchoolOnboardingPage() {
  return (
    <DashboardLayout role="admin">
      <div className="pt-2">
        <SchoolOnboardingWizard />
      </div>
    </DashboardLayout>
  );
}
