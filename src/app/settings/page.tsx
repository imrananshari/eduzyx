import { ModulePage } from "@/components/pages/ModulePage";

export default function SettingsPage() {
  return (
    <ModulePage
      title="Settings"
      description="Role permissions, environment readiness, Auth.js structure, integrations, school profile, and notification preferences."
      rows={[
        { setting: "Auth.js provider", value: "Ready placeholder", status: "Mock" },
        { setting: "Neon DATABASE_URL", value: "Environment variable", status: "Not connected" },
        { setting: "ImageKit", value: "Upload placeholders", status: "Ready" },
        { setting: "Stripe", value: "Payment service files", status: "Ready" },
        { setting: "Gemini", value: "Text-only AI service", status: "Ready" }
      ]}
    />
  );
}
