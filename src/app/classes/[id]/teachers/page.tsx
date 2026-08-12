import { ClassTeacherAssignmentsManager } from "@/components/classes/ClassTeacherAssignmentsManager";

export default async function ClassTeacherAssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClassTeacherAssignmentsManager classId={id} />;
}
