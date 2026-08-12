"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ImageUp, Loader2, MapPin, Settings2, ShieldCheck, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { classLevels, classOptionsForRange } from "@/lib/constants/classLevels";
import { cn } from "@/lib/utils";

type FormState = {
  schoolName: string;
  schoolCode: string;
  schoolType: string;
  board: string;
  academicYearStart: string;
  academicYearEnd: string;
  timezone: string;
  currency: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolWhatsapp: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  logoUrl: string;
  coverImageUrl: string;
  principalName: string;
  registrationNumber: string;
  taxNumber: string;
  hasBranch: boolean;
  branchNameSameAsSchool: boolean;
  branchContactSameAsSchool: boolean;
  branchAddressSameAsSchool: boolean;
  branchHeadSameAsSchool: boolean;
  branchName: string;
  branchCode: string;
  branchType: string;
  branchEmail: string;
  branchPhone: string;
  branchWhatsapp: string;
  branchAddressLine1: string;
  branchAddressLine2: string;
  branchCity: string;
  branchState: string;
  branchCountry: string;
  branchPostalCode: string;
  branchHeadName: string;
  academicYear: string;
  attendanceMode: string;
  feeCycle: string;
  studentIdPrefix: string;
  receiptPrefix: string;
  defaultClassCapacity: string;
  schoolClassFrom: string;
  schoolClassTo: string;
  branchClassFrom: string;
  branchClassTo: string;
  workingDays: string;
  timetableStart: string;
  timetableEnd: string;
  parentPortalEnabled: boolean;
  studentPortalEnabled: boolean;
  whatsappEnabled: boolean;
  paymentsEnabled: boolean;
};

const initialForm: FormState = {
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
  hasBranch: false,
  branchNameSameAsSchool: true,
  branchContactSameAsSchool: true,
  branchAddressSameAsSchool: true,
  branchHeadSameAsSchool: true,
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
  defaultClassCapacity: "40",
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

const steps = [
  { title: "School", icon: Building2, fields: ["schoolName", "schoolCode", "schoolEmail", "schoolPhone"] },
  { title: "Contact", icon: MapPin, fields: ["addressLine1", "city", "state", "country", "postalCode"] },
  { title: "Brand", icon: ImageUp, fields: ["principalName"] },
  { title: "Branch", icon: ShieldCheck, fields: ["branchCode"] },
  { title: "Settings", icon: Settings2, fields: ["defaultClassCapacity", "studentIdPrefix", "receiptPrefix", "schoolClassFrom", "schoolClassTo"] }
] as const;

export function SchoolOnboardingWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [message, setMessage] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState("");

  const currentStep = steps[stepIndex];

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function stepComplete(index: number) {
    if (steps[index].title === "Branch" && !form.hasBranch) return true;
    if (steps[index].title === "Branch") {
      const nameReady = form.branchNameSameAsSchool || Boolean(form.branchName.trim());
      const contactReady = form.branchContactSameAsSchool || (Boolean(form.branchEmail.trim()) && Boolean(form.branchPhone.trim()));
      const addressReady = form.branchAddressSameAsSchool || (
        Boolean(form.branchAddressLine1.trim()) &&
        Boolean(form.branchCity.trim()) &&
        Boolean(form.branchState.trim()) &&
        Boolean(form.branchCountry.trim()) &&
        Boolean(form.branchPostalCode.trim())
      );
      const headReady = form.branchHeadSameAsSchool || Boolean(form.branchHeadName.trim());
      return Boolean(form.branchCode.trim()) && nameReady && contactReady && addressReady && headReady && Boolean(form.branchClassFrom) && Boolean(form.branchClassTo);
    }
    return steps[index].fields.every((field) => {
      const value = form[field as keyof FormState];
      return typeof value === "boolean" ? value : Boolean(String(value).trim());
    });
  }

  function validateCurrentStep() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (currentStep.title === "Branch") {
      if (form.hasBranch) {
        if (!form.branchCode.trim()) nextErrors.branchCode = "Required field.";
        if (!form.branchNameSameAsSchool && !form.branchName.trim()) nextErrors.branchName = "Required field.";
        if (!form.branchContactSameAsSchool && !form.branchEmail.trim()) nextErrors.branchEmail = "Required field.";
        if (!form.branchContactSameAsSchool && !form.branchPhone.trim()) nextErrors.branchPhone = "Required field.";
        if (!form.branchAddressSameAsSchool && !form.branchAddressLine1.trim()) nextErrors.branchAddressLine1 = "Required field.";
        if (!form.branchAddressSameAsSchool && !form.branchCity.trim()) nextErrors.branchCity = "Required field.";
        if (!form.branchAddressSameAsSchool && !form.branchState.trim()) nextErrors.branchState = "Required field.";
        if (!form.branchAddressSameAsSchool && !form.branchCountry.trim()) nextErrors.branchCountry = "Required field.";
        if (!form.branchAddressSameAsSchool && !form.branchPostalCode.trim()) nextErrors.branchPostalCode = "Required field.";
        if (!form.branchHeadSameAsSchool && !form.branchHeadName.trim()) nextErrors.branchHeadName = "Required field.";
        if (!form.branchClassFrom) nextErrors.branchClassFrom = "Required field.";
        if (!form.branchClassTo) nextErrors.branchClassTo = "Required field.";
      }
    } else {
      currentStep.fields.forEach((field) => {
        const key = field as keyof FormState;
        const value = form[key];
        if (typeof value !== "boolean" && !String(value).trim()) {
          nextErrors[key] = "Required field.";
        }
      });
    }

    if (currentStep.title === "Settings") {
      const capacity = Number(form.defaultClassCapacity);
      if (!Number.isInteger(capacity) || capacity < 1) {
        nextErrors.defaultClassCapacity = "Use 1 or more.";
      }
      if (!form.schoolClassFrom) nextErrors.schoolClassFrom = "Required field.";
      if (!form.schoolClassTo) nextErrors.schoolClassTo = "Required field.";
    }

    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setStepIndex((value) => Math.min(value + 1, steps.length - 1));
  }

  async function submit() {
    if (!validateCurrentStep()) return;
    setSaving(true);
    setMessage("");
    setSuccess("");

    try {
      const response = await fetch("/api/school-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Could not create school profile.");
        return;
      }

      setSuccess(data.message ?? "School profile created successfully.");
      window.setTimeout(() => router.replace("/dashboard/admin"), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create school profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      {success ? (
        <div className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-3 rounded-pill bg-ink px-5 py-3 text-sm font-black text-white ring-4 ring-sun">
          <CheckCircle2 className="size-5 text-sun" />
          {success}
        </div>
      ) : null}

      <Card className="bg-ink p-5 text-white">
        <Badge tone="yellow">School setup</Badge>
        <h1 className="mt-4 text-3xl font-black">Set up your school profile</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
          Create the school workspace, add the main branch, and connect this admin account before onboarding classes, teachers, students, fees, and automation.
        </p>
      </Card>

      <Card className="p-5">
        <ConnectedStepper currentStep={stepIndex} stepComplete={stepComplete} onStepChange={setStepIndex} />

        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <Badge tone={stepIndex === 4 ? "purple" : "blue"}>{currentStep.title}</Badge>
            <h2 className="mt-3 text-2xl font-black text-ink">{stepTitles[stepIndex]}</h2>
          </div>
          <div className="flex items-center gap-2 rounded-pill bg-canvas px-4 py-2 text-xs font-black text-[#72706c]">
            <Clock3 className="size-4" />
            {stepIndex + 1} of {steps.length}
          </div>
        </div>

        {stepIndex === 0 ? <SchoolBasics form={form} errors={errors} update={update} /> : null}
        {stepIndex === 1 ? <SchoolContact form={form} errors={errors} update={update} /> : null}
        {stepIndex === 2 ? <SchoolBrand form={form} errors={errors} update={update} /> : null}
        {stepIndex === 3 ? <BranchSetup form={form} errors={errors} update={update} /> : null}
        {stepIndex === 4 ? <SchoolSettings form={form} errors={errors} update={update} /> : null}

        {message ? <p className="mt-5 rounded-[18px] bg-pastel-yellow px-4 py-3 text-sm font-black text-ink">{message}</p> : null}

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <Button type="button" variant="ghost" disabled={stepIndex === 0 || saving} onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          {stepIndex < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" disabled={saving} onClick={submit}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {saving ? "Creating..." : "Create school profile"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

const stepTitles = [
  "School identity",
  "Contact and address",
  "Branding and legal profile",
  "Main branch setup",
  "Operating preferences"
];

function SchoolBasics({ form, errors, update }: StepProps) {
  return (
    <Grid>
      <Field label="School name" error={errors.schoolName}><InputBox value={form.schoolName} onChange={(value) => update("schoolName", value)} placeholder="Sunrise International School" /></Field>
      <Field label="School code" error={errors.schoolCode}><InputBox value={form.schoolCode} onChange={(value) => update("schoolCode", value)} placeholder="SIS" /></Field>
      <Field label="School type"><SelectBox value={form.schoolType} onChange={(value) => update("schoolType", value)} options={["school", "preschool", "college", "coaching", "academy"]} /></Field>
      <Field label="Board / curriculum"><SelectBox value={form.board} onChange={(value) => update("board", value)} options={["CBSE", "ICSE", "State Board", "IB", "Cambridge", "Other"]} /></Field>
      <Field label="Academic year start"><InputBox value={form.academicYearStart} onChange={(value) => update("academicYearStart", value)} placeholder="April" /></Field>
      <Field label="Academic year end"><InputBox value={form.academicYearEnd} onChange={(value) => update("academicYearEnd", value)} placeholder="March" /></Field>
      <Field label="Timezone"><InputBox value={form.timezone} onChange={(value) => update("timezone", value)} placeholder="Asia/Kolkata" /></Field>
      <Field label="Currency"><InputBox value={form.currency} onChange={(value) => update("currency", value)} placeholder="INR" /></Field>
      <Field label="Official email" error={errors.schoolEmail}><InputBox type="email" value={form.schoolEmail} onChange={(value) => update("schoolEmail", value)} placeholder="admin@school.edu" /></Field>
      <Field label="Official phone" error={errors.schoolPhone}><InputBox value={form.schoolPhone} onChange={(value) => update("schoolPhone", value)} placeholder="+91 98765 43210" /></Field>
    </Grid>
  );
}

function SchoolContact({ form, errors, update }: StepProps) {
  return (
    <Grid>
      <Field label="WhatsApp number"><InputBox value={form.schoolWhatsapp} onChange={(value) => update("schoolWhatsapp", value)} placeholder="+91 98765 43210" /></Field>
      <Field label="Website"><InputBox value={form.website} onChange={(value) => update("website", value)} placeholder="https://school.edu" /></Field>
      <Field label="Address line 1" error={errors.addressLine1} wide><InputBox value={form.addressLine1} onChange={(value) => update("addressLine1", value)} placeholder="123 Learning Avenue" /></Field>
      <Field label="Address line 2" wide><InputBox value={form.addressLine2} onChange={(value) => update("addressLine2", value)} placeholder="Near City Library" /></Field>
      <Field label="City" error={errors.city}><InputBox value={form.city} onChange={(value) => update("city", value)} placeholder="Mumbai" /></Field>
      <Field label="State" error={errors.state}><InputBox value={form.state} onChange={(value) => update("state", value)} placeholder="Maharashtra" /></Field>
      <Field label="Country" error={errors.country}><InputBox value={form.country} onChange={(value) => update("country", value)} placeholder="India" /></Field>
      <Field label="Postal code" error={errors.postalCode}><InputBox value={form.postalCode} onChange={(value) => update("postalCode", value)} placeholder="400001" /></Field>
    </Grid>
  );
}

function SchoolBrand({ form, errors, update }: StepProps) {
  return (
    <Grid>
      <Field label="School logo">
        <ImageUploadBox
          label="Upload logo"
          value={form.logoUrl}
          onChange={(value) => update("logoUrl", value)}
          shape="square"
        />
      </Field>
      <Field label="Cover image">
        <ImageUploadBox
          label="Upload cover"
          value={form.coverImageUrl}
          onChange={(value) => update("coverImageUrl", value)}
          shape="wide"
        />
      </Field>
      <Field label="Principal / director" error={errors.principalName}><InputBox value={form.principalName} onChange={(value) => update("principalName", value)} placeholder="Dr. Asha Mehra" /></Field>
      <Field label="Registration number"><InputBox value={form.registrationNumber} onChange={(value) => update("registrationNumber", value)} placeholder="REG-2026-001" /></Field>
      <Field label="Tax / GST number"><InputBox value={form.taxNumber} onChange={(value) => update("taxNumber", value)} placeholder="GSTIN optional" /></Field>
      <Field label="Brand note" wide><TextareaBox value={`${form.schoolName || "Your school"} media will use ImageKit placeholders until upload routes are enabled.`} readOnly placeholder="Brand preview note" /></Field>
    </Grid>
  );
}

function BranchSetup({ form, errors, update }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[24px] border border-ink/10 bg-pastel-blue p-4">
        <Toggle
          label="This school has another branch / campus"
          checked={form.hasBranch}
          onChange={(value) => update("hasBranch", value)}
        />
        <p className="mt-3 text-sm font-bold leading-6 text-[#5f5b55]">
          If this is one campus only, EduManage will create the main branch using the school profile details.
        </p>
      </div>

      {form.hasBranch ? (
        <Grid>
          <Field label="Branch code" error={errors.branchCode}>
            <InputBox value={form.branchCode} onChange={(value) => update("branchCode", value)} placeholder="MAIN, EAST, NORTH" />
          </Field>
          <Field label="Branch type">
            <SelectBox value={form.branchType} onChange={(value) => update("branchType", value)} options={["branch", "franchise", "junior wing", "senior wing"]} />
          </Field>
          <ClassRangeFields
            from={form.branchClassFrom}
            to={form.branchClassTo}
            fromError={errors.branchClassFrom}
            toError={errors.branchClassTo}
            onFrom={(value) => {
              update("branchClassFrom", value);
              if (!classOptionsForRange(value, "Class 12").includes(form.branchClassTo)) update("branchClassTo", value);
            }}
            onTo={(value) => update("branchClassTo", value)}
          />

          <ToggleField label="Branch school name is same as school" checked={form.branchNameSameAsSchool} onChange={(value) => update("branchNameSameAsSchool", value)} />
          {!form.branchNameSameAsSchool ? (
            <Field label="Branch school name" error={errors.branchName}>
              <InputBox value={form.branchName} onChange={(value) => update("branchName", value)} placeholder="Sunrise International - East Campus" />
            </Field>
          ) : null}

          <ToggleField label="Branch contact is same as school" checked={form.branchContactSameAsSchool} onChange={(value) => update("branchContactSameAsSchool", value)} />
          {!form.branchContactSameAsSchool ? (
            <>
              <Field label="Branch email" error={errors.branchEmail}><InputBox type="email" value={form.branchEmail} onChange={(value) => update("branchEmail", value)} placeholder="east@school.edu" /></Field>
              <Field label="Branch phone" error={errors.branchPhone}><InputBox value={form.branchPhone} onChange={(value) => update("branchPhone", value)} placeholder="+91 98765 43210" /></Field>
              <Field label="Branch WhatsApp"><InputBox value={form.branchWhatsapp} onChange={(value) => update("branchWhatsapp", value)} placeholder="+91 98765 43210" /></Field>
            </>
          ) : null}

          <ToggleField label="Branch address is same as school" checked={form.branchAddressSameAsSchool} onChange={(value) => update("branchAddressSameAsSchool", value)} />
          {!form.branchAddressSameAsSchool ? (
            <>
              <Field label="Branch address line 1" error={errors.branchAddressLine1} wide><InputBox value={form.branchAddressLine1} onChange={(value) => update("branchAddressLine1", value)} placeholder="Branch campus address" /></Field>
              <Field label="Branch address line 2" wide><InputBox value={form.branchAddressLine2} onChange={(value) => update("branchAddressLine2", value)} placeholder="Landmark or area" /></Field>
              <Field label="Branch city" error={errors.branchCity}><InputBox value={form.branchCity} onChange={(value) => update("branchCity", value)} placeholder="Mumbai" /></Field>
              <Field label="Branch state" error={errors.branchState}><InputBox value={form.branchState} onChange={(value) => update("branchState", value)} placeholder="Maharashtra" /></Field>
              <Field label="Branch country" error={errors.branchCountry}><InputBox value={form.branchCountry} onChange={(value) => update("branchCountry", value)} placeholder="India" /></Field>
              <Field label="Branch postal code" error={errors.branchPostalCode}><InputBox value={form.branchPostalCode} onChange={(value) => update("branchPostalCode", value)} placeholder="400001" /></Field>
            </>
          ) : null}

          <ToggleField label="Branch head / principal is same as school" checked={form.branchHeadSameAsSchool} onChange={(value) => update("branchHeadSameAsSchool", value)} />
          {!form.branchHeadSameAsSchool ? (
            <Field label="Branch head / principal" error={errors.branchHeadName}>
              <InputBox value={form.branchHeadName} onChange={(value) => update("branchHeadName", value)} placeholder="Branch head name" />
            </Field>
          ) : null}
        </Grid>
      ) : null}
    </div>
  );
}

function SchoolSettings({ form, errors, update }: StepProps) {
  return (
    <Grid>
      <Field label="Academic year"><InputBox value={form.academicYear} onChange={(value) => update("academicYear", value)} placeholder="2026-2027" /></Field>
      <Field label="Attendance mode"><SelectBox value={form.attendanceMode} onChange={(value) => update("attendanceMode", value)} options={["daily", "period-wise"]} /></Field>
      <Field label="Fee cycle"><SelectBox value={form.feeCycle} onChange={(value) => update("feeCycle", value)} options={["monthly", "term", "yearly"]} /></Field>
      <Field label="Total enrollment capacity" error={errors.defaultClassCapacity}><InputBox min={1} type="number" value={form.defaultClassCapacity} onChange={(value) => update("defaultClassCapacity", value)} placeholder="Example: 1200" /></Field>
      <ClassRangeFields
        from={form.schoolClassFrom}
        to={form.schoolClassTo}
        fromError={errors.schoolClassFrom}
        toError={errors.schoolClassTo}
        onFrom={(value) => {
          update("schoolClassFrom", value);
          if (!classOptionsForRange(value, "Class 12").includes(form.schoolClassTo)) update("schoolClassTo", value);
          if (!form.hasBranch) {
            update("branchClassFrom", value);
            if (!classOptionsForRange(value, "Class 12").includes(form.branchClassTo)) update("branchClassTo", value);
          }
        }}
        onTo={(value) => {
          update("schoolClassTo", value);
          if (!form.hasBranch) update("branchClassTo", value);
        }}
      />
      <Field label="Student ID prefix" error={errors.studentIdPrefix}><InputBox value={form.studentIdPrefix} onChange={(value) => update("studentIdPrefix", value)} placeholder="STU" /></Field>
      <Field label="Receipt prefix" error={errors.receiptPrefix}><InputBox value={form.receiptPrefix} onChange={(value) => update("receiptPrefix", value)} placeholder="RCT" /></Field>
      <Field label="Working days" wide><InputBox value={form.workingDays} onChange={(value) => update("workingDays", value)} placeholder="Mon,Tue,Wed,Thu,Fri,Sat" /></Field>
      <Field label="Timetable start"><InputBox type="time" value={form.timetableStart} onChange={(value) => update("timetableStart", value)} placeholder="08:00" /></Field>
      <Field label="Timetable end"><InputBox type="time" value={form.timetableEnd} onChange={(value) => update("timetableEnd", value)} placeholder="15:00" /></Field>
      <Toggle label="Parent portal" checked={form.parentPortalEnabled} onChange={(value) => update("parentPortalEnabled", value)} />
      <Toggle label="Student portal" checked={form.studentPortalEnabled} onChange={(value) => update("studentPortalEnabled", value)} />
      <Toggle label="WhatsApp automation" checked={form.whatsappEnabled} onChange={(value) => update("whatsappEnabled", value)} />
      <Toggle label="Online payments" checked={form.paymentsEnabled} onChange={(value) => update("paymentsEnabled", value)} />
    </Grid>
  );
}

type StepProps = {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
};

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function ConnectedStepper({
  currentStep,
  stepComplete,
  onStepChange
}: {
  currentStep: number;
  stepComplete: (index: number) => boolean;
  onStepChange: (index: number) => void;
}) {
  return (
    <div className="mb-7 overflow-x-auto pb-2">
      <div className="relative grid min-w-[720px] grid-cols-5 gap-0">
        <div className="absolute left-[10%] right-[10%] top-5 h-1 rounded-pill bg-ink/10" />
        <div
          className="absolute left-[10%] top-5 h-1 rounded-pill bg-cta transition-all duration-300"
          style={{ width: `${Math.max(0, (currentStep / (steps.length - 1)) * 80)}%` }}
        />
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = index === currentStep;
          const complete = stepComplete(index);
          const reached = index <= currentStep || complete;
          return (
            <button
              key={step.title}
              type="button"
              onClick={() => onStepChange(index)}
              className="relative z-10 flex flex-col items-center gap-2 text-center"
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border border-ink/10 bg-white text-ink transition",
                  reached && "border-cta bg-pastel-yellow",
                  active && "bg-cta text-white ring-4 ring-cta/15",
                  complete && !active && "bg-sun"
                )}
              >
                {complete ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
              </span>
              <span className={cn("text-xs font-black text-[#72706c]", active && "text-ink")}>{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImageUploadBox({
  label,
  value,
  shape,
  onChange
}: {
  label: string;
  value: string;
  shape: "square" | "wide";
  onChange: (value: string) => void;
}) {
  function handleFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <label
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-ink/20 bg-white p-4 text-center transition hover:border-cta hover:bg-pastel-yellow/50",
        shape === "square" ? "min-h-44" : "min-h-44"
      )}
    >
      {value ? (
        <div
          className={cn("w-full rounded-[18px] bg-cover bg-center", shape === "square" ? "aspect-square max-w-40" : "aspect-video")}
          style={{ backgroundImage: `url(${value})` }}
        />
      ) : (
        <div className="flex flex-col items-center">
          <span className="flex size-12 items-center justify-center rounded-[18px] bg-pastel-blue text-ink transition group-hover:bg-cta group-hover:text-white">
            <Upload className="size-5" />
          </span>
          <span className="mt-3 text-sm font-black text-ink">{label}</span>
          <span className="mt-1 text-xs font-bold text-[#72706c]">PNG, JPG, or WEBP preview</span>
        </div>
      )}
      {value ? <span className="mt-3 text-xs font-black text-cta">Click to change image</span> : null}
      <input type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
    </label>
  );
}

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-2", wide && "md:col-span-2")}>
      <span className="text-xs font-black uppercase text-[#72706c]">{label}</span>
      {children}
      {error ? <span className="text-xs font-black text-cta">{error}</span> : null}
    </label>
  );
}

function InputBox({ value, onChange, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & { value: string; onChange?: (value: string) => void }) {
  return <Input className="border-ink/10 text-ink placeholder:text-[#8f8c86]" value={value} onChange={(event) => onChange?.(event.target.value)} {...props} />;
}

function TextareaBox({ value, onChange, ...props }: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & { value: string; onChange?: (value: string) => void }) {
  return <Textarea className="border-ink/10 text-ink placeholder:text-[#8f8c86]" value={value} onChange={(event) => onChange?.(event.target.value)} {...props} />;
}

function SelectBox({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select className="h-11 w-full rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none focus:border-ink/20" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function ClassRangeFields({
  from,
  to,
  fromError,
  toError,
  onFrom,
  onTo
}: {
  from: string;
  to: string;
  fromError?: string;
  toError?: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  const toOptions = classOptionsForRange(from, "Class 12");
  return (
    <>
      <Field label="Classes from" error={fromError}>
        <select className="h-11 w-full rounded-pill border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none focus:border-ink/20" value={from} onChange={(event) => onFrom(event.target.value)}>
          {classLevels.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </Field>
      <Field label="Classes to" error={toError}>
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

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="md:col-span-2">
      <Toggle label={label} checked={checked} onChange={onChange} />
    </div>
  );
}
