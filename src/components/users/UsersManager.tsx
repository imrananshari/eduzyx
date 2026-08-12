"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { CheckCircle2, ImageUp, Loader2, Mail, Plus, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cachedJson, invalidateApiCache } from "@/lib/client/apiCache";
import type { Role } from "@/types";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  imageUrl: string | null;
  phone: string | null;
  age: number | null;
  gender: string | null;
  status: string;
  branchId: string | null;
  branchName: string;
  loginStatus: string;
};

type RoleOption = {
  value: Role;
  label: string;
};

type Branch = {
  locationId: string;
  locationType: "school" | "branch";
  branchId: string | null;
  label: string;
  name: string;
};

const initialForm = {
  name: "",
  email: "",
  phone: "",
  age: "",
  gender: "",
  role: "" as Role | "",
  branchId: "",
  imageUrl: "",
  status: "active"
};

export function UsersManager({ role = "admin" }: { role?: Role }) {
  const [users, setUsers] = React.useState<ManagedUser[]>([]);
  const [allowedRoles, setAllowedRoles] = React.useState<RoleOption[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [setupRequired, setSetupRequired] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState(initialForm);
  const [message, setMessage] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await cachedJson<{ users?: ManagedUser[]; allowedRoles?: RoleOption[]; setupRequired?: boolean }>("/api/users", { ttlMs: 1_000, force: true });
      const nextAllowedRoles = data.allowedRoles ?? [];
      setUsers(data.users ?? []);
      setAllowedRoles(nextAllowedRoles);
      setSetupRequired(Boolean(data.setupRequired));
      setForm((current) => ({
        ...current,
        role: current.role && nextAllowedRoles.some((item) => item.value === current.role) ? current.role : nextAllowedRoles[0]?.value ?? ""
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadUsers();
    async function loadBranches() {
      try {
        const data = await cachedJson<{ branches?: Branch[] }>("/api/branches?includeSchool=true", { ttlMs: 5 * 60_000 });
        setBranches((data.branches ?? []).filter((item) => item.locationType === "branch"));
      } catch {
        setBranches([]);
      }
    }
    void loadBranches();
  }, [loadUsers]);

  const filtered = React.useMemo(() => {
    const clean = query.toLowerCase().trim();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesQuery = !clean || [user.name, user.email, user.roleLabel, user.branchName, user.phone].join(" ").toLowerCase().includes(clean);
      return matchesRole && matchesQuery;
    });
  }, [users, query, roleFilter]);

  function update(key: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleImage(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("imageUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setSuccess("");
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not create user.");
        return;
      }
      setSuccess(data.message ?? "User created. Invite email sent.");
      setModalOpen(false);
      setForm({ ...initialForm, role: allowedRoles[0]?.value ?? "" });
      invalidateApiCache("/api/users");
      await loadUsers();
      window.setTimeout(() => setSuccess(""), 2200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col gap-6">
        <PageHeader title="User Management" description="Create and invite Superadmins, Branch Admins, Branch Account Admins, and Staff with email OTP password setup." />
        {setupRequired ? (
          <Card className="bg-pastel-yellow p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge tone="dark">Setup mode</Badge>
                <h2 className="mt-3 text-xl font-black text-ink">School profile is not created yet</h2>
                <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-[#5f5b55]">
                  Boss can invite Superadmin now. Branch Admin, Accounts Admin, Staff, Teachers, Students, and Parents unlock after Boss or Superadmin creates the school profile.
                </p>
              </div>
              <Button asChild variant="dark"><a href="/school-onboarding">Setup school profile</a></Button>
            </div>
          </Card>
        ) : null}
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
              <Input className="border-0 bg-transparent" placeholder="Search users, role, branch, email..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <select className="h-12 rounded-pill border border-ink/10 bg-canvas px-4 text-sm font-black text-ink outline-none" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option>
              {allowedRoles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <Button type="button" onClick={() => setModalOpen(true)} disabled={!allowedRoles.length}>
              <Plus className="size-4" />
              Add user
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-black text-[#72706c]">
              <Loader2 className="size-5 animate-spin text-cta" />
              Loading users from Neon DB...
            </div>
          ) : message ? (
            <EmptyUsers title={message} />
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="bg-pastel-blue">
                    <TH>User</TH>
                    <TH>Role</TH>
                    <TH>Branch</TH>
                    <TH>Contact</TH>
                    <TH>Login</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {filtered.map((user) => (
                    <TR key={user.id} className="hover:bg-canvas/70">
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} imageUrl={user.imageUrl} />
                          <div>
                            <p className="font-black text-ink">{user.name}</p>
                            <p className="text-xs font-bold text-[#72706c]">{user.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD><Badge tone="purple">{user.roleLabel}</Badge></TD>
                      <TD><Badge tone="blue">{user.branchName}</Badge></TD>
                      <TD>
                        <p className="text-sm font-black text-ink">{user.phone || "No phone"}</p>
                        <p className="text-xs font-bold text-[#72706c]">{[user.gender, user.age ? `${user.age} yrs` : ""].filter(Boolean).join(" - ") || "Profile details pending"}</p>
                      </TD>
                      <TD><Badge tone={user.loginStatus === "Active login" ? "orange" : "yellow"}>{user.loginStatus}</Badge></TD>
                      <TD><Badge tone={user.status === "active" ? "dark" : "white"}>{user.status}</Badge></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : (
            <EmptyUsers title="No users found" />
          )}
        </Card>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm">
          <form onSubmit={createUser} className="w-full max-w-3xl rounded-card bg-white p-5 ring-4 ring-sun/70">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Badge tone="yellow">Invite user</Badge>
                <h2 className="mt-3 text-2xl font-black text-ink">Create user profile</h2>
                <p className="mt-1 text-sm leading-6 text-[#72706c]">The user gets an email link, verifies OTP, and sets their own password.</p>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setModalOpen(false)} aria-label="Close form"><X className="size-5" /></Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Full name" /></Field>
              <Field label="Email"><Input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="user@gmail.com" /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 98765 43210" /></Field>
              <Field label="Role">
                <select className="input-like" required value={form.role} onChange={(event) => update("role", event.target.value)}>
                  <option value="">Select role</option>
                  {allowedRoles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Branch">
                <select className="input-like" value={form.branchId} onChange={(event) => update("branchId", event.target.value)}>
                  <option value="">Organization level</option>
                  {branches.map((branch) => <option key={branch.branchId || branch.locationId} value={branch.branchId || ""}>{branch.label}</option>)}
                </select>
              </Field>
              <Field label="Age"><Input type="number" min={1} max={120} value={form.age} onChange={(event) => update("age", event.target.value)} placeholder="32" /></Field>
              <Field label="Gender">
                <select className="input-like" value={form.gender} onChange={(event) => update("gender", event.target.value)}>
                  <option value="">Select gender</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Status">
                <select className="input-like" value={form.status} onChange={(event) => update("status", event.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <Field label="Profile picture">
                <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-dashed border-ink/20 bg-canvas p-4">
                  <span className="flex size-11 items-center justify-center rounded-[18px] bg-sun text-ink"><ImageUp className="size-5" /></span>
                  <span className="text-sm font-black text-ink">{form.imageUrl ? "Preview ready" : "Upload preview"}</span>
                  <input className="hidden" type="file" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} />
                </label>
              </Field>
              {form.imageUrl ? <img src={form.imageUrl} alt="Profile preview" className="size-24 rounded-[24px] object-cover" /> : null}
            </div>

            {message ? <p className="mt-4 rounded-[18px] bg-pastel-yellow px-4 py-3 text-sm font-black text-ink">{message}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                {saving ? "Sending..." : "Create & invite"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </DashboardLayout>
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

function EmptyUsers({ title }: { title: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-pastel-blue">
        <ShieldCheck className="size-7 text-ink" />
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#72706c]">Create admin and staff users, then let them activate by email invite and OTP.</p>
    </div>
  );
}
