import { TeacherProfileManager } from "@/components/teachers/TeacherProfileManager";

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeacherProfileManager teacherId={id} />;
}
