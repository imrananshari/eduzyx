"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Loader2, Plus, Trash2, UserRoundCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cachedJson, getCachedApiData, invalidateApiCache } from "@/lib/client/apiCache";
import { cn } from "@/lib/utils";

type ClassDetail = { id: string; name: string; description: string | null; capacity: number; branchId: string; branchName: string };
type SectionOption = { id: string; name: string };
type TeacherOption = { id: string; name: string; email: string | null; designation: string | null; imageUrl: string | null; subjectName: string; branchName: string };
type SubjectOption = { id: string; name: string };
type Assignment = {
  id: string;
  sectionId: string | null;
  sectionName: string | null;
  teacherId: string;
  teacherName: string;
  teacherImageUrl: string | null;
  subjectId: string;
  subjectName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  status: string;
};

type Payload = {
  class?: ClassDetail;
  sections?: SectionOption[];
  teachers?: TeacherOption[];
  subjects?: SubjectOption[];
  assignments?: Assignment[];
  error?: string;
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ClassTeacherAssignmentsManager({ classId }: { classId: string }) {
  const cacheKey = `/api/classes/${classId}/teacher-assignments`;
  const [schoolClass, setSchoolClass] = React.useState<ClassDetail | null>(null);
  const [sections, setSections] = React.useState<SectionOption[]>([]);
  const [teachers, setTeachers] = React.useState<TeacherOption[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectOption[]>([]);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = React.useState("");
  const [form, setForm] = React.useState({ sectionId: "", subjectName: "", dayOfWeek: "Monday", startTime: "09:00", endTime: "09:45", room: "" });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const load = React.useCallback(async () => {
    const cached = getCachedApiData<Payload>(cacheKey);
    if (cached) {
      hydrate(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setMessage("");

    try {
      const data = await cachedJson<Payload>(cacheKey);
      hydrate(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load class teacher links.");
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function hydrate(data: Payload) {
    setSchoolClass(data.class ?? null);
    setSections(data.sections ?? []);
    setTeachers(data.teachers ?? []);
    setSubjects(data.subjects ?? []);
    setAssignments(data.assignments ?? []);
    setSelectedTeacherId((current) => current || data.teachers?.[0]?.id || "");
    setForm((current) => ({ ...current, sectionId: current.sectionId || data.sections?.[0]?.id || "", subjectName: current.subjectName || data.teachers?.[0]?.subjectName || data.subjects?.[0]?.name || "" }));
  }

  function selectTeacher(teacher: TeacherOption) {
    setSelectedTeacherId(teacher.id);
    setForm((current) => ({ ...current, subjectName: teacher.subjectName === "Subject not linked" ? current.subjectName : teacher.subjectName }));
  }

  async function createAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setSuccess("");
    try {
      const response = await fetch(cacheKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, teacherId: selectedTeacherId })
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not link teacher.");
        return;
      }
      setSuccess(data.message ?? "Teacher linked successfully.");
      invalidateApiCache(cacheKey);
      invalidateApiCache("/api/classes");
      await load();
      window.setTimeout(() => setSuccess(""), 1800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not link teacher.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssignment(assignmentId: string) {
    setSaving(true);
    setMessage("");
    setSuccess("");
    try {
      const response = await fetch(`${cacheKey}/${assignmentId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not remove assignment.");
        return;
      }
      setSuccess(data.message ?? "Teacher assignment removed.");
      invalidateApiCache(cacheKey);
      invalidateApiCache("/api/classes");
      await load();
      window.setTimeout(() => setSuccess(""), 1800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove assignment.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <DashboardLayout role="admin"><div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm font-black text-[#72706c]"><Loader2 className="size-5 animate-spin text-cta" />Loading teacher links...</div></DashboardLayout>;
  }

  if (!schoolClass) {
    return (
      <DashboardLayout role="admin">
        <Card className="bg-pastel-yellow">
          <CardTitle>Class not found</CardTitle>
          <CardDescription>{message || "Could not open this class teacher assignment page."}</CardDescription>
          <Button asChild className="mt-5"><Link href="/classes"><ArrowLeft className="size-4" />Back to classes</Link></Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard/admin" }, { label: "Classes", href: "/classes" }, { label: schoolClass.name }, { label: "Teachers" }]} />
        {success ? <Toast message={success} /> : null}
        {message ? <div className="rounded-card bg-pastel-yellow p-4 text-sm font-black text-ink">{message}</div> : null}

        <Card className="bg-ink text-white">
          <Badge tone="yellow">{schoolClass.branchName}</Badge>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black">{schoolClass.name} teacher links</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Select a same-branch teacher, subject, section, and class period. This builds the branch-level teaching schedule without mixing branches.</p>
            </div>
            <Button asChild variant="secondary"><Link href="/classes"><ArrowLeft className="size-4" />Back</Link></Button>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="flex flex-col gap-5">
            <Card className="bg-pastel-blue">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Choose teacher</CardTitle>
                  <CardDescription>Only active teachers from {schoolClass.branchName} are shown here.</CardDescription>
                </div>
                <Badge tone="blue">{teachers.length} teachers</Badge>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {teachers.length ? teachers.map((teacher) => (
                  <button key={teacher.id} type="button" onClick={() => selectTeacher(teacher)} className={cn("rounded-[24px] border bg-white p-4 text-left transition hover:-translate-y-0.5", selectedTeacherId === teacher.id ? "border-cta ring-4 ring-cta/10" : "border-ink/10")}>
                    <div className="flex items-center gap-3">
                      <AvatarImage name={teacher.name} imageUrl={teacher.imageUrl} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-ink">{teacher.name}</p>
                        <p className="truncate text-xs font-bold text-[#72706c]">{teacher.designation ?? "Teacher"} - {teacher.subjectName}</p>
                      </div>
                    </div>
                    <Badge className="mt-4" tone={selectedTeacherId === teacher.id ? "orange" : "white"}>{selectedTeacherId === teacher.id ? "Selected" : teacher.branchName}</Badge>
                  </button>
                )) : <EmptyTeachers />}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Current teaching periods</CardTitle>
                  <CardDescription>Subject and period links saved in Neon DB.</CardDescription>
                </div>
                <Badge tone="yellow">{assignments.length} linked</Badge>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {assignments.length ? assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-[24px] bg-canvas p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <AvatarImage name={assignment.teacherName} imageUrl={assignment.teacherImageUrl} />
                        <div>
                          <p className="font-black text-ink">{assignment.teacherName}</p>
                          <p className="text-xs font-bold text-[#72706c]">{assignment.subjectName} - Section {assignment.sectionName}</p>
                        </div>
                      </div>
                      <Button type="button" size="icon" variant="ghost" disabled={saving} onClick={() => void deleteAssignment(assignment.id)} aria-label="Remove assignment"><Trash2 className="size-4 text-cta" /></Button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="blue">{assignment.dayOfWeek}</Badge>
                      <Badge tone="yellow">{assignment.startTime} - {assignment.endTime}</Badge>
                      {assignment.room ? <Badge tone="white">{assignment.room}</Badge> : null}
                    </div>
                  </div>
                )) : <div className="rounded-[24px] bg-pastel-purple p-5 text-sm font-bold text-[#72706c]">No teacher periods linked yet.</div>}
              </div>
            </Card>
          </section>

          <aside className="xl:sticky xl:top-28 xl:self-start">
            <Card className="bg-pastel-yellow">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-[18px] bg-ink text-white"><CalendarClock className="size-5" /></span>
                <div>
                  <CardTitle>Link period</CardTitle>
                  <CardDescription>Teacher, subject, section, day, and time.</CardDescription>
                </div>
              </div>
              <form onSubmit={createAssignment} className="mt-5 flex flex-col gap-4">
                <Field label="Selected teacher">
                  <select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold outline-none" required value={selectedTeacherId} onChange={(event) => setSelectedTeacherId(event.target.value)}>
                    <option value="">Select teacher</option>
                    {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                  </select>
                </Field>
                <Field label="Subject">
                  <Input list="class-subject-options" required className="border-ink/10" value={form.subjectName} onChange={(event) => setForm({ ...form, subjectName: event.target.value })} placeholder="Mathematics" />
                  <datalist id="class-subject-options">{subjects.map((subject) => <option key={subject.id} value={subject.name} />)}</datalist>
                </Field>
                <Field label="Section">
                  <select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold outline-none" required value={form.sectionId} onChange={(event) => setForm({ ...form, sectionId: event.target.value })}>
                    <option value="">Select section</option>
                    {sections.map((section) => <option key={section.id} value={section.id}>Section {section.name}</option>)}
                  </select>
                </Field>
                <Field label="Day">
                  <select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold outline-none" value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: event.target.value })}>
                    {daysOfWeek.map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start"><Input className="border-ink/10" type="time" required value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></Field>
                  <Field label="End"><Input className="border-ink/10" type="time" required value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></Field>
                </div>
                <Field label="Room optional"><Input className="border-ink/10" value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} placeholder="Room 204" /></Field>
                <Button disabled={saving || !teachers.length}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{saving ? "Saving..." : "Link teacher period"}</Button>
              </form>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2"><span className="text-xs font-black uppercase text-[#72706c]">{label}</span>{children}</label>;
}

function AvatarImage({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-sun text-sm font-black text-ink">{imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={name} className="size-full object-cover" />
  ) : name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>;
}

function EmptyTeachers() {
  return <div className="rounded-[24px] bg-white p-5 text-sm font-bold text-[#72706c]"><UserRoundCheck className="mb-3 size-5 text-ink" />No active teachers in this branch yet. Transfer or onboard a teacher first.</div>;
}

function Toast({ message }: { message: string }) {
  return <div className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 animate-pulse items-center gap-3 rounded-pill bg-ink px-5 py-3 text-sm font-black text-white ring-4 ring-sun"><CheckCircle2 className="size-5 text-sun" />{message}</div>;
}
