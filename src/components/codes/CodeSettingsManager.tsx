"use client";

import * as React from "react";
import { CheckCircle2, Hash, Loader2, Pencil, Plus, RefreshCcw, RotateCcw, Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cachedJson, invalidateApiCache } from "@/lib/client/apiCache";
import type { Role } from "@/types";

type CodeSetting = {
  id: string;
  entityType: string;
  label: string;
  prefix: string;
  pattern: string;
  nextNumber: number;
  padding: number;
  resetCycle: string;
  status: string;
  branchId: string | null;
  branchName: string | null;
  scopeLabel: string;
  preview: string;
};

type Branch = {
  locationId: string;
  locationType: "school" | "branch";
  branchId: string | null;
  label: string;
};

const defaultForm = {
  id: "",
  entityType: "student",
  label: "Student Code",
  prefix: "STU",
  pattern: "{PREFIX}-{SCHOOL}-{YEAR}-{SEQ4}",
  nextNumber: "1",
  padding: "4",
  resetCycle: "yearly",
  status: "active",
  branchId: ""
};

const labelMap: Record<string, string> = {
  student: "Student Code",
  teacher: "Teacher Employee Code",
  parent: "Parent Code",
  staff: "Staff Code",
  class: "Class Code",
  section: "Section Code",
  fee: "Fee Invoice",
  payment: "Payment Number",
  receipt: "Receipt Number",
  exam: "Exam Code",
  result: "Report Card Number",
  homework: "Assignment Code",
  notice: "Notice Code",
  document: "Document Number",
  branch: "Branch Code"
};

const prefixMap: Record<string, string> = {
  student: "STU",
  teacher: "TCH",
  parent: "PAR",
  staff: "STF",
  class: "CLS",
  section: "SEC",
  fee: "FEE",
  payment: "PAY",
  receipt: "RCT",
  exam: "EXM",
  result: "RPT",
  homework: "HW",
  notice: "NTC",
  document: "DOC",
  branch: "BR"
};

export function CodeSettingsManager({ role = "admin" }: { role?: Role }) {
  const [settings, setSettings] = React.useState<CodeSetting[]>([]);
  const [entityTypes, setEntityTypes] = React.useState<string[]>([]);
  const [resetCycles, setResetCycles] = React.useState<string[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [query, setQuery] = React.useState("");
  const [entityFilter, setEntityFilter] = React.useState("all");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState(defaultForm);
  const [message, setMessage] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await cachedJson<{ settings?: CodeSetting[]; entityTypes?: string[]; resetCycles?: string[] }>("/api/code-settings", { force: true, ttlMs: 1_000 });
      setSettings(data.settings ?? []);
      setEntityTypes(data.entityTypes ?? []);
      setResetCycles(data.resetCycles ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load code settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSettings();
    cachedJson<{ branches?: Branch[] }>("/api/branches?includeSchool=true", { ttlMs: 60_000 })
      .then((data) => setBranches((data.branches ?? []).filter((item) => item.locationType === "branch")))
      .catch(() => setBranches([]));
  }, [loadSettings]);

  const localPreview = React.useMemo(() => {
    const now = new Date();
    const number = Number(form.nextNumber) || 1;
    const padding = Number(form.padding) || 4;
    const seq = String(number).padStart(padding, "0");
    return form.pattern
      .toUpperCase()
      .replace(/\{PREFIX\}/g, form.prefix.toUpperCase() || "GEN")
      .replace(/\{SCHOOL\}/g, "SCH")
      .replace(/\{BRANCH\}/g, form.branchId ? "BR" : "ORG")
      .replace(/\{YEAR\}/g, String(now.getFullYear()))
      .replace(/\{YY\}/g, String(now.getFullYear()).slice(-2))
      .replace(/\{MONTH\}/g, String(now.getMonth() + 1).padStart(2, "0"))
      .replace(/\{DAY\}/g, String(now.getDate()).padStart(2, "0"))
      .replace(/\{CLASS\}/g, "CLS")
      .replace(/\{SECTION\}/g, "A")
      .replace(/\{TYPE\}/g, "DOC")
      .replace(/\{SEQ(\d+)\}/g, (_match, size: string) => String(number).padStart(Number(size), "0"))
      .replace(/\{SEQ\}/g, seq);
  }, [form]);

  const filtered = React.useMemo(() => {
    const clean = query.toLowerCase().trim();
    return settings.filter((setting) => {
      const matchesEntity = entityFilter === "all" || setting.entityType === entityFilter;
      const matchesQuery = !clean || [setting.label, setting.entityType, setting.pattern, setting.prefix, setting.scopeLabel, setting.preview].join(" ").toLowerCase().includes(clean);
      return matchesEntity && matchesQuery;
    });
  }, [settings, query, entityFilter]);

  function update(key: keyof typeof defaultForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function syncEntity(entityType: string) {
    setForm((current) => ({
      ...current,
      entityType,
      label: labelMap[entityType] ?? current.label,
      prefix: prefixMap[entityType] ?? current.prefix
    }));
  }

  function openCreate() {
    setForm(defaultForm);
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(setting: CodeSetting) {
    setForm({
      id: setting.id,
      entityType: setting.entityType,
      label: setting.label,
      prefix: setting.prefix,
      pattern: setting.pattern,
      nextNumber: String(setting.nextNumber),
      padding: String(setting.padding),
      resetCycle: setting.resetCycle,
      status: setting.status,
      branchId: setting.branchId ?? ""
    });
    setMessage("");
    setModalOpen(true);
  }

  async function saveSetting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setSuccess("");
    try {
      const response = await fetch(form.id ? `/api/code-settings/${form.id}` : "/api/code-settings", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not save code setting.");
        return;
      }
      setSuccess(data.message ?? "Code setting saved.");
      setModalOpen(false);
      invalidateApiCache("/api/code-settings");
      await loadSettings();
      window.setTimeout(() => setSuccess(""), 2200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save code setting.");
    } finally {
      setSaving(false);
    }
  }

  async function resetSetting(setting: CodeSetting) {
    const value = window.prompt(`Reset ${setting.label} next number to:`, "1");
    if (!value) return;
    const response = await fetch(`/api/code-settings/${setting.id}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextNumber: value })
    });
    const data = await response.json() as { error?: string; message?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Could not reset sequence.");
      return;
    }
    setSuccess(data.message ?? "Sequence reset.");
    invalidateApiCache("/api/code-settings");
    await loadSettings();
    window.setTimeout(() => setSuccess(""), 2200);
  }

  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Code Settings" description="Control automatic IDs, receipt numbers, employee codes, report numbers, and document references from one place." />
        {success ? (
          <div className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 animate-pulse items-center gap-3 rounded-pill bg-ink px-5 py-3 text-sm font-black text-white ring-4 ring-sun">
            <CheckCircle2 className="size-5 text-sun" />
            {success}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-4">
          <Metric label="Templates" value={settings.length} tone="yellow" />
          <Metric label="Active" value={settings.filter((item) => item.status === "active").length} tone="blue" />
          <Metric label="Branch scoped" value={settings.filter((item) => item.branchId).length} tone="purple" />
          <Metric label="Entity types" value={entityTypes.length} tone="orange" />
        </div>

        <Card className="bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-h-12 flex-1 items-center rounded-pill bg-canvas px-4 ring-1 ring-ink/5">
              <Search className="size-4 text-[#72706c]" />
              <Input className="border-0 bg-transparent" placeholder="Search codes, patterns, previews..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <select className="input-like h-12 lg:w-56" value={entityFilter} onChange={(event) => setEntityFilter(event.target.value)}>
              <option value="all">All entities</option>
              {entityTypes.map((item) => <option key={item} value={item}>{labelMap[item] ?? item}</option>)}
            </select>
            <Button type="button" onClick={openCreate}>
              <Plus className="size-4" />
              Add template
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-black text-[#72706c]">
              <Loader2 className="size-5 animate-spin text-cta" />
              Loading code settings...
            </div>
          ) : message ? (
            <EmptyState title={message} />
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="bg-pastel-blue">
                    <TH>Template</TH>
                    <TH>Scope</TH>
                    <TH>Pattern</TH>
                    <TH>Next Preview</TH>
                    <TH>Reset</TH>
                    <TH>Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {filtered.map((setting) => (
                    <TR key={setting.id} className="hover:bg-canvas/70">
                      <TD>
                        <div className="flex items-center gap-3">
                          <span className="flex size-11 items-center justify-center rounded-[18px] bg-sun"><Hash className="size-5" /></span>
                          <div>
                            <p className="font-black text-ink">{setting.label}</p>
                            <p className="text-xs font-bold uppercase text-[#72706c]">{setting.entityType}</p>
                          </div>
                        </div>
                      </TD>
                      <TD><Badge tone={setting.branchId ? "purple" : "blue"}>{setting.scopeLabel}</Badge></TD>
                      <TD><code className="rounded-pill bg-canvas px-3 py-2 text-xs font-black text-ink">{setting.pattern}</code></TD>
                      <TD>
                        <p className="text-sm font-black text-ink">{setting.preview}</p>
                        <p className="text-xs font-bold text-[#72706c]">Next number: {setting.nextNumber}</p>
                      </TD>
                      <TD><Badge tone={setting.status === "active" ? "orange" : "white"}>{setting.resetCycle}</Badge></TD>
                      <TD>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(setting)}><Pencil className="size-4" /> Edit</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => void resetSetting(setting)}><RotateCcw className="size-4" /> Reset</Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : (
            <EmptyState title="No code settings yet" />
          )}
        </Card>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm">
          <form onSubmit={saveSetting} className="w-full max-w-3xl rounded-card bg-white p-5 ring-4 ring-sun/70">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Badge tone="yellow">{form.id ? "Edit template" : "New template"}</Badge>
                <h2 className="mt-3 text-2xl font-black text-ink">{form.id ? "Update code template" : "Create code template"}</h2>
                <p className="mt-1 text-sm leading-6 text-[#72706c]">Use tokens like {"{PREFIX}"}, {"{SCHOOL}"}, {"{YEAR}"}, {"{MONTH}"}, and {"{SEQ4}"}.</p>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setModalOpen(false)} aria-label="Close form"><X className="size-5" /></Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Entity type">
                <select className="input-like" disabled={Boolean(form.id)} value={form.entityType} onChange={(event) => syncEntity(event.target.value)}>
                  {entityTypes.map((item) => <option key={item} value={item}>{labelMap[item] ?? item}</option>)}
                </select>
              </Field>
              <Field label="Scope">
                <select className="input-like" disabled={Boolean(form.id)} value={form.branchId} onChange={(event) => update("branchId", event.target.value)}>
                  <option value="">Organization / Main campus</option>
                  {branches.map((branch) => <option key={branch.branchId || branch.locationId} value={branch.branchId || ""}>{branch.label}</option>)}
                </select>
              </Field>
              <Field label="Label"><Input required value={form.label} onChange={(event) => update("label", event.target.value)} placeholder="Student Code" /></Field>
              <Field label="Prefix"><Input required value={form.prefix} onChange={(event) => update("prefix", event.target.value.toUpperCase())} placeholder="STU" /></Field>
              <Field label="Pattern"><Input required value={form.pattern} onChange={(event) => update("pattern", event.target.value.toUpperCase())} placeholder="{PREFIX}-{SCHOOL}-{YEAR}-{SEQ4}" /></Field>
              <Field label="Reset cycle">
                <select className="input-like" value={form.resetCycle} onChange={(event) => update("resetCycle", event.target.value)}>
                  {resetCycles.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
                </select>
              </Field>
              <Field label="Next number"><Input required type="number" min={1} value={form.nextNumber} onChange={(event) => update("nextNumber", event.target.value)} /></Field>
              <Field label="Padding"><Input required type="number" min={1} max={10} value={form.padding} onChange={(event) => update("padding", event.target.value)} /></Field>
              <Field label="Status">
                <select className="input-like" value={form.status} onChange={(event) => update("status", event.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <div className="rounded-[22px] bg-pastel-purple p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#72706c]"><RefreshCcw className="size-4" /> Live preview</div>
                <p className="mt-3 break-all text-xl font-black text-ink">{localPreview}</p>
              </div>
            </div>

            {message ? <p className="mt-4 rounded-[18px] bg-pastel-yellow px-4 py-3 text-sm font-black text-ink">{message}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Save template</Button>
            </div>
          </form>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "yellow" | "blue" | "purple" | "orange" }) {
  const bg = tone === "yellow" ? "bg-pastel-yellow" : tone === "blue" ? "bg-pastel-blue" : tone === "purple" ? "bg-pastel-purple" : "bg-cta text-white";
  return <Card className={`${bg} p-5`}><p className="text-xs font-black uppercase opacity-70">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2"><span className="text-xs font-black uppercase text-[#72706c]">{label}</span>{children}</label>;
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-pastel-yellow"><Hash className="size-7" /></div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#72706c]">Create templates for students, teachers, parents, receipts, reports, documents, and more.</p>
    </div>
  );
}
