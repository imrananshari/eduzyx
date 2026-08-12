import { ClassDetailManager } from "@/components/classes/ClassDetailManager";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClassDetailManager classId={id} />;
}
