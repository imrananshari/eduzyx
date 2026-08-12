import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AIGeneratorPanel } from "@/components/ai/AIGeneratorPanel";
import { DataTable } from "@/components/tables/DataTable";
import { aiExamples } from "@/data/mockData";

export default function AIAssistantPage() {
  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        <PageHeader title="AI Assistant" description="Gemini-ready text generation for notices, homework, report remarks, student summaries, fee reminder messages, and parent message rewrites." />
        <AIGeneratorPanel />
        <DataTable rows={aiExamples.map((item) => ({ feature: item.feature, prompt: item.prompt, output: item.output }))} />
      </div>
    </DashboardLayout>
  );
}
