"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Filter, ImageUp, Loader2, Plus, Search, Settings2, UserRound, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StudentIdCard } from "@/components/students/StudentIdCard";
import { cachedJson, getCachedApiData, invalidateApiCache } from "@/lib/client/apiCache";
import { cn } from "@/lib/utils";

type Branch = {
  locationId: string;
  label: string;
  name: string;
  schoolName?: string;
  code: string;
  locationType: "school" | "branch";
};

type ClassOption = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

type StudentRow = {
  id: string;
  studentCode: string;
  admissionNumber: string | null;
  rollNo: string | null;
  name: string;
  status: string;
  imageUrl: string | null;
  locationName: string;
  classId: string | null;
  className: string;
  sectionId: string | null;
  sectionName: string;
  parentName: string;
  parentEmail: string | null;
  parentPhone: string | null;
};

type IdSetting = {
  id: string;
  locationName: string;
  className: string;
  sectionName: string;
  prefix: string;
  nextNumber: number;
  padding: number;
  includeYear: boolean;
  separator: string;
  nextPreview: string;
};

type FormState = {
  locationId: string;
  classId: string;
  sectionId: string;
  rollNo: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  admissionDate: string;
  status: string;
  imageUrl: string;
  parentName: string;
  parentRelation: string;
  parentEmail: string;
  parentPhone: string;
  parentAlternatePhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
};

const initialForm: FormState = {
  locationId: "",
  classId: "",
  sectionId: "",
  rollNo: "",
  admissionNumber: "",
  name: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  admissionDate: new Date().toISOString().slice(0, 10),
  status: "ACTIVE",
  imageUrl: "",
  parentName: "",
  parentRelation: "Father",
  parentEmail: "",
  parentPhone: "",
  parentAlternatePhone: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  notes: ""
};

const initialIdForm = {
  locationId: "",
  classId: "",
  sectionId: "",
  prefix: "STU",
  nextNumber: "1",
  padding: "4",
  separator: "-",
  includeYear: true
};

const filterStorageKey = "edumanage:students-location-filter";

function storedFilter() {
  if (typeof window === "undefined") return "all";
  return window.sessionStorage.getItem(filterStorageKey) || "all";
}

export function StudentsManager() {
  const [students, setStudents] = React.useState<StudentRow[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [filterClassOptions, setFilterClassOptions] = React.useState<ClassOption[]>([]);
  const [formClassOptions, setFormClassOptions] = React.useState<ClassOption[]>([]);
  const [locationFilter, setLocationFilter] = React.useState(storedFilter);
  const [classFilter, setClassFilter] = React.useState("all");
  const [sectionFilter, setSectionFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [idMasterOpen, setIdMasterOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [idForm, setIdForm] = React.useState(initialIdForm);
  const [idSettings, setIdSettings] = React.useState<IdSetting[]>([]);
  const [idClassOptions, setIdClassOptions] = React.useState<ClassOption[]>([]);
  const [message, setMessage] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const studentKey = `/api/students?locationId=${locationFilter}&classId=${classFilter}&sectionId=${sectionFilter}&query=${encodeURIComponent(query)}`;
  const filterOptionKey = `/api/student-options?locationId=${locationFilter || "all"}`;
  const formOptionKey = `/api/student-options?locationId=${form.locationId || "all"}`;
  const idOptionKey = `/api/student-options?locationId=${idForm.locationId || "all"}`;

  const loadStudents = React.useCallback(async () => {
    const cached = getCachedApiData<{ students?: StudentRow[] }>(studentKey);
    if (cached) {
      setStudents(cached.students ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setMessage("");
    try {
      const data = await cachedJson<{ students?: StudentRow[] }>(studentKey, { ttlMs: 5 * 60_000 });
      setStudents(data.students ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load students.");
    } finally {
      setLoading(false);
    }
  }, [studentKey]);

  React.useEffect(() => {
    async function loadBranches() {
      const data = await cachedJson<{ branches?: Branch[] }>("/api/branches?includeSchool=true", { ttlMs: 5 * 60_000 });
      const items = data.branches ?? [];
      setBranches(items);
      setForm((current) => ({ ...current, locationId: current.locationId || items[0]?.locationId || "" }));
    }
    void loadBranches();
  }, []);

  React.useEffect(() => {
    async function loadOptions() {
      const data = await cachedJson<{ classes?: ClassOption[] }>(filterOptionKey, { ttlMs: 60_000 });
      setFilterClassOptions(data.classes ?? []);
    }
    void loadOptions();
  }, [filterOptionKey]);

  React.useEffect(() => {
    async function loadFormOptions() {
      const data = await cachedJson<{ classes?: ClassOption[] }>(formOptionKey, { ttlMs: 60_000 });
      setFormClassOptions(data.classes ?? []);
    }
    void loadFormOptions();
  }, [formOptionKey]);

  React.useEffect(() => {
    async function loadIdOptions() {
      const data = await cachedJson<{ classes?: ClassOption[] }>(idOptionKey, { ttlMs: 60_000 });
      setIdClassOptions(data.classes ?? []);
    }
    void loadIdOptions();
  }, [idOptionKey]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => void loadStudents(), 180);
    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  const selectedClass = React.useMemo(() => formClassOptions.find((item) => item.id === form.classId), [formClassOptions, form.classId]);
  const selectedIdClass = React.useMemo(() => idClassOptions.find((item) => item.id === idForm.classId), [idClassOptions, idForm.classId]);
  const sectionOptions = React.useMemo(() => {
    const sections = new Map<string, string>();
    filterClassOptions.forEach((item) => item.sections.forEach((section) => sections.set(section.id, section.name)));
    return Array.from(sections.entries()).map(([id, name]) => ({ id, name }));
  }, [filterClassOptions]);
  const selectedLocation = branches.find((branch) => branch.locationId === form.locationId);
  const selectedClassName = selectedClass?.name || "Class";
  const selectedSectionName = selectedClass?.sections.find((section) => section.id === form.sectionId)?.name || "A";

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateIdForm(key: keyof typeof initialIdForm, value: string | boolean) {
    setIdForm((current) => ({ ...current, [key]: value }));
  }

  async function openIdMaster() {
    setIdMasterOpen(true);
    setMessage("");
    const locationId = branches[0]?.locationId || "";
    setIdForm((current) => ({ ...current, locationId: current.locationId || locationId }));
    try {
      const data = await cachedJson<{ settings?: IdSetting[] }>("/api/student-id-settings", { ttlMs: 60_000, force: true });
      setIdSettings(data.settings ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load ID settings.");
    }
  }

  function handleImage(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("imageUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function canGoNext() {
    if (step === 0) return Boolean(form.locationId && form.classId && form.sectionId);
    if (step === 1) return Boolean(form.name && form.admissionDate);
    if (step === 2) return Boolean(form.parentName && form.parentPhone);
    return true;
  }

  async function createStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      if (canGoNext()) setStep((current) => current + 1);
      return;
    }
    setSaving(true);
    setMessage("");
    setSuccess("");
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not onboard student.");
        return;
      }
      setSuccess(data.message ?? "Student onboarded successfully.");
      setModalOpen(false);
      setStep(0);
      setForm({ ...initialForm, locationId: form.locationId });
      invalidateApiCache("/api/students");
      await loadStudents();
      window.setTimeout(() => setSuccess(""), 2200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not onboard student.");
    } finally {
      setSaving(false);
    }
  }

  async function saveIdMaster(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setSuccess("");
    try {
      const response = await fetch("/api/student-id-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(idForm)
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not save ID master setting.");
        return;
      }
      setSuccess(data.message ?? "Student ID master setting saved.");
      invalidateApiCache("/api/student-id-settings");
      const next = await cachedJson<{ settings?: IdSetting[] }>("/api/student-id-settings", { ttlMs: 60_000, force: true });
      setIdSettings(next.settings ?? []);
      window.setTimeout(() => setSuccess(""), 1800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save ID master setting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        <PageHeader title="Student Management" description="Onboard students by campus, class, section, parent profile, and generated ID card." />

        {success ? (
          <div className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 animate-pulse items-center gap-3 rounded-pill bg-ink px-5 py-3 text-sm font-black text-white ring-4 ring-sun">
            <CheckCircle2 className="size-5 text-sun" />
            {success}
          </div>
        ) : null}

        <Card className="bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex min-h-12 flex-1 items-center rounded-pill bg-canvas px-4 ring-1 ring-ink/5">
              <Search className="size-4 text-[#72706c]" />
              <Input className="border-0 bg-transparent" placeholder="Search student, ID, parent, class..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <FilterSelect value={locationFilter} onChange={(value) => {
              setLocationFilter(value);
              window.sessionStorage.setItem(filterStorageKey, value);
              setClassFilter("all");
              setSectionFilter("all");
            }}>
              <option value="all">All locations</option>
              {branches.map((branch) => <option key={branch.locationId} value={branch.locationId}>{branch.label}</option>)}
            </FilterSelect>
            <FilterSelect value={classFilter} onChange={(value) => { setClassFilter(value); setSectionFilter("all"); }}>
              <option value="all">All classes</option>
              {filterClassOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FilterSelect>
            <FilterSelect value={sectionFilter} onChange={setSectionFilter}>
              <option value="all">All sections</option>
              {sectionOptions.map((section) => <option key={section.id} value={section.id}>Section {section.name}</option>)}
            </FilterSelect>
            <Button type="button" variant="secondary" onClick={openIdMaster}>
              <Settings2 className="size-4" />
              Student ID master
            </Button>
            <Button type="button" onClick={() => setModalOpen(true)}>
              <Plus className="size-4" />
              Add student
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-black text-[#72706c]">
              <Loader2 className="size-5 animate-spin text-cta" />
              Loading students from Neon DB...
            </div>
          ) : message ? (
            <EmptyStudents title={message} onAdd={() => setModalOpen(true)} />
          ) : students.length ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="bg-pastel-blue">
                    <TH>Student</TH>
                    <TH>Student ID</TH>
                    <TH>Class</TH>
                    <TH>Location</TH>
                    <TH>Parent</TH>
                    <TH>Status</TH>
                    <TH>Action</TH>
                  </TR>
                </THead>
                <TBody>
                  {students.map((student) => (
                    <TR key={student.id} className="hover:bg-canvas/70">
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={student.name} imageUrl={student.imageUrl} />
                          <div>
                            <p className="font-black text-ink">{student.name}</p>
                            <p className="text-xs font-bold text-[#72706c]">Roll {student.rollNo || "not set"}</p>
                          </div>
                        </div>
                      </TD>
                      <TD><Badge tone="yellow">{student.studentCode}</Badge></TD>
                      <TD><Badge tone="blue">{student.className} - {student.sectionName}</Badge></TD>
                      <TD><Badge tone="purple">{student.locationName}</Badge></TD>
                      <TD>
                        <p className="text-sm font-black text-ink">{student.parentName}</p>
                        <p className="text-xs font-bold text-[#72706c]">{student.parentPhone || student.parentEmail || "No contact"}</p>
                      </TD>
                      <TD><Badge tone={student.status === "ACTIVE" ? "orange" : "white"}>{student.status}</Badge></TD>
                      <TD>
                        <Button asChild size="sm" variant="dark">
                          <Link href={`/students/${student.id}`}>
                            <Eye className="size-4" />
                            View
                          </Link>
                        </Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : (
            <EmptyStudents title="No students found" onAdd={() => setModalOpen(true)} />
          )}
        </Card>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm">
          <form onSubmit={createStudent} className="w-full max-w-5xl rounded-card bg-white p-5 ring-4 ring-sun/70">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Badge tone="yellow">Student onboarding</Badge>
                <h2 className="mt-3 text-2xl font-black text-ink">Add student</h2>
                <p className="mt-1 text-sm leading-6 text-[#72706c]">Campus, class, profile, parent, and ID card preview in one flow.</p>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setModalOpen(false)} aria-label="Close form"><X className="size-5" /></Button>
            </div>

            <div className="mb-5 grid gap-2 sm:grid-cols-4">
              {["Class", "Student", "Parent", "Review"].map((label, index) => (
                <div key={label} className={cn("h-2 rounded-pill", index <= step ? "bg-cta" : "bg-canvas")} title={label} />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="min-h-[430px]">
                {step === 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="School / branch">
                      <select className="input-like" value={form.locationId} onChange={(event) => {
                        update("locationId", event.target.value);
                        update("classId", "");
                        update("sectionId", "");
                      }}>
                        <option value="">Select location</option>
                        {branches.map((branch) => <option key={branch.locationId} value={branch.locationId}>{branch.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Class">
                      <select className="input-like" value={form.classId} onChange={(event) => {
                        update("classId", event.target.value);
                        update("sectionId", "");
                      }}>
                        <option value="">Select class</option>
                        {formClassOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Section">
                      <select className="input-like" value={form.sectionId} onChange={(event) => update("sectionId", event.target.value)}>
                        <option value="">Select section</option>
                        {(selectedClass?.sections ?? []).map((section) => <option key={section.id} value={section.id}>Section {section.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Roll number"><Input value={form.rollNo} onChange={(event) => update("rollNo", event.target.value)} placeholder="Example: 07" /></Field>
                    <Field label="Admission number"><Input value={form.admissionNumber} onChange={(event) => update("admissionNumber", event.target.value)} placeholder="ADM-2026-001" /></Field>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Student full name"><Input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Anne Smith" /></Field>
                    <Field label="Date of birth"><Input type="date" value={form.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} /></Field>
                    <Field label="Gender">
                      <select className="input-like" value={form.gender} onChange={(event) => update("gender", event.target.value)}>
                        <option value="">Select gender</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                      </select>
                    </Field>
                    <Field label="Blood group"><Input value={form.bloodGroup} onChange={(event) => update("bloodGroup", event.target.value)} placeholder="O+" /></Field>
                    <Field label="Admission date"><Input type="date" value={form.admissionDate} onChange={(event) => update("admissionDate", event.target.value)} /></Field>
                    <Field label="Status">
                      <select className="input-like" value={form.status} onChange={(event) => update("status", event.target.value)}>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="GRADUATED">Graduated</option>
                      </select>
                    </Field>
                    <Field label="Profile photo">
                      <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-dashed border-ink/20 bg-canvas p-4">
                        <span className="flex size-11 items-center justify-center rounded-[18px] bg-sun text-ink"><ImageUp className="size-5" /></span>
                        <span className="text-sm font-black text-ink">Upload image preview</span>
                        <input className="hidden" type="file" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} />
                      </label>
                    </Field>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Parent / guardian name"><Input required value={form.parentName} onChange={(event) => update("parentName", event.target.value)} placeholder="Priya Sharma" /></Field>
                    <Field label="Relation">
                      <select className="input-like" value={form.parentRelation} onChange={(event) => update("parentRelation", event.target.value)}>
                        <option>Father</option>
                        <option>Mother</option>
                        <option>Guardian</option>
                        <option>Other</option>
                      </select>
                    </Field>
                    <Field label="Parent email"><Input type="email" value={form.parentEmail} onChange={(event) => update("parentEmail", event.target.value)} placeholder="parent@gmail.com" /></Field>
                    <Field label="Parent phone"><Input required value={form.parentPhone} onChange={(event) => update("parentPhone", event.target.value)} placeholder="+91 98765 43210" /></Field>
                    <Field label="Alternate phone"><Input value={form.parentAlternatePhone} onChange={(event) => update("parentAlternatePhone", event.target.value)} placeholder="+91 98765 43211" /></Field>
                    <Field label="Emergency contact"><Input value={form.emergencyContactName} onChange={(event) => update("emergencyContactName", event.target.value)} placeholder="Emergency contact name" /></Field>
                    <Field label="Emergency phone"><Input value={form.emergencyContactPhone} onChange={(event) => update("emergencyContactPhone", event.target.value)} placeholder="+91 90000 00000" /></Field>
                    <Field label="Address line 1"><Input value={form.addressLine1} onChange={(event) => update("addressLine1", event.target.value)} placeholder="House, street, area" /></Field>
                    <Field label="City"><Input value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="City" /></Field>
                    <Field label="State"><Input value={form.state} onChange={(event) => update("state", event.target.value)} placeholder="State" /></Field>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="grid gap-4">
                    <Card className="bg-canvas p-5">
                      <h3 className="text-lg font-black text-ink">Review before onboarding</h3>
                      <p className="mt-2 text-sm leading-6 text-[#72706c]">{form.name || "Student"} will be linked to {selectedLocation?.label || "selected location"}, {selectedClassName}, section {selectedSectionName}. Parent invite will be sent to {form.parentEmail || "parent email when added"}.</p>
                    </Card>
                    <Field label="Notes">
                      <textarea className="min-h-28 rounded-[22px] border border-ink/10 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-cta focus:ring-4 focus:ring-cta/10" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Medical notes, transport notes, or onboarding remarks." />
                    </Field>
                  </div>
                ) : null}
              </div>

              <div className="rounded-card bg-pastel-purple p-4">
                <StudentIdCard
                  data={{
                    name: form.name || "Student Name",
                    studentCode: "Generated on save",
                    className: selectedClassName,
                    sectionName: selectedSectionName,
                    schoolName: selectedLocation?.schoolName || selectedLocation?.name || "EduManage School",
                    schoolCode: selectedLocation?.code,
                    imageUrl: form.imageUrl,
                    parentEmail: form.parentEmail,
                    parentPhone: form.parentPhone,
                    issuedAt: form.admissionDate,
                    expiresAt: null,
                    profileUrl: "/students/new"
                  }}
                />
              </div>
            </div>

            {message ? <p className="mt-4 rounded-[18px] bg-pastel-yellow px-4 py-3 text-sm font-black text-ink">{message}</p> : null}
            <div className="mt-6 flex flex-wrap justify-between gap-2">
              <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><ChevronLeft className="size-4" />Back</Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button disabled={saving || !canGoNext()}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : step === 3 ? <Plus className="size-4" /> : <ChevronRight className="size-4" />}
                  {saving ? "Saving..." : step === 3 ? "Onboard student" : "Next"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {idMasterOpen ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm">
          <form onSubmit={saveIdMaster} className="w-full max-w-4xl rounded-card bg-white p-5 ring-4 ring-sun/70">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Badge tone="yellow">Student ID master</Badge>
                <h2 className="mt-3 text-2xl font-black text-ink">Set ID sequence rules</h2>
                <p className="mt-1 text-sm leading-6 text-[#72706c]">Pick campus, class, and section. New students use the most specific matching rule.</p>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setIdMasterOpen(false)} aria-label="Close ID master"><X className="size-5" /></Button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="School / branch">
                  <select className="input-like" value={idForm.locationId} onChange={(event) => {
                    updateIdForm("locationId", event.target.value);
                    updateIdForm("classId", "");
                    updateIdForm("sectionId", "");
                  }}>
                    <option value="">Select location</option>
                    {branches.map((branch) => <option key={branch.locationId} value={branch.locationId}>{branch.label}</option>)}
                  </select>
                </Field>
                <Field label="Class scope">
                  <select className="input-like" value={idForm.classId} onChange={(event) => {
                    updateIdForm("classId", event.target.value);
                    updateIdForm("sectionId", "");
                  }}>
                    <option value="">All classes</option>
                    {idClassOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="Section scope">
                  <select className="input-like" value={idForm.sectionId} onChange={(event) => updateIdForm("sectionId", event.target.value)} disabled={!idForm.classId}>
                    <option value="">All sections</option>
                    {(selectedIdClass?.sections ?? []).map((section) => <option key={section.id} value={section.id}>Section {section.name}</option>)}
                  </select>
                </Field>
                <Field label="Prefix"><Input value={idForm.prefix} onChange={(event) => updateIdForm("prefix", event.target.value.toUpperCase())} placeholder="STU-AN25" /></Field>
                <Field label="Next number"><Input type="number" min={1} value={idForm.nextNumber} onChange={(event) => updateIdForm("nextNumber", event.target.value)} /></Field>
                <Field label="Padding"><Input type="number" min={2} max={8} value={idForm.padding} onChange={(event) => updateIdForm("padding", event.target.value)} /></Field>
                <Field label="Separator"><Input maxLength={3} value={idForm.separator} onChange={(event) => updateIdForm("separator", event.target.value)} /></Field>
                <label className="flex items-center gap-3 rounded-[22px] border border-ink/10 bg-canvas px-4 py-3 text-sm font-black text-ink">
                  <input type="checkbox" checked={idForm.includeYear} onChange={(event) => updateIdForm("includeYear", event.target.checked)} />
                  Include year in ID
                </label>
              </div>

              <aside className="rounded-card bg-ink p-5 text-white">
                <Badge tone="yellow">Next preview</Badge>
                <p className="mt-4 break-all text-2xl font-black">{[
                  idForm.prefix || "STU",
                  idForm.includeYear ? String(new Date().getFullYear()) : "",
                  String(Number(idForm.nextNumber) || 1).padStart(Number(idForm.padding) || 4, "0")
                ].filter(Boolean).join(idForm.separator || "-")}</p>
                <p className="mt-3 text-sm leading-6 text-white/70">This sequence is used automatically when a new student is onboarded into the matching campus, class, and section.</p>
                <Button className="mt-5 w-full" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Settings2 className="size-4" />}
                  Save rule
                </Button>
              </aside>
            </div>

            <div className="mt-5 rounded-card bg-canvas p-4">
              <h3 className="text-sm font-black uppercase text-[#72706c]">Saved rules</h3>
              <div className="mt-3 grid gap-2">
                {idSettings.length ? idSettings.map((setting) => (
                  <div key={setting.id} className="grid gap-2 rounded-[20px] bg-white p-3 text-sm font-bold text-ink md:grid-cols-[1fr_1fr_1fr]">
                    <span>{setting.locationName}</span>
                    <span>{setting.className} - {setting.sectionName}</span>
                    <span className="font-black text-cta">{setting.nextPreview}</span>
                  </div>
                )) : <p className="rounded-[20px] bg-white p-4 text-sm font-bold text-[#72706c]">No custom ID rules yet. Default school prefix will be used.</p>}
              </div>
            </div>

            {message ? <p className="mt-4 rounded-[18px] bg-pastel-yellow px-4 py-3 text-sm font-black text-ink">{message}</p> : null}
          </form>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

function FilterSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-pill bg-canvas px-4 ring-1 ring-ink/5">
      <Filter className="size-4 text-[#72706c]" />
      <select className="bg-transparent text-sm font-black text-ink outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2"><span className="text-xs font-black uppercase text-[#72706c]">{label}</span>{children}</label>;
}

function Avatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  return (
    <span className="flex size-12 items-center justify-center overflow-hidden rounded-[18px] bg-pastel-yellow text-sm font-black text-ink">
      {imageUrl ? <img src={imageUrl} alt={name} className="size-full object-cover" /> : <UserRound className="size-5" />}
    </span>
  );
}

function EmptyStudents({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-pastel-blue">
        <UserRound className="size-7 text-ink" />
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#72706c]">Onboard students, link parents, and generate school ID cards.</p>
      <Button type="button" className="mt-5" onClick={onAdd}><Plus className="size-4" />Add student</Button>
    </div>
  );
}
