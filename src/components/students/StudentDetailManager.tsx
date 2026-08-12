"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, IdCard, Loader2, Mail, Printer, Save, Send, UserRound, UsersRound } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { StudentIdCard } from "@/components/students/StudentIdCard";
import { cachedJson, getCachedApiData, invalidateApiCache } from "@/lib/client/apiCache";

type Assignment = {
  id: string;
  teacherName: string;
  subjectName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
};

type StudentDetail = {
  id: string;
  studentCode: string;
  admissionNumber: string | null;
  rollNo: string | null;
  name: string;
  status: string;
  imageUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  admissionDate: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  idCardIssuedAt: string | null;
  idCardExpiresAt: string | null;
  notes: string | null;
  schoolName: string | null;
  schoolCode: string | null;
  schoolLogoUrl: string | null;
  locationName: string;
  className: string;
  sectionName: string;
  parentName: string;
  parentEmail: string | null;
  parentPhone: string;
  parentRelation: string | null;
  parentAlternatePhone: string | null;
  teacherAssignments: Assignment[];
};

export function StudentDetailManager({ studentId }: { studentId: string }) {
  const cacheKey = `/api/students/${studentId}`;
  const [student, setStudent] = React.useState<StudentDetail | null>(() => getCachedApiData<{ student?: StudentDetail }>(cacheKey)?.student ?? null);
  const [loading, setLoading] = React.useState(!student);
  const [message, setMessage] = React.useState("");
  const [sendingInvite, setSendingInvite] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editForm, setEditForm] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let active = true;
    async function loadStudent() {
      if (!getCachedApiData(cacheKey)) setLoading(true);
      setMessage("");
      try {
        const data = await cachedJson<{ student?: StudentDetail }>(cacheKey, { ttlMs: 5 * 60_000 });
        if (active) {
          setStudent(data.student ?? null);
          if (data.student) setEditForm(studentToForm(data.student));
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Could not load student.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadStudent();
    return () => {
      active = false;
    };
  }, [cacheKey]);

  async function resendInvite() {
    setSendingInvite(true);
    setMessage("");
    try {
      const response = await fetch(`/api/students/${studentId}/parent-invite`, { method: "POST" });
      const data = (await response.json()) as { error?: string; message?: string };
      setMessage(response.ok ? data.message ?? "Parent invite sent." : data.error ?? "Could not send parent invite.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send parent invite.");
    } finally {
      setSendingInvite(false);
    }
  }

  async function saveStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not update student.");
        return;
      }
      invalidateApiCache(`/api/students/${studentId}`);
      invalidateApiCache("/api/students");
      const fresh = await cachedJson<{ student?: StudentDetail }>(cacheKey, { force: true, ttlMs: 5 * 60_000 });
      setStudent(fresh.student ?? null);
      if (fresh.student) setEditForm(studentToForm(fresh.student));
      setMessage(data.message ?? "Student updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update student.");
    } finally {
      setSaving(false);
    }
  }

  function updateEdit(key: string, value: string) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  function printCard() {
    window.print();
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-5">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard/admin" }, { label: "Students", href: "/students" }, { label: student?.name ?? "Student detail" }]} />

        {loading ? (
          <Card className="flex min-h-96 items-center justify-center gap-3 bg-white text-sm font-black text-[#72706c]">
            <Loader2 className="size-5 animate-spin text-cta" />
            Loading student from Neon DB...
          </Card>
        ) : !student ? (
          <Card className="bg-white p-8 text-center">
            <h1 className="text-xl font-black text-ink">{message || "Student not found"}</h1>
            <Button asChild className="mt-5"><Link href="/students"><ArrowLeft className="size-4" />Back to students</Link></Button>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="flex flex-col gap-5">
              <Card className="bg-pastel-blue p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex size-20 items-center justify-center overflow-hidden rounded-[28px] bg-white text-2xl font-black text-ink">
                      {student.imageUrl ? <img src={student.imageUrl} alt={student.name} className="size-full object-cover" /> : <UserRound className="size-8" />}
                    </span>
                    <div>
                      <Badge tone="yellow">{student.studentCode}</Badge>
                      <h1 className="mt-3 text-3xl font-black text-ink">{student.name}</h1>
                      <p className="mt-1 text-sm font-bold text-[#5f5b55]">{student.className} - Section {student.sectionName} at {student.locationName}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={printCard}><Printer className="size-4" />Print ID</Button>
                    <Button type="button" disabled={sendingInvite} onClick={resendInvite}><Send className="size-4" />{sendingInvite ? "Sending..." : "Parent invite"}</Button>
                  </div>
                </div>
              </Card>

              {message ? <p className="rounded-[18px] bg-pastel-yellow px-4 py-3 text-sm font-black text-ink">{message}</p> : null}

              <div className="flex flex-wrap gap-2">
                <Badge tone="orange">{student.status}</Badge>
                <Badge tone="white">Roll {student.rollNo || "not set"}</Badge>
                <Badge tone="purple">{student.teacherAssignments.length} teacher periods</Badge>
                <Badge tone="blue">{student.bloodGroup || "Blood group not set"}</Badge>
              </div>

              <Tabs
                tabs={[
                  {
                    value: "profile",
                    label: "Profile",
                    content: (
                      <Card className="bg-white p-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <Info label="Admission no" value={student.admissionNumber || "Not set"} />
                          <Info label="Admission date" value={formatDate(student.admissionDate)} />
                          <Info label="Date of birth" value={formatDate(student.dateOfBirth)} />
                          <Info label="Gender" value={student.gender || "Not set"} />
                          <Info label="Emergency" value={student.emergencyContactPhone || "Not set"} />
                          <Info label="Address" value={[student.addressLine1, student.city, student.state].filter(Boolean).join(", ") || "Not set"} />
                        </div>
                      </Card>
                    )
                  },
                  {
                    value: "parent",
                    label: "Parent",
                    content: (
                      <Card className="bg-white p-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Info label="Guardian" value={`${student.parentName}${student.parentRelation ? ` (${student.parentRelation})` : ""}`} />
                          <Info label="Email" value={student.parentEmail || "Not set"} />
                          <Info label="Phone" value={student.parentPhone || "Not set"} />
                          <Info label="Alternate" value={student.parentAlternatePhone || "Not set"} />
                        </div>
                      </Card>
                    )
                  },
                  {
                    value: "teachers",
                    label: "Teachers",
                    content: (
                      <Card className="bg-white p-5">
                        <div className="grid gap-3">
                          {student.teacherAssignments.length ? student.teacherAssignments.map((assignment) => (
                            <div key={assignment.id} className="rounded-[22px] bg-pastel-yellow p-4">
                              <div className="flex flex-wrap justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-ink">{assignment.teacherName}</p>
                                  <p className="mt-1 text-xs font-bold text-[#5f5b55]">{assignment.subjectName}</p>
                                </div>
                                <Badge tone="orange">{assignment.dayOfWeek}</Badge>
                              </div>
                              <p className="mt-3 text-xs font-black text-ink">{assignment.startTime} - {assignment.endTime} {assignment.room ? `, ${assignment.room}` : ""}</p>
                            </div>
                          )) : <p className="rounded-[22px] bg-canvas p-5 text-sm font-bold text-[#72706c]">No teacher periods linked for this section yet.</p>}
                        </div>
                      </Card>
                    )
                  },
                  {
                    value: "id",
                    label: "ID & Roll",
                    content: (
                      <Card className="bg-white p-5">
                        <form onSubmit={saveStudent} className="grid gap-4 sm:grid-cols-3">
                          <EditField label="Student ID"><Input value={editForm.studentCode ?? ""} onChange={(event) => updateEdit("studentCode", event.target.value)} /></EditField>
                          <EditField label="Roll number"><Input value={editForm.rollNo ?? ""} onChange={(event) => updateEdit("rollNo", event.target.value)} /></EditField>
                          <EditField label="Admission no"><Input value={editForm.admissionNumber ?? ""} onChange={(event) => updateEdit("admissionNumber", event.target.value)} /></EditField>
                          <div className="sm:col-span-3">
                            <Button disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save ID details</Button>
                          </div>
                        </form>
                      </Card>
                    )
                  },
                  {
                    value: "edit",
                    label: "Edit Profile",
                    content: (
                      <Card className="bg-white p-5">
                        <form onSubmit={saveStudent} className="grid gap-4 sm:grid-cols-2">
                          <EditField label="Student name"><Input value={editForm.name ?? ""} onChange={(event) => updateEdit("name", event.target.value)} /></EditField>
                          <EditField label="Blood group"><Input value={editForm.bloodGroup ?? ""} onChange={(event) => updateEdit("bloodGroup", event.target.value)} /></EditField>
                          <EditField label="Date of birth"><Input type="date" value={editForm.dateOfBirth ?? ""} onChange={(event) => updateEdit("dateOfBirth", event.target.value)} /></EditField>
                          <EditField label="Admission date"><Input type="date" value={editForm.admissionDate ?? ""} onChange={(event) => updateEdit("admissionDate", event.target.value)} /></EditField>
                          <EditField label="Gender"><Input value={editForm.gender ?? ""} onChange={(event) => updateEdit("gender", event.target.value)} /></EditField>
                          <EditField label="Status">
                            <select className="input-like" value={editForm.status ?? "ACTIVE"} onChange={(event) => updateEdit("status", event.target.value)}>
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                              <option value="GRADUATED">Graduated</option>
                            </select>
                          </EditField>
                          <EditField label="Address line 1"><Input value={editForm.addressLine1 ?? ""} onChange={(event) => updateEdit("addressLine1", event.target.value)} /></EditField>
                          <EditField label="Address line 2"><Input value={editForm.addressLine2 ?? ""} onChange={(event) => updateEdit("addressLine2", event.target.value)} /></EditField>
                          <EditField label="City"><Input value={editForm.city ?? ""} onChange={(event) => updateEdit("city", event.target.value)} /></EditField>
                          <EditField label="State"><Input value={editForm.state ?? ""} onChange={(event) => updateEdit("state", event.target.value)} /></EditField>
                          <EditField label="Postal code"><Input value={editForm.postalCode ?? ""} onChange={(event) => updateEdit("postalCode", event.target.value)} /></EditField>
                          <EditField label="Emergency phone"><Input value={editForm.emergencyContactPhone ?? ""} onChange={(event) => updateEdit("emergencyContactPhone", event.target.value)} /></EditField>
                          <EditField label="Parent name"><Input value={editForm.parentName ?? ""} onChange={(event) => updateEdit("parentName", event.target.value)} /></EditField>
                          <EditField label="Parent email"><Input type="email" value={editForm.parentEmail ?? ""} onChange={(event) => updateEdit("parentEmail", event.target.value)} /></EditField>
                          <EditField label="Parent phone"><Input value={editForm.parentPhone ?? ""} onChange={(event) => updateEdit("parentPhone", event.target.value)} /></EditField>
                          <EditField label="Parent relation"><Input value={editForm.parentRelation ?? ""} onChange={(event) => updateEdit("parentRelation", event.target.value)} /></EditField>
                          <div className="sm:col-span-2">
                            <Button disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save profile</Button>
                          </div>
                        </form>
                      </Card>
                    )
                  },
                  {
                    value: "documents",
                    label: "Documents",
                    content: (
                      <Card className="bg-white p-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[22px] border border-dashed border-ink/20 bg-canvas p-5">
                            <p className="text-sm font-black text-ink">Birth certificate</p>
                            <p className="mt-2 text-sm leading-6 text-[#72706c]">ImageKit-ready document upload placeholder.</p>
                          </div>
                          <div className="rounded-[22px] border border-dashed border-ink/20 bg-canvas p-5">
                            <p className="text-sm font-black text-ink">Transfer certificate</p>
                            <p className="mt-2 text-sm leading-6 text-[#72706c]">Add document storage after ImageKit backend route.</p>
                          </div>
                        </div>
                      </Card>
                    )
                  }
                ]}
              />
            </section>

            <aside className="flex flex-col gap-4">
              <div className="student-print-area rounded-card bg-pastel-purple p-5">
                <StudentIdCard
                  data={{
                    name: student.name,
                    studentCode: student.studentCode,
                    className: student.className,
                    sectionName: student.sectionName,
                    schoolName: student.schoolName || "EduManage School",
                    schoolCode: student.schoolCode,
                    schoolLogoUrl: student.schoolLogoUrl,
                    imageUrl: student.imageUrl,
                    parentEmail: student.parentEmail,
                    parentPhone: student.parentPhone,
                    bloodGroup: student.bloodGroup,
                    address: [student.addressLine1, student.city, student.state].filter(Boolean).join(", "),
                    issuedAt: student.idCardIssuedAt || student.admissionDate,
                    expiresAt: student.idCardExpiresAt,
                    profileUrl: typeof window === "undefined" ? `/students/${student.id}` : `${window.location.origin}/students/${student.id}`
                  }}
                />
              </div>
              <QuickCard icon={<IdCard className="size-5" />} label="ID card" value={student.studentCode} />
              <QuickCard icon={<UsersRound className="size-5" />} label="Parent" value={student.parentName} />
              <QuickCard icon={<Mail className="size-5" />} label="Parent email" value={student.parentEmail || "Not set"} />
              <QuickCard icon={<CalendarDays className="size-5" />} label="Joined" value={formatDate(student.admissionDate)} />
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function studentToForm(student: StudentDetail) {
  return {
    studentCode: student.studentCode,
    admissionNumber: student.admissionNumber ?? "",
    rollNo: student.rollNo ?? "",
    name: student.name,
    status: student.status,
    imageUrl: student.imageUrl ?? "",
    dateOfBirth: dateInput(student.dateOfBirth),
    gender: student.gender ?? "",
    bloodGroup: student.bloodGroup ?? "",
    admissionDate: dateInput(student.admissionDate),
    emergencyContactName: student.emergencyContactName ?? "",
    emergencyContactPhone: student.emergencyContactPhone ?? "",
    addressLine1: student.addressLine1 ?? "",
    addressLine2: student.addressLine2 ?? "",
    city: student.city ?? "",
    state: student.state ?? "",
    postalCode: student.postalCode ?? "",
    parentName: student.parentName ?? "",
    parentEmail: student.parentEmail ?? "",
    parentPhone: student.parentPhone ?? "",
    parentRelation: student.parentRelation ?? "",
    parentAlternatePhone: student.parentAlternatePhone ?? "",
    notes: student.notes ?? ""
  };
}

function dateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-canvas p-4">
      <p className="text-xs font-black uppercase text-[#72706c]">{label}</p>
      <p className="mt-2 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2"><span className="text-xs font-black uppercase text-[#72706c]">{label}</span>{children}</label>;
}

function QuickCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-[18px] bg-pastel-blue text-ink">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[#72706c]">{label}</p>
          <p className="mt-1 truncate text-sm font-black text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}
