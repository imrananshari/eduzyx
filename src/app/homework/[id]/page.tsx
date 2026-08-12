import { DetailPage } from "@/components/pages/DetailPage";
import { homework } from "@/data/mockData";

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = homework.find((record) => record.id === id) ?? homework[0];
  return <DetailPage title={item.title} subtitle={`${item.subject} for ${item.className}. Due ${item.dueDate}. Attachment, video, submission, and checking placeholders.`} parentHref="/homework" parentLabel="Homework" />;
}
