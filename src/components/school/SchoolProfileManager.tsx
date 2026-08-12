"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Edit3, Loader2, MapPin, Save, School, Settings2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cachedJson, getCachedApiData, invalidateApiCache } from "@/lib/client/apiCache";
import { classLevels, classOptionsForRange } from "@/lib/constants/classLevels";
import { cn } from "@/lib/utils";

type SchoolProfileResponse = {
  hasSchoolProfile: boolean;
  school: Record<string, string | number | boolean | null> | null;
  branch: Record<string, string | number | boolean | null> | null;
};

type FormState = Record<string, string | boolean>;

const defaults: FormState = {
  schoolName: "",
  schoolCode: "",
  schoolType: "school",
  board: "CBSE",
  academicYearStart: "April",
  academicYearEnd: "March",
  timezone: "Asia/Kolkata",
  currency: "INR",
  schoolEmail: "",
  schoolPhone: "",
  schoolWhatsapp: "",
  website: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  logoUrl: "",
  coverImageUrl: "",
  principalName: "",
  registrationNumber: "",
  taxNumber: "",
  branchName: "",
  branchCode: "",
  branchType: "branch",
  branchEmail: "",
  branchPhone: "",
  branchWhatsapp: "",
  branchAddressLine1: "",
  branchAddressLine2: "",
  branchCity: "",
  branchState: "",
  branchCountry: "India",
  branchPostalCode: "",
  branchHeadName: "",
  academicYear: "2026-2027",
  attendanceMode: "daily",
  feeCycle: "monthly",
  studentIdPrefix: "STU",
  receiptPrefix: "RCT",
  defaultClassCapacity: "1200",
  schoolClassFrom: "Nursery",
  schoolClassTo: "Class 12",
  branchClassFrom: "Nursery",
  branchClassTo: "Class 12",
  workingDays: "Mon,Tue,Wed,Thu,Fri,Sat",
  timetableStart: "08:00",
  timetableEnd: "15:00",
  parentPortalEnabled: true,
  studentPortalEnabled: true,
  whatsappEnabled: false,
  paymentsEnabled: false
};

export function SchoolProfileManager() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [profile, setProfile] = React.useState<SchoolProfileResponse | null>(null);
  const [form, setForm] = React.useState<FormState>(defaults);
  const [message, setMessage] = React.useState("");

  const loadProfile = React.useCallback(async () => {
    const cached = getCachedApiData<SchoolProfileResponse & { error?: string }>("/api/school-profile");
    if (cached) {
      setProfile(cached);
      if (cached.school && cached.branch) setForm(profileToForm(cached));
      setLoading(false);
    } else {
      setLoading(true);
    }
    setMessage("");
    try {
      const data = await cachedJson<SchoolProfileResponse & { error?: string }>("/api/school-profile", { ttlMs: 5 * 60_000 });
      setProfile(data);
      if (data.school && data.branch) setForm(profileToForm(data));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load school profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function update(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/school-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not update school profile.");
        return;
      }
      setMessage(data.message ?? "School profile updated successfully.");
      setEditing(false);
      invalidateApiCache("/api/school-profile");
      invalidateApiCache("/api/branches");
      await loadProfile();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update school profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm font-black text-[#72706c]">
        <Loader2 className="size-5 animate-spin text-cta" />
        Loading school profile...
      </div>
    );
  }

  if (!profile?.hasSchoolProfile) {
    return (
      <Card className="bg-pastel-yellow">
        <Badge tone="orange">Setup required</Badge>
        <CardTitle className="mt-4 text-3xl">No school profile linked yet</CardTitle>
        <CardDescription className="mt-2">Create your school profile first, then manage branch and school settings here.</CardDescription>
        <Button asChild className="mt-5"><Link href="/school-onboarding">Start setup</Link></Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? (
        <div className="flex items-center gap-3 rounded-pill bg-pastel-yellow px-5 py-3 text-sm font-black text-ink">
          <CheckCircle2 className="size-5 text-cta" />
          {message}
        </div>
      ) : null}

      <Card className="overflow-hidden bg-ink p-0 text-white">
        <div className="min-h-44 bg-pastel-blue bg-cover bg-center p-5" style={{ backgroundImage: stringValue(form.coverImageUrl) ? `url(${stringValue(form.coverImageUrl)})` : undefined }}>
          <Badge tone="yellow">School Profile</Badge>
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-[26px] bg-white text-2xl font-black text-ink">
              {stringValue(form.logoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={stringValue(form.logoUrl)} alt="School logo" className="size-full object-cover" />
              ) : (
                <School className="size-9" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black">{stringValue(form.schoolName)}</h1>
              <p className="mt-1 text-sm font-bold text-white/70">{stringValue(form.schoolCode)} - {stringValue(form.board)} - {stringValue(form.schoolType)}</p>
            </div>
          </div>
          <Button type="button" onClick={() => setEditing((value) => !value)}>
            <Edit3 className="size-4" />
            {editing ? "Close edit" : "Edit profile"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={Building2} label="School" value={stringValue(form.schoolName)} />
        <SummaryCard icon={MapPin} label="Location" value={`${stringValue(form.city)}, ${stringValue(form.state)}`} />
        <SummaryCard icon={School} label="Main branch" value={stringValue(form.branchName)} />
        <SummaryCard icon={Settings2} label="Class range" value={`${stringValue(form.branchClassFrom)} to ${stringValue(form.branchClassTo)}`} />
      </div>

      {editing ? (
        <form onSubmit={saveProfile} className="flex flex-col gap-5">
          <Section title="School details" tone="blue">
            <Grid>
              <Field label="School name"><InputBox value={stringValue(form.schoolName)} onChange={(value) => update("schoolName", value)} placeholder="School name" /></Field>
              <Field label="School code"><InputBox value={stringValue(form.schoolCode)} onChange={(value) => update("schoolCode", value)} placeholder="SIS" /></Field>
              <Field label="School type"><InputBox value={stringValue(form.schoolType)} onChange={(value) => update("schoolType", value)} placeholder="school" /></Field>
              <Field label="Board"><InputBox value={stringValue(form.board)} onChange={(value) => update("board", value)} placeholder="CBSE" /></Field>
              <Field label="Academic start"><InputBox value={stringValue(form.academicYearStart)} onChange={(value) => update("academicYearStart", value)} placeholder="April" /></Field>
              <Field label="Academic end"><InputBox value={stringValue(form.academicYearEnd)} onChange={(value) => update("academicYearEnd", value)} placeholder="March" /></Field>
              <Field label="Timezone"><InputBox value={stringValue(form.timezone)} onChange={(value) => update("timezone", value)} placeholder="Asia/Kolkata" /></Field>
              <Field label="Currency"><InputBox value={stringValue(form.currency)} onChange={(value) => update("currency", value)} placeholder="INR" /></Field>
              <ClassRangeFields
                from={stringValue(form.schoolClassFrom)}
                to={stringValue(form.schoolClassTo)}
                onFrom={(value) => {
                  update("schoolClassFrom", value);
                  if (!classOptionsForRange(value, "Class 12").includes(stringValue(form.schoolClassTo))) update("schoolClassTo", value);
                }}
                onTo={(value) => update("schoolClassTo", value)}
              />
            </Grid>
          </Section>

          <Section title="Contact and address" tone="yellow">
            <Grid>
              <Field label="Email"><InputBox type="email" value={stringValue(form.schoolEmail)} onChange={(value) => update("schoolEmail", value)} placeholder="admin@school.edu" /></Field>
              <Field label="Phone"><InputBox value={stringValue(form.schoolPhone)} onChange={(value) => update("schoolPhone", value)} placeholder="+91 98765 43210" /></Field>
              <Field label="WhatsApp"><InputBox value={stringValue(form.schoolWhatsapp)} onChange={(value) => update("schoolWhatsapp", value)} placeholder="+91 98765 43210" /></Field>
              <Field label="Website"><InputBox value={stringValue(form.website)} onChange={(value) => update("website", value)} placeholder="https://school.edu" /></Field>
              <Field label="Address line 1" wide><InputBox value={stringValue(form.addressLine1)} onChange={(value) => update("addressLine1", value)} placeholder="Address line 1" /></Field>
              <Field label="Address line 2" wide><InputBox value={stringValue(form.addressLine2)} onChange={(value) => update("addressLine2", value)} placeholder="Address line 2" /></Field>
              <Field label="City"><InputBox value={stringValue(form.city)} onChange={(value) => update("city", value)} placeholder="City" /></Field>
              <Field label="State"><InputBox value={stringValue(form.state)} onChange={(value) => update("state", value)} placeholder="State" /></Field>
              <Field label="Country"><InputBox value={stringValue(form.country)} onChange={(value) => update("country", value)} placeholder="Country" /></Field>
              <Field label="Postal code"><InputBox value={stringValue(form.postalCode)} onChange={(value) => update("postalCode", value)} placeholder="Postal code" /></Field>
            </Grid>
          </Section>

          <Section title="Brand and legal" tone="purple">
            <Grid>
              <Field label="School logo"><ImageUploadBox label="Upload logo" value={stringValue(form.logoUrl)} onChange={(value) => update("logoUrl", value)} shape="square" /></Field>
              <Field label="Cover image"><ImageUploadBox label="Upload cover" value={stringValue(form.coverImageUrl)} onChange={(value) => update("coverImageUrl", value)} shape="wide" /></Field>
              <Field label="Principal / director"><InputBox value={stringValue(form.principalName)} onChange={(value) => update("principalName", value)} placeholder="Principal name" /></Field>
              <Field label="Registration number"><InputBox value={stringValue(form.registrationNumber)} onChange={(value) => update("registrationNumber", value)} placeholder="REG-2026-001" /></Field>
              <Field label="Tax / GST number"><InputBox value={stringValue(form.taxNumber)} onChange={(value) => update("taxNumber", value)} placeholder="GST optional" /></Field>
            </Grid>
          </Section>

          <Section title="Linked branch" tone="blue">
            <Grid>
              <Field label="Branch name"><InputBox value={stringValue(form.branchName)} onChange={(value) => update("branchName", value)} placeholder="Branch name" /></Field>
              <Field label="Branch code"><InputBox value={stringValue(form.branchCode)} onChange={(value) => update("branchCode", value)} placeholder="MAIN" /></Field>
              <Field label="Branch type"><InputBox value={stringValue(form.branchType)} onChange={(value) => update("branchType", value)} placeholder="branch" /></Field>
              <Field label="Branch head"><InputBox value={stringValue(form.branchHeadName)} onChange={(value) => update("branchHeadName", value)} placeholder="Branch head" /></Field>
              <Field label="Branch email"><InputBox type="email" value={stringValue(form.branchEmail)} onChange={(value) => update("branchEmail", value)} placeholder="branch@school.edu" /></Field>
              <Field label="Branch phone"><InputBox value={stringValue(form.branchPhone)} onChange={(value) => update("branchPhone", value)} placeholder="+91 98765 43210" /></Field>
              <Field label="Branch WhatsApp"><InputBox value={stringValue(form.branchWhatsapp)} onChange={(value) => update("branchWhatsapp", value)} placeholder="+91 98765 43210" /></Field>
              <Field label="Branch address" wide><InputBox value={stringValue(form.branchAddressLine1)} onChange={(value) => update("branchAddressLine1", value)} placeholder="Branch address" /></Field>
              <Field label="Branch address line 2" wide><InputBox value={stringValue(form.branchAddressLine2)} onChange={(value) => update("branchAddressLine2", value)} placeholder="Landmark" /></Field>
              <Field label="Branch city"><InputBox value={stringValue(form.branchCity)} onChange={(value) => update("branchCity", value)} placeholder="City" /></Field>
              <Field label="Branch state"><InputBox value={stringValue(form.branchState)} onChange={(value) => update("branchState", value)} placeholder="State" /></Field>
              <Field label="Branch country"><InputBox value={stringValue(form.branchCountry)} onChange={(value) => update("branchCountry", value)} placeholder="Country" /></Field>
              <Field label="Branch postal code"><InputBox value={stringValue(form.branchPostalCode)} onChange={(value) => update("branchPostalCode", value)} placeholder="Postal code" /></Field>
              <ClassRangeFields
                from={stringValue(form.branchClassFrom)}
                to={stringValue(form.branchClassTo)}
                onFrom={(value) => {
                  update("branchClassFrom", value);
                  if (!classOptionsForRange(value, "Class 12").includes(stringValue(form.branchClassTo))) update("branchClassTo", value);
                }}
                onTo={(value) => update("branchClassTo", value)}
              />
            </Grid>
          </Section>

          <Section title="Settings" tone="yellow">
            <Grid>
              <Field label="Academic year"><InputBox value={stringValue(form.academicYear)} onChange={(value) => update("academicYear", value)} placeholder="2026-2027" /></Field>
              <Field label="Attendance mode"><InputBox value={stringValue(form.attendanceMode)} onChange={(value) => update("attendanceMode", value)} placeholder="daily" /></Field>
              <Field label="Fee cycle"><InputBox value={stringValue(form.feeCycle)} onChange={(value) => update("feeCycle", value)} placeholder="monthly" /></Field>
              <Field label="Total capacity"><InputBox min={1} type="number" value={stringValue(form.defaultClassCapacity)} onChange={(value) => update("defaultClassCapacity", value)} placeholder="1200" /></Field>
              <Field label="Student prefix"><InputBox value={stringValue(form.studentIdPrefix)} onChange={(value) => update("studentIdPrefix", value)} placeholder="STU" /></Field>
              <Field label="Receipt prefix"><InputBox value={stringValue(form.receiptPrefix)} onChange={(value) => update("receiptPrefix", value)} placeholder="RCT" /></Field>
              <Field label="Working days" wide><InputBox value={stringValue(form.workingDays)} onChange={(value) => update("workingDays", value)} placeholder="Mon,Tue,Wed,Thu,Fri,Sat" /></Field>
              <Field label="Timetable start"><InputBox type="time" value={stringValue(form.timetableStart)} onChange={(value) => update("timetableStart", value)} placeholder="08:00" /></Field>
              <Field label="Timetable end"><InputBox type="time" value={stringValue(form.timetableEnd)} onChange={(value) => update("timetableEnd", value)} placeholder="15:00" /></Field>
              <Toggle label="Parent portal" checked={boolValue(form.parentPortalEnabled)} onChange={(value) => update("parentPortalEnabled", value)} />
              <Toggle label="Student portal" checked={boolValue(form.studentPortalEnabled)} onChange={(value) => update("studentPortalEnabled", value)} />
              <Toggle label="WhatsApp" checked={boolValue(form.whatsappEnabled)} onChange={(value) => update("whatsappEnabled", value)} />
              <Toggle label="Payments" checked={boolValue(form.paymentsEnabled)} onChange={(value) => update("paymentsEnabled", value)} />
            </Grid>
          </Section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setEditing(false); if (profile) setForm(profileToForm(profile)); }}>Cancel</Button>
            <Button disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <InfoPanel title="School details" icon={Building2} rows={[
            ["Email", stringValue(form.schoolEmail)],
            ["Phone", stringValue(form.schoolPhone)],
            ["Address", `${stringValue(form.addressLine1)}, ${stringValue(form.city)}, ${stringValue(form.state)}`],
            ["Principal", stringValue(form.principalName) || "Not added"],
            ["Classes", `${stringValue(form.schoolClassFrom)} to ${stringValue(form.schoolClassTo)}`],
            ["Registration", stringValue(form.registrationNumber) || "Not added"]
          ]} />
          <InfoPanel title="Linked branch" icon={School} rows={[
            ["Branch", stringValue(form.branchName)],
            ["Code", stringValue(form.branchCode)],
            ["Head", stringValue(form.branchHeadName) || "Not added"],
            ["Classes", `${stringValue(form.branchClassFrom)} to ${stringValue(form.branchClassTo)}`],
            ["Contact", `${stringValue(form.branchEmail)} - ${stringValue(form.branchPhone)}`],
            ["Address", `${stringValue(form.branchAddressLine1)}, ${stringValue(form.branchCity)}`]
          ]} />
        </div>
      )}
    </div>
  );
}

function profileToForm(data: SchoolProfileResponse): FormState {
  const school = data.school ?? {};
  const branch = data.branch ?? {};
  return {
    ...defaults,
    schoolName: stringValue(school.name),
    schoolCode: stringValue(school.code),
    schoolType: stringValue(school.type),
    board: stringValue(school.board),
    academicYearStart: stringValue(school.academicYearStart),
    academicYearEnd: stringValue(school.academicYearEnd),
    timezone: stringValue(school.timezone),
    currency: stringValue(school.currency),
    schoolEmail: stringValue(school.email),
    schoolPhone: stringValue(school.phone),
    schoolWhatsapp: stringValue(school.whatsappPhone),
    website: stringValue(school.website),
    addressLine1: stringValue(school.addressLine1),
    addressLine2: stringValue(school.addressLine2),
    city: stringValue(school.city),
    state: stringValue(school.state),
    country: stringValue(school.country),
    postalCode: stringValue(school.postalCode),
    logoUrl: stringValue(school.logoUrl),
    coverImageUrl: stringValue(school.coverImageUrl),
    principalName: stringValue(school.principalName),
    registrationNumber: stringValue(school.registrationNumber),
    taxNumber: stringValue(school.taxNumber),
    attendanceMode: stringValue(school.attendanceMode),
    feeCycle: stringValue(school.feeCycle),
    studentIdPrefix: stringValue(school.studentIdPrefix),
    receiptPrefix: stringValue(school.receiptPrefix),
    defaultClassCapacity: stringValue(school.defaultClassCapacity),
    schoolClassFrom: stringValue(school.classFrom) || "Nursery",
    schoolClassTo: stringValue(school.classTo) || "Class 12",
    parentPortalEnabled: boolValue(school.parentPortalEnabled),
    studentPortalEnabled: boolValue(school.studentPortalEnabled),
    whatsappEnabled: boolValue(school.whatsappEnabled),
    paymentsEnabled: boolValue(school.paymentsEnabled),
    branchName: stringValue(branch.name),
    branchCode: stringValue(branch.code),
    branchType: stringValue(branch.type),
    branchEmail: stringValue(branch.email),
    branchPhone: stringValue(branch.phone),
    branchWhatsapp: stringValue(branch.whatsappPhone),
    branchAddressLine1: stringValue(branch.addressLine1),
    branchAddressLine2: stringValue(branch.addressLine2),
    branchCity: stringValue(branch.city),
    branchState: stringValue(branch.state),
    branchCountry: stringValue(branch.country),
    branchPostalCode: stringValue(branch.postalCode),
    branchHeadName: stringValue(branch.branchHeadName),
    branchClassFrom: stringValue(branch.classFrom) || stringValue(school.classFrom) || "Nursery",
    branchClassTo: stringValue(branch.classTo) || stringValue(school.classTo) || "Class 12",
    academicYear: stringValue(branch.academicYear),
    workingDays: stringValue(branch.workingDays),
    timetableStart: stringValue(branch.timetableStart),
    timetableEnd: stringValue(branch.timetableEnd)
  };
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <Card className="bg-pastel-blue">
      <Icon className="size-5 text-ink" />
      <p className="mt-4 text-xs font-black uppercase text-[#72706c]">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-ink">{value}</p>
    </Card>
  );
}

function InfoPanel({ title, icon: Icon, rows }: { title: string; icon: typeof Building2; rows: [string, string][] }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-[18px] bg-sun text-ink"><Icon className="size-5" /></span>
        <CardTitle>{title}</CardTitle>
      </div>
      <div className="mt-5 divide-y divide-ink/10">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 text-sm">
            <span className="font-black text-[#72706c]">{label}</span>
            <span className="max-w-[65%] text-right font-bold text-ink">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Section({ title, tone, children }: { title: string; tone: "blue" | "yellow" | "purple"; children: React.ReactNode }) {
  const toneClass = tone === "blue" ? "bg-pastel-blue" : tone === "yellow" ? "bg-pastel-yellow" : "bg-pastel-purple";
  return (
    <Card className={toneClass}>
      <CardTitle>{title}</CardTitle>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-2", wide && "md:col-span-2")}>
      <span className="text-xs font-black uppercase text-[#72706c]">{label}</span>
      {children}
    </label>
  );
}

function InputBox({ value, onChange, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & { value: string; onChange: (value: string) => void }) {
  return <Input className="border-ink/10 text-ink placeholder:text-[#8f8c86]" value={value} onChange={(event) => onChange(event.target.value)} {...props} />;
}

function ImageUploadBox({ label, value, shape, onChange }: { label: string; value: string; shape: "square" | "wide"; onChange: (value: string) => void }) {
  function handleFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }
  return (
    <label className="group flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-ink/20 bg-white p-4 text-center transition hover:border-cta">
      {value ? (
        <div className={cn("w-full rounded-[18px] bg-cover bg-center", shape === "square" ? "aspect-square max-w-40" : "aspect-video")} style={{ backgroundImage: `url(${value})` }} />
      ) : (
        <>
          <span className="flex size-12 items-center justify-center rounded-[18px] bg-pastel-blue text-ink"><Upload className="size-5" /></span>
          <span className="mt-3 text-sm font-black text-ink">{label}</span>
        </>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
    </label>
  );
}

function ClassRangeFields({ from, to, onFrom, onTo }: { from: string; to: string; onFrom: (value: string) => void; onTo: (value: string) => void }) {
  const toOptions = classOptionsForRange(from, "Class 12");
  return (
    <>
      <Field label="Classes from">
        <select className="h-11 w-full rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none focus:border-ink/20" value={from} onChange={(event) => onFrom(event.target.value)}>
          {classLevels.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </Field>
      <Field label="Classes to">
        <select className="h-11 w-full rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none focus:border-ink/20" value={to} onChange={(event) => onTo(event.target.value)}>
          {classLevels.map((option) => <option key={option} value={option} disabled={!toOptions.includes(option)}>{option}</option>)}
        </select>
      </Field>
    </>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-[22px] border border-ink/10 bg-white px-4 py-3">
      <span className="text-sm font-black text-ink">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function stringValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function boolValue(value: unknown) {
  return value === true;
}
