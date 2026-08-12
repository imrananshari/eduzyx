"use client";

import * as React from "react";
import { ArrowRightLeft, CheckCircle2, Loader2, Save, School, UserRoundCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cachedJson, getCachedApiData, invalidateApiCache } from "@/lib/client/apiCache";

type Branch = { id: string; name: string; isMain: boolean };
type SchoolClass = { id: string; name: string; branchId: string | null; teacherId?: string | null };
type TeacherDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  employeeCode: string | null;
  designation: string | null;
  qualification: string | null;
  experienceYears: number | null;
  status: string;
  imageUrl: string | null;
  branchId: string | null;
  branchName: string;
  subjectName: string;
  linkedClasses: string;
  classes: SchoolClass[];
  transfers: Array<{ id: string; reason: string; effectiveDate: string; fromBranchName: string | null; toBranchName: string | null }>;
};

export function TeacherProfileManager({ teacherId }: { teacherId: string }) {
  const [teacher, setTeacher] = React.useState<TeacherDetail | null>(null);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [classes, setClasses] = React.useState<SchoolClass[]>([]);
  const [editing, setEditing] = React.useState(false);
  const [assigning, setAssigning] = React.useState(false);
  const [transferring, setTransferring] = React.useState(false);
  const [selectedClasses, setSelectedClasses] = React.useState<string[]>([]);
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", employeeCode: "", designation: "", qualification: "", experienceYears: "", subject: "", status: "active", imageUrl: "" });
  const [transfer, setTransfer] = React.useState({ toBranchId: "", reason: "", effectiveDate: new Date().toISOString().slice(0, 10) });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const load = React.useCallback(async () => {
    const teacherKey = `/api/teachers/${teacherId}`;
    const branchKey = "/api/branches";
    const classKey = "/api/classes?branchId=all";
    const cachedTeacher = getCachedApiData<{ teacher?: TeacherDetail; error?: string }>(teacherKey);
    const cachedBranches = getCachedApiData<{ branches?: Branch[] }>(branchKey);
    const cachedClasses = getCachedApiData<{ classes?: SchoolClass[] }>(classKey);
    if (cachedTeacher || cachedBranches || cachedClasses) setLoading(false);
    else setLoading(true);

    try {
      const [teacherData, branchData, classData] = await Promise.all([
        cachedJson<{ teacher?: TeacherDetail; error?: string }>(teacherKey),
        cachedJson<{ branches?: Branch[] }>(branchKey, { ttlMs: 5 * 60_000 }),
        cachedJson<{ classes?: SchoolClass[] }>(classKey)
      ]);
      if (teacherData.teacher) {
        const item = teacherData.teacher;
        setTeacher(item);
        setForm({
          name: item.name,
          email: item.email ?? "",
          phone: item.phone ?? "",
          employeeCode: item.employeeCode ?? "",
          designation: item.designation ?? "",
          qualification: item.qualification ?? "",
          experienceYears: item.experienceYears == null ? "" : String(item.experienceYears),
          subject: item.subjectName === "Subject not linked" ? "" : item.subjectName,
          status: item.status,
          imageUrl: item.imageUrl ?? ""
        });
        setSelectedClasses(item.classes.map((schoolClass) => schoolClass.id));
        setTransfer((current) => ({ ...current, toBranchId: item.branchId ?? branchData.branches?.[0]?.id ?? "" }));
      } else {
        setMessage(teacherData.error ?? "Could not load teacher.");
      }
      setBranches(branchData.branches ?? []);
      setClasses(classData.classes ?? []);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  React.useEffect(() => { void load(); }, [load]);

  const availableClasses = classes.filter((item) => teacher?.branchId && item.branchId === teacher.branchId);

  async function saveTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/teachers/${teacherId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) setMessage(data.error ?? "Could not update teacher.");
      else {
        setMessage(data.message ?? "Teacher updated successfully.");
        setEditing(false);
        invalidateApiCache("/api/teachers");
        await load();
      }
    } finally { setSaving(false); }
  }

  async function saveAssignments() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/teachers/${teacherId}/assign-classes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classIds: selectedClasses }) });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) setMessage(data.error ?? "Could not assign classes.");
      else {
        setMessage(data.message ?? "Classes updated successfully.");
        setAssigning(false);
        invalidateApiCache("/api/teachers");
        invalidateApiCache("/api/classes");
        await load();
      }
    } finally { setSaving(false); }
  }

  async function transferTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/teachers/${teacherId}/transfer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(transfer) });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) setMessage(data.error ?? "Could not transfer teacher.");
      else {
        setMessage(data.message ?? "Teacher transferred successfully.");
        setTransferring(false);
        invalidateApiCache("/api/teachers");
        invalidateApiCache("/api/classes");
        await load();
      }
    } finally { setSaving(false); }
  }

  if (loading) return <DashboardLayout role="admin"><div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm font-black text-[#72706c]"><Loader2 className="size-5 animate-spin text-cta" />Loading teacher...</div></DashboardLayout>;
  if (!teacher) return <DashboardLayout role="admin"><Card><CardTitle>Teacher not found</CardTitle><CardDescription>{message}</CardDescription></Card></DashboardLayout>;

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-5">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard/admin" }, { label: "Teachers", href: "/teachers" }, { label: teacher.name }]} />
        {message ? <div className="flex items-center gap-3 rounded-pill bg-pastel-yellow px-5 py-3 text-sm font-black text-ink"><CheckCircle2 className="size-5 text-cta" />{message}</div> : null}
        <Card className="bg-pastel-purple">
          <Badge tone="purple">Teacher profile</Badge>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-[26px] bg-white text-2xl font-black text-ink">{teacher.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={teacher.imageUrl} alt={teacher.name} className="size-full object-cover" />
              ) : teacher.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
              <div><CardTitle className="text-3xl">{teacher.name}</CardTitle><CardDescription>{teacher.subjectName} · {teacher.branchName}</CardDescription></div>
            </div>
            <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => setEditing(!editing)}>Edit profile</Button><Button type="button" variant="secondary" onClick={() => setAssigning(!assigning)}><School className="size-4" />Assign classes</Button><Button type="button" variant="dark" onClick={() => setTransferring(!transferring)}><ArrowRightLeft className="size-4" />Transfer</Button></div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><UserRoundCheck className="size-5" /><CardTitle className="mt-4">Contact</CardTitle><CardDescription>{teacher.email}<br />{teacher.phone}</CardDescription></Card>
          <Card><School className="size-5" /><CardTitle className="mt-4">Linked classes</CardTitle><CardDescription>{teacher.linkedClasses}</CardDescription></Card>
          <Card><ArrowRightLeft className="size-5" /><CardTitle className="mt-4">Transfers</CardTitle><CardDescription>{teacher.transfers.length} transfer record(s)</CardDescription></Card>
        </div>

        {editing ? <Card><form onSubmit={saveTeacher} className="grid gap-4 md:grid-cols-2"><Field label="Name"><Input className="border-ink/10" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Email"><Input className="border-ink/10" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Phone"><Input className="border-ink/10" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Subject"><Input className="border-ink/10" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field><Field label="Employee code"><Input className="border-ink/10" value={form.employeeCode} onChange={(event) => setForm({ ...form, employeeCode: event.target.value })} /></Field><Field label="Designation"><Input className="border-ink/10" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} /></Field><Field label="Qualification"><Input className="border-ink/10" value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value })} /></Field><Field label="Experience years"><Input className="border-ink/10" type="number" min={0} value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: event.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button disabled={saving}><Save className="size-4" />Save teacher</Button></div></form></Card> : null}

        {assigning ? <Card><CardTitle>Assign same-branch classes</CardTitle><div className="mt-4 flex flex-wrap gap-2">{availableClasses.length ? availableClasses.map((item) => <button key={item.id} type="button" onClick={() => setSelectedClasses((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} className={selectedClasses.includes(item.id) ? "rounded-pill bg-cta px-4 py-2 text-xs font-black text-white" : "rounded-pill bg-canvas px-4 py-2 text-xs font-black text-ink"}>{item.name}</button>) : <p className="text-sm font-bold text-[#72706c]">No classes in current branch.</p>}</div><Button className="mt-5" disabled={saving} onClick={saveAssignments}>Save class links</Button></Card> : null}

        {transferring ? <Card><form onSubmit={transferTeacher} className="grid gap-4 md:grid-cols-2"><Field label="Target branch"><select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold outline-none" value={transfer.toBranchId} onChange={(event) => setTransfer({ ...transfer, toBranchId: event.target.value })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.isMain ? "Main - " : ""}{branch.name}</option>)}</select></Field><Field label="Effective date"><Input type="date" value={transfer.effectiveDate} onChange={(event) => setTransfer({ ...transfer, effectiveDate: event.target.value })} /></Field><Field label="Reason"><Input value={transfer.reason} onChange={(event) => setTransfer({ ...transfer, reason: event.target.value })} placeholder="Operational transfer" /></Field><div className="md:col-span-2 flex justify-end"><Button disabled={saving}><ArrowRightLeft className="size-4" />Transfer teacher</Button></div></form></Card> : null}

        <Card><CardTitle>Transfer history</CardTitle><div className="mt-4 divide-y divide-ink/10">{teacher.transfers.length ? teacher.transfers.map((item) => <div key={item.id} className="py-3 text-sm"><p className="font-black">{item.fromBranchName ?? "Organization"} to {item.toBranchName ?? "Organization"}</p><p className="text-[#72706c]">{item.reason} · {new Date(item.effectiveDate).toLocaleDateString()}</p></div>) : <p className="text-sm font-bold text-[#72706c]">No transfer history yet.</p>}</div></Card>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2"><span className="text-xs font-black uppercase text-[#72706c]">{label}</span>{children}</label>;
}
