import { StudentDetailManager } from "@/components/students/StudentDetailManager";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetailManager studentId={id} />;
}
