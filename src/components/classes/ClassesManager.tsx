"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenCheck, CheckCircle2, Filter, Link2, Loader2, Plus, Search, UsersRound, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cachedJson, getCachedApiData, invalidateApiCache } from "@/lib/client/apiCache";
import { classOptionsForRange } from "@/lib/constants/classLevels";

type SchoolClass = {
  id: string;
  name: string;
  sections: string;
  description: string;
  capacity: number;
  branchId: string | null;
  branchName: string;
  teacherId: string | null;
  teacherName: string;
  assignmentCount: number;
  createdAt: string;
};

type Branch = {
  id: string;
  locationId: string;
  locationType: "school" | "branch";
  name: string;
  label: string;
  code: string;
  type?: string;
  isMain: boolean;
  classFrom: string;
  classTo: string;
  branchId: string | null;
  branchName?: string | null;
  schoolId: string;
  schoolName?: string;
};

type FormState = {
  classNames: string[];
  sections: string[];
  selectedClassName: string;
  selectedSection: string;
  customSection: string;
  description: string;
  capacity: string;
  locationId: string;
};

const initialForm: FormState = {
  classNames: [],
  sections: ["A"],
  selectedClassName: "",
  selectedSection: "A",
  customSection: "",
  description: "",
  capacity: "40",
  locationId: ""
};

const classLocationFilterKey = "edumanage:classes-location-filter";

function getStoredLocationFilter() {
  if (typeof window === "undefined") return "all";
  return window.sessionStorage.getItem(classLocationFilterKey) || "all";
}

export function ClassesManager() {
  const [classes, setClasses] = React.useState<SchoolClass[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [sectionOptionsBase, setSectionOptionsBase] = React.useState<string[]>([]);
  const [branchFilter, setBranchFilter] = React.useState(getStoredLocationFilter);
  const [query, setQuery] = React.useState("");
  const [sectionFilter, setSectionFilter] = React.useState("all");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [message, setMessage] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadClasses = React.useCallback(async () => {
    const key = `/api/classes?locationId=${branchFilter || "all"}`;
    const cached = getCachedApiData<{ classes?: SchoolClass[]; error?: string }>(key);
    if (cached) {
      setClasses(cached.classes ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setMessage("");

    try {
      const data = await cachedJson<{ classes?: SchoolClass[]; error?: string }>(key);
      setClasses(data.classes ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load classes.");
    } finally {
      setLoading(false);
    }
  }, [branchFilter]);

  const loadBranches = React.useCallback(async () => {
    const data = await cachedJson<{ branches?: Branch[] }>("/api/branches?includeSchool=true", { ttlMs: 5 * 60_000 });
    const items = data.branches ?? [];
    setBranches(items);
    setBranchFilter((current) => current || "all");
    setForm((current) => ({ ...current, locationId: current.locationId || items[0]?.locationId || "" }));
  }, []);

  const loadOptions = React.useCallback(async () => {
    const data = await cachedJson<{ classNames?: string[]; sectionNames?: string[] }>("/api/class-options", { ttlMs: 10 * 60_000 });
    setSectionOptionsBase(data.sectionNames ?? []);
  }, []);

  React.useEffect(() => {
    void loadBranches();
    void loadOptions();
  }, [loadBranches, loadOptions]);

  React.useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const sectionOptions = React.useMemo(() => {
    const sections = new Set<string>();
    classes.forEach((item) => {
      item.sections.split(",").forEach((section) => {
        const clean = section.trim();
        if (clean && clean !== "No sections") sections.add(clean);
      });
    });
    return Array.from(sections).sort();
  }, [classes]);

  const selectedBranch = React.useMemo(() => branches.find((branch) => branch.locationId === form.locationId), [branches, form.locationId]);
  const availableClassOptions = React.useMemo(() => classOptionsForRange(selectedBranch?.classFrom, selectedBranch?.classTo), [selectedBranch]);

  const filteredClasses = React.useMemo(() => {
    const cleanQuery = query.toLowerCase().trim();
    return classes.filter((item) => {
      const matchesQuery = !cleanQuery || [item.name, item.sections, item.description, item.teacherName, item.branchName].join(" ").toLowerCase().includes(cleanQuery);
      const matchesSection = sectionFilter === "all" || item.sections.split(",").map((section) => section.trim()).includes(sectionFilter);
      return matchesQuery && matchesSection;
    });
  }, [classes, query, sectionFilter]);

  function updateForm(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function addFormValue(key: "classNames" | "sections", value: string) {
    if (!value) return;
    setForm((current) => {
      const values = current[key];
      return { ...current, [key]: values.includes(value) ? values : [...values, value] };
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function removeFormValue(key: "classNames" | "sections", value: string) {
    setForm((current) => {
      const values = current[key];
      return { ...current, [key]: values.filter((item) => item !== value) };
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function addCustomSection() {
    const section = form.customSection.trim().toUpperCase();
    if (!section) return;
    setForm((current) => ({ ...current, sections: current.sections.includes(section) ? current.sections : [...current.sections, section], customSection: "" }));
    setErrors((current) => ({ ...current, sections: undefined }));
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.classNames.length) nextErrors.classNames = "Select at least one class.";
    if (!form.sections.length) nextErrors.sections = "Add at least one section.";
    if (!form.description.trim()) nextErrors.description = "Short description is required.";
    if (!form.locationId.trim()) nextErrors.locationId = "Select a school or branch.";
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 300) nextErrors.capacity = "Capacity must be 1 to 300.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess("");
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: form.locationId,
          classNames: form.classNames,
          sections: form.sections,
          capacity: form.capacity,
          description: form.description
        })
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Could not create class.");
        return;
      }

      setSuccess(data.message ?? "Classes created successfully.");
      setForm({ ...initialForm, locationId: form.locationId });
      setModalOpen(false);
      invalidateApiCache("/api/classes");
      await loadClasses();
      window.setTimeout(() => setSuccess(""), 1800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create class.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Class & Section Management"
          description="Create branch class offerings from organization templates, then link teachers by subject and period."
        />

        {success ? (
          <div className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 animate-pulse items-center gap-3 rounded-pill bg-ink px-5 py-3 text-sm font-black text-white ring-4 ring-sun">
            <CheckCircle2 className="size-5 text-sun" />
            {success}
          </div>
        ) : null}

        <Card className="bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-h-12 flex-1 items-center rounded-pill bg-canvas px-4 ring-1 ring-ink/5">
              <Search className="size-4 text-[#72706c]" />
              <Input className="border-0 bg-transparent" placeholder="Search classes, sections, descriptions..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="flex min-h-12 items-center gap-2 rounded-pill bg-canvas px-4 ring-1 ring-ink/5">
              <Filter className="size-4 text-[#72706c]" />
              <select className="bg-transparent text-sm font-black text-ink outline-none" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
                <option value="all">All sections</option>
                {sectionOptions.map((section) => <option key={section} value={section}>{section}</option>)}
              </select>
            </div>
            <select
              className="h-12 rounded-pill border border-ink/10 bg-canvas px-4 text-sm font-black text-ink outline-none"
              value={branchFilter}
              onChange={(event) => {
                const nextFilter = event.target.value;
                setBranchFilter(nextFilter);
                window.sessionStorage.setItem(classLocationFilterKey, nextFilter);
                const nextLocationId = nextFilter === "all" ? branches[0]?.locationId ?? "" : nextFilter;
                setForm((current) => ({ ...current, locationId: nextLocationId, classNames: [], selectedClassName: "" }));
              }}
            >
              <option value="all">All branches</option>
              {branches.map((branch) => <option key={branch.locationId} value={branch.locationId}>{branch.label}</option>)}
            </select>
            <Button type="button" onClick={() => setModalOpen(true)}>
              <Plus className="size-4" />
              Add class
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-black text-[#72706c]">
              <Loader2 className="size-5 animate-spin text-cta" />
              Loading classes from Neon DB...
            </div>
          ) : message ? (
            <div className="p-6"><ClassesEmptyState title={message} onAdd={() => setModalOpen(true)} /></div>
          ) : filteredClasses.length ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="bg-pastel-blue">
                    <TH>Class name</TH>
                    <TH>Sections</TH>
                    <TH>Short description</TH>
                    <TH>Capacity</TH>
                    <TH>Branch</TH>
                    <TH>Teacher links</TH>
                    <TH>Add student</TH>
                    <TH>Action</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredClasses.map((schoolClass) => (
                    <TR key={schoolClass.id} className="hover:bg-canvas/70">
                      <TD>
                        <div className="flex items-center gap-3">
                          <span className="flex size-11 items-center justify-center rounded-[18px] bg-sun text-ink"><BookOpenCheck className="size-5" /></span>
                          <span className="font-black text-ink">{schoolClass.name}</span>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex max-w-72 flex-wrap gap-2">
                          {schoolClass.sections.split(",").map((section) => <Badge key={`${schoolClass.id}-${section.trim()}`} tone="purple">{section.trim()}</Badge>)}
                        </div>
                      </TD>
                      <TD className="max-w-lg text-[#72706c]">{schoolClass.description}</TD>
                      <TD><Badge tone="yellow">{schoolClass.capacity} seats</Badge></TD>
                      <TD><Badge tone="blue">{schoolClass.branchName}</Badge></TD>
                      <TD>
                        <Button asChild size="sm" variant={schoolClass.assignmentCount ? "secondary" : "dark"}>
                          <Link href={`/classes/${schoolClass.id}/teachers`}>
                            <Link2 className="size-4" />
                            {schoolClass.assignmentCount ? `${schoolClass.assignmentCount} linked` : "Link teacher"}
                          </Link>
                        </Button>
                      </TD>
                      <TD>
                        <Button asChild size="sm" variant="purple">
                          <Link href={`/students?classId=${schoolClass.id}&mode=add`}>
                            <UsersRound className="size-4" />
                            Students
                          </Link>
                        </Button>
                      </TD>
                      <TD>
                        <Button asChild size="sm" variant="dark"><Link href={`/classes/${schoolClass.id}`}>View</Link></Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : (
            <div className="p-6"><ClassesEmptyState title="No classes found" onAdd={() => setModalOpen(true)} /></div>
          )}
        </Card>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm">
          <form onSubmit={createClass} className="w-full max-w-3xl rounded-card bg-white p-5 ring-4 ring-sun/70">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Badge tone="yellow">Branch offering</Badge>
                <h2 className="mt-3 text-2xl font-black text-ink">Create classes</h2>
                <p className="mt-1 text-sm leading-6 text-[#72706c]">Pick the branch, choose class templates, add sections, then link teachers from the class row.</p>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setModalOpen(false)} aria-label="Close form"><X className="size-5" /></Button>
            </div>

            <div className="flex flex-col gap-4">
              <Field label="School / branch location" error={errors.locationId}>
                <select className="h-11 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold outline-none transition focus:border-cta focus:ring-4 focus:ring-cta/10" value={form.locationId} onChange={(event) => {
                  updateForm("locationId", event.target.value);
                  setForm((current) => ({ ...current, locationId: event.target.value, classNames: [], selectedClassName: "" }));
                }}>
                  <option value="">Select school or branch</option>
                  {branches.map((branch) => <option key={branch.locationId} value={branch.locationId}>{branch.label}</option>)}
                </select>
                {selectedBranch ? <span className="text-xs font-bold text-[#72706c]">Allowed classes for {selectedBranch.name}: {selectedBranch.classFrom} to {selectedBranch.classTo}</span> : null}
              </Field>

              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Classes to create" error={errors.classNames}>
                  <div className="flex gap-2">
                    <select className="h-11 min-w-0 flex-1 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none" value={form.selectedClassName} onChange={(event) => updateForm("selectedClassName", event.target.value)}>
                      <option value="">Select class</option>
                      {availableClassOptions.map((option) => <option key={option} value={option} disabled={form.classNames.includes(option)}>{option}</option>)}
                    </select>
                    <Button type="button" variant="dark" onClick={() => addFormValue("classNames", form.selectedClassName)}>Add</Button>
                  </div>
                  <div className="mt-3 flex min-h-9 flex-wrap gap-2">
                    {form.classNames.map((item) => <button key={item} type="button" onClick={() => removeFormValue("classNames", item)} className="rounded-pill bg-cta px-3 py-2 text-xs font-black text-white">{item} x</button>)}
                  </div>
                </Field>

                <Field label="Sections" error={errors.sections}>
                  <div className="flex gap-2">
                    <select className="h-11 min-w-0 flex-1 rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none" value={form.selectedSection} onChange={(event) => updateForm("selectedSection", event.target.value)}>
                      {sectionOptionsBase.map((option) => <option key={option} value={option} disabled={form.sections.includes(option)}>Section {option}</option>)}
                    </select>
                    <Button type="button" variant="purple" onClick={() => addFormValue("sections", form.selectedSection)}>Add</Button>
                  </div>
                  <div className="mt-3 flex min-h-9 flex-wrap gap-2">
                    {form.sections.map((item) => <button key={item} type="button" onClick={() => removeFormValue("sections", item)} className="rounded-pill bg-grape px-3 py-2 text-xs font-black text-white">Section {item} x</button>)}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input value={form.customSection} onChange={(event) => updateForm("customSection", event.target.value)} placeholder="Custom section" />
                    <Button type="button" variant="dark" onClick={addCustomSection}>Add</Button>
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Capacity" error={errors.capacity}>
                  <Input min={1} max={300} type="number" value={form.capacity} onChange={(event) => updateForm("capacity", event.target.value)} placeholder="Example: 40" />
                </Field>
              </div>

              <Field label="Short description" error={errors.description}>
                <textarea className="min-h-28 rounded-[22px] border border-ink/10 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-cta focus:ring-4 focus:ring-cta/10" value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Example: Middle school class with STEM focus and weekly activity periods." />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{saving ? "Creating..." : "Create classes"}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-black uppercase text-[#72706c]">{label}</span>
      {children}
      {error ? <span className="text-xs font-black text-cta">{error}</span> : null}
    </label>
  );
}

function ClassesEmptyState({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="rounded-card bg-white p-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-pastel-blue">
        <BookOpenCheck className="size-7 text-ink" />
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#72706c]">Create branch class offerings and connect teachers by subject and period.</p>
      <Button type="button" className="mt-5" onClick={onAdd}><Plus className="size-4" />Add class</Button>
    </div>
  );
}
