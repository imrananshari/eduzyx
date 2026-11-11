"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightLeft, CheckCircle2, GraduationCap, KeyRound, Loader2, Plus, Search, Upload, UserRoundCheck, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cachedJson, getCachedApiData, invalidateApiCache } from "@/lib/client/apiCache";
import { cn } from "@/lib/utils";

type Branch = { id: string; name: string; code: string; type: string; isMain: boolean; status: string };
type Teacher = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  employeeCode: string | null;
  designation: string | null;
  status: string;
  imageUrl: string | null;
  branchId: string | null;
  branchName: string;
  subjectName: string;
  linkedClasses: string;
  classCount: number;
};
type SchoolClass = { id: string; name: string; branchId: string | null; teacherId?: string | null };

type TeacherForm = {
  name: string;
  email: string;
  phone: string;
  imageUrl: string;
  employeeCode: string;
  designation: string;
  qualification: string;
  experienceYears: string;
  subject: string;
  placement: "organization" | "branch";
  branchId: string;
  status: string;
  classIds: string[];
};

const initialTeacherForm: TeacherForm = {
  name: "",
  email: "",
  phone: "",
  imageUrl: "",
  employeeCode: "",
  designation: "",
  qualification: "",
  experienceYears: "",
  subject: "",
  placement: "branch",
  branchId: "",
  status: "active",
  classIds: []
};

const subjectOptions = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer Science", "Physics", "Chemistry", "Biology", "Art", "Music", "Physical Education", "Other"];
const designationOptions = ["Class Teacher", "Subject Teacher", "Senior Teacher", "Assistant Teacher", "Head Teacher", "Coordinator", "Vice Principal", "Principal", "Sports Coach", "Counsellor", "Librarian", "Other"];

export function TeachersManager() {
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [classes, setClasses] = React.useState<SchoolClass[]>([]);
  const [branchFilter, setBranchFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [transferTeacher, setTransferTeacher] = React.useState<Teacher | null>(null);
  const [loginTeacher, setLoginTeacher] = React.useState<Teacher | null>(null);
  const [loginEmail, setLoginEmail] = React.useState("");
  const [transferBranchId, setTransferBranchId] = React.useState("");
  const [transferReason, setTransferReason] = React.useState("");
  const [transferDate, setTransferDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = React.useState<TeacherForm>(initialTeacherForm);
  const [message, setMessage] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const selectedBranchId = form.placement === "branch" ? form.branchId : "";
  const availableClasses = classes.filter((item) => item.branchId === selectedBranchId);

  const loadBranches = React.useCallback(async () => {
    const data = await cachedJson<{ branches?: Branch[] }>("/api/branches", { ttlMs: 5 * 60_000 });
    setBranches(data.branches ?? []);
    setForm((current) => ({ ...current, branchId: current.branchId || data.branches?.[0]?.id || "" }));
  }, []);

  const loadTeachers = React.useCallback(async () => {
    const key = `/api/teachers?branchId=${branchFilter}`;
    const cached = getCachedApiData<{ teachers?: Teacher[]; error?: string }>(key);
    if (cached) {
      setTeachers(cached.teachers ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setMessage("");
    try {
      const data = await cachedJson<{ teachers?: Teacher[]; error?: string }>(key);
      setTeachers(data.teachers ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load teachers.");
    } finally {
      setLoading(false);
    }
  }, [branchFilter]);

  const loadClasses = React.useCallback(async () => {
    const data = await cachedJson<{ classes?: SchoolClass[] }>("/api/classes?branchId=all");
    setClasses(data.classes ?? []);
  }, []);

  React.useEffect(() => {
    void loadBranches();
    void loadClasses();
  }, [loadBranches, loadClasses]);

  React.useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  const filteredTeachers = React.useMemo(() => {
    const cleanQuery = query.toLowerCase().trim();
    return teachers.filter((teacher) => {
      const matchesQuery = !cleanQuery || [teacher.name, teacher.email, teacher.phone, teacher.branchName, teacher.subjectName, teacher.linkedClasses].join(" ").toLowerCase().includes(cleanQuery);
      const matchesStatus = statusFilter === "all" || teacher.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [teachers, query, statusFilter]);

  const activeCount = teachers.filter((teacher) => teacher.status === "active").length;
  const unassignedCount = teachers.filter((teacher) => !teacher.branchId).length;
  const branchTeacherCount = teachers.filter((teacher) => teacher.branchId).length;

  function updateForm<K extends keyof TeacherForm>(key: K, value: TeacherForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleClass(classId: string) {
    setForm((current) => ({
      ...current,
      classIds: current.classIds.includes(classId) ? current.classIds.filter((id) => id !== classId) : [...current.classIds, classId]
    }));
  }

  async function createTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setSuccess("");
    try {
      const payload = { ...form, branchId: form.placement === "organization" ? "" : form.branchId, classIds: form.placement === "organization" ? [] : form.classIds };
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not create teacher.");
        return;
      }
      setSuccess(data.message ?? "Teacher onboarded successfully.");
      setForm({ ...initialTeacherForm, branchId: branches[0]?.id ?? "" });
      setModalOpen(false);
      invalidateApiCache("/api/teachers");
      invalidateApiCache("/api/classes");
      await Promise.all([loadTeachers(), loadClasses()]);
      window.setTimeout(() => setSuccess(""), 1800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create teacher.");
    } finally {
      setSaving(false);
    }
  }

  async function transferSelectedTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transferTeacher) return;
    setSaving(true);
    setMessage("");
    setSuccess("");
    try {
      const response = await fetch(`/api/teachers/${transferTeacher.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toBranchId: transferBranchId, reason: transferReason, effectiveDate: transferDate })
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not transfer teacher.");
        return;
      }
      setSuccess(data.message ?? "Teacher transferred successfully.");
      setTransferTeacher(null);
      setTransferReason("");
      invalidateApiCache("/api/teachers");
      invalidateApiCache("/api/classes");
      await Promise.all([loadTeachers(), loadClasses()]);
      window.setTimeout(() => setSuccess(""), 1800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not transfer teacher.");
    } finally {
      setSaving(false);
    }
  }

  async function sendTeacherLoginInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginTeacher) return;
    setSaving(true);
    setMessage("");
    setSuccess("");
    try {
      const response = await fetch(`/api/teachers/${loginTeacher.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail })
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not send login invite.");
        return;
      }
      setSuccess(data.message ?? "Password set link sent successfully.");
      setLoginTeacher(null);
      setLoginEmail("");
      invalidateApiCache("/api/teachers");
      await loadTeachers();
      window.setTimeout(() => setSuccess(""), 2200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send login invite.");
    } finally {
      setSaving(false);
    }
  }

  function openLoginInvite(teacher: Teacher) {
    setLoginTeacher(teacher);
    setLoginEmail(teacher.email ?? "");
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        <PageHeader title="Teacher Management" description="Onboard organization teachers, place them into branches, transfer staff, and link teachers to branch classes." />
        {success ? <Toast message={success} /> : null}
        {message ? <div className="rounded-card bg-pastel-yellow p-4 text-sm font-black text-ink">{message}</div> : null}

        <Card className="bg-ink text-white">
          <Badge tone="yellow">Organization</Badge>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Branch-first teacher control</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Choose a branch to manage local teachers and class links, or view every organization teacher together.</p>
            </div>
            <select className="h-11 rounded-pill border border-white/10 bg-white px-4 text-sm font-black text-ink outline-none" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
              <option value="all">All branches</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.isMain ? "Main - " : ""}{branch.name}</option>)}
            </select>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Total teachers" value={teachers.length} />
          <Stat label="Active teachers" value={activeCount} tone="yellow" />
          <Stat label="Branch teachers" value={branchTeacherCount} tone="blue" />
          <Stat label="Organization only" value={unassignedCount} tone="purple" />
        </div>

        <Card className="bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-h-12 flex-1 items-center rounded-pill bg-canvas px-4 ring-1 ring-ink/5">
              <Search className="size-4 text-[#72706c]" />
              <Input className="border-0 bg-transparent" placeholder="Search teachers, subjects, branch, classes..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <select className="h-12 rounded-pill border border-ink/10 bg-canvas px-4 text-sm font-black text-ink outline-none" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button type="button" onClick={() => setModalOpen(true)}><Plus className="size-4" />Add teacher</Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-black text-[#72706c]"><Loader2 className="size-5 animate-spin text-cta" />Loading teachers...</div>
          ) : filteredTeachers.length ? (
            <div className="overflow-x-auto">
              <Table>
                <THead><TR className="bg-pastel-blue"><TH>Teacher</TH><TH>Branch</TH><TH>Subject</TH><TH>Classes</TH><TH>Status</TH><TH>Login</TH><TH>Actions</TH></TR></THead>
                <TBody>
                  {filteredTeachers.map((teacher) => (
                    <TR key={teacher.id} className="hover:bg-canvas/70">
                      <TD><div className="flex items-center gap-3"><AvatarImage name={teacher.name} imageUrl={teacher.imageUrl} /><div><p className="font-black text-ink">{teacher.name}</p><p className="text-xs font-bold text-[#72706c]">{teacher.email}</p></div></div></TD>
                      <TD><Badge tone={teacher.branchId ? "blue" : "white"}>{teacher.branchName}</Badge></TD>
                      <TD>{teacher.subjectName}</TD>
                      <TD><span className="text-sm font-bold text-[#72706c]">{teacher.linkedClasses}</span></TD>
                      <TD><Badge tone={teacher.status === "active" ? "yellow" : "orange"}>{teacher.status}</Badge></TD>
                      <TD>
                        <Button size="sm" variant="secondary" type="button" onClick={() => openLoginInvite(teacher)}><KeyRound className="size-4" />Invite</Button>
                      </TD>
                      <TD>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="dark"><Link href={`/teachers/${teacher.id}`}>View</Link></Button>
                          <Button size="sm" variant="secondary" type="button" onClick={() => { setTransferTeacher(teacher); setTransferBranchId(teacher.branchId ?? branches[0]?.id ?? ""); }}><ArrowRightLeft className="size-4" />Transfer</Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : <EmptyTeachers onAdd={() => setModalOpen(true)} />}
        </Card>
      </div>

      {modalOpen ? (
        <Modal title="Onboard teacher" onClose={() => setModalOpen(false)}>
          <form onSubmit={createTeacher} className="flex flex-col gap-4">
            <ImageUploadBox value={form.imageUrl} onChange={(value) => updateForm("imageUrl", value)} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name"><Input className="border-ink/10" required value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Rhea Thomas" /></Field>
              <Field label="Email"><Input className="border-ink/10" required type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="teacher@school.edu" /></Field>
              <Field label="Phone"><Input className="border-ink/10" required value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="+91 90000 11001" /></Field>
              <Field label="Employee code"><Input className="border-ink/10" value={form.employeeCode} onChange={(event) => updateForm("employeeCode", event.target.value)} placeholder="Auto from Code Settings if blank" /></Field>
              <Field label="Designation"><SelectBox value={form.designation} onChange={(value) => updateForm("designation", value)} options={designationOptions} placeholder="Select designation" /></Field>
              <Field label="Qualification"><Input className="border-ink/10" value={form.qualification} onChange={(event) => updateForm("qualification", event.target.value)} placeholder="M.Sc, B.Ed" /></Field>
              <Field label="Experience years"><Input className="border-ink/10" min={0} type="number" value={form.experienceYears} onChange={(event) => updateForm("experienceYears", event.target.value)} placeholder="5" /></Field>
              <Field label="Subject"><SelectBox value={form.subject} onChange={(value) => updateForm("subject", value)} options={subjectOptions} placeholder="Select subject" /></Field>
              <Field label="Placement"><select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold outline-none" value={form.placement} onChange={(event) => updateForm("placement", event.target.value as TeacherForm["placement"])}><option value="branch">Main / branch school</option><option value="organization">Organization only</option></select></Field>
              {form.placement === "branch" ? <Field label="Branch"><select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold outline-none" value={form.branchId} onChange={(event) => updateForm("branchId", event.target.value)}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.isMain ? "Main - " : ""}{branch.name}</option>)}</select></Field> : null}
              <Field label="Status"><select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold outline-none" value={form.status} onChange={(event) => updateForm("status", event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
            </div>
            {form.placement === "branch" ? (
              <div className="rounded-[24px] bg-pastel-blue p-4">
                <p className="text-sm font-black text-ink">Assign classes from selected branch</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableClasses.length ? availableClasses.map((item) => <button key={item.id} type="button" onClick={() => toggleClass(item.id)} className={cn("rounded-pill px-4 py-2 text-xs font-black", form.classIds.includes(item.id) ? "bg-cta text-white" : "bg-white text-ink")}>{item.name}</button>) : <span className="text-sm font-bold text-[#72706c]">No classes in this branch yet.</span>}
                </div>
              </div>
            ) : null}
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{saving ? "Saving..." : "Create teacher"}</Button></div>
          </form>
        </Modal>
      ) : null}

      {transferTeacher ? (
        <Modal title={`Transfer ${transferTeacher.name}`} onClose={() => setTransferTeacher(null)} size="sm">
          <form onSubmit={transferSelectedTeacher} className="flex flex-col gap-4">
            <div className="rounded-[22px] bg-pastel-yellow p-4 text-sm font-bold text-ink">Current branch: {transferTeacher.branchName}</div>
            <Field label="New branch"><select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold outline-none" value={transferBranchId} onChange={(event) => setTransferBranchId(event.target.value)}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></Field>
            <Field label="Effective date"><Input className="border-ink/10" type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} /></Field>
            <Field label="Reason"><Input className="border-ink/10" value={transferReason} onChange={(event) => setTransferReason(event.target.value)} placeholder="Operational transfer" /></Field>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setTransferTeacher(null)}>Cancel</Button><Button disabled={saving}><ArrowRightLeft className="size-4" />Transfer</Button></div>
          </form>
        </Modal>
      ) : null}

      {loginTeacher ? (
        <Modal title="Teacher login invite" onClose={() => setLoginTeacher(null)} size="sm">
          <form onSubmit={sendTeacherLoginInvite} className="flex flex-col gap-4">
            <div className="rounded-[24px] bg-pastel-purple p-4">
              <p className="text-xs font-black uppercase text-[#72706c]">Current login email</p>
              <p className="mt-1 break-all text-sm font-black text-ink">{loginTeacher.email || "No email linked yet"}</p>
              <p className="mt-3 text-xs font-bold leading-5 text-[#72706c]">Change the email below and send a fresh password setup link. The old invite link will stop working.</p>
            </div>
            <Field label="New email address">
              <Input className="border-ink/10" required type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="teacher@school.edu" />
            </Field>
            <div className="rounded-[22px] bg-canvas p-4 text-xs font-bold leading-5 text-[#72706c]">
              The teacher will receive a 24-hour EduManage link. After opening it, they verify OTP, set password, and then login as Teacher.
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setLoginTeacher(null)}>Cancel</Button>
              <Button disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}{saving ? "Sending..." : "Send password set link"}</Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </DashboardLayout>
  );
}

function Stat({ label, value, tone = "white" }: { label: string; value: number; tone?: "white" | "yellow" | "blue" | "purple" }) {
  const className = tone === "yellow" ? "bg-pastel-yellow" : tone === "blue" ? "bg-pastel-blue" : tone === "purple" ? "bg-pastel-purple" : "bg-white";
  return <Card className={className}><GraduationCap className="size-5" /><p className="mt-4 text-xs font-black uppercase text-[#72706c]">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></Card>;
}

function AvatarImage({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return <span className="flex size-12 items-center justify-center overflow-hidden rounded-[18px] bg-sun text-sm font-black text-ink">{imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={name} className="size-full object-cover" />
  ) : name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2"><span className="text-xs font-black uppercase text-[#72706c]">{label}</span>{children}</label>;
}

function SelectBox({ value, onChange, options, placeholder }: { value: string; onChange: (value: string) => void; options: string[]; placeholder: string }) {
  return (
    <select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none transition focus:border-cta focus:ring-4 focus:ring-cta/10" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function Modal({ title, children, onClose, size = "lg" }: { title: string; children: React.ReactNode; onClose: () => void; size?: "sm" | "lg" }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm"><div className={cn("w-full rounded-card bg-white p-5 ring-4 ring-sun/70", size === "sm" ? "max-w-lg" : "max-w-4xl")}><div className="mb-5 flex items-start justify-between gap-4"><div><Badge tone="yellow">Teacher</Badge><h2 className="mt-3 text-2xl font-black text-ink">{title}</h2></div><Button type="button" size="icon" variant="ghost" onClick={onClose}><X className="size-5" /></Button></div>{children}</div></div>;
}

function ImageUploadBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  function handleFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") onChange(reader.result); };
    reader.readAsDataURL(file);
  }
  return <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-ink/20 bg-pastel-blue p-4 text-center">{value ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={value} alt="Teacher preview" className="size-28 rounded-[22px] object-cover" />
  ) : <><Upload className="size-6" /><span className="mt-2 text-sm font-black">Upload teacher photo</span></>}<input type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} /></label>;
}

function EmptyTeachers({ onAdd }: { onAdd: () => void }) {
  return <div className="p-8 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-pastel-blue"><UserRoundCheck className="size-7" /></div><h3 className="mt-4 text-lg font-black">No teachers found</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#72706c]">Onboard organization teachers and place them into the right branch.</p><Button type="button" className="mt-5" onClick={onAdd}><Plus className="size-4" />Add teacher</Button></div>;
}

function Toast({ message }: { message: string }) {
  return <div className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 animate-pulse items-center gap-3 rounded-pill bg-ink px-5 py-3 text-sm font-black text-white ring-4 ring-sun"><CheckCircle2 className="size-5 text-sun" />{message}</div>;
}
