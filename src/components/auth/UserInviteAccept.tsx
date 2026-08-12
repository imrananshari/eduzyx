"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function UserInviteAccept() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [roleLabel, setRoleLabel] = React.useState("User");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    fetch(`/api/user-invite?token=${encodeURIComponent(token)}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }: { ok: boolean; data: { email?: string; name?: string; roleLabel?: string; error?: string } }) => {
        if (!alive) return;
        if (!ok) setMessage(data.error ?? "Invite is invalid.");
        else {
          setEmail(data.email ?? "");
          setName(data.name ?? "");
          setRoleLabel(data.roleLabel ?? "User");
        }
      })
      .catch(() => {
        if (alive) setMessage("Could not verify invite.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  async function sendOtp() {
    setSendingOtp(true);
    setMessage("");
    try {
      const response = await fetch("/api/user-invite/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = (await response.json()) as { error?: string; message?: string };
      setMessage(response.ok ? data.message ?? "OTP sent." : data.error ?? "Could not send OTP.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function activate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password !== confirmPassword) {
      setMessage("Password and confirm password do not match.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/user-invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, otp })
      });
      const data = (await response.json()) as { error?: string; message?: string; email?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not activate account.");
        return;
      }
      setMessage(data.message ?? "Account activated.");
      window.setTimeout(() => router.replace(`/login?email=${encodeURIComponent(data.email ?? email)}&status=user-ready`), 900);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="grid w-full max-w-5xl overflow-hidden p-0 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="bg-ink p-7 text-white">
        <div className="flex size-14 items-center justify-center rounded-[20px] bg-sun text-ink">
          <ShieldCheck className="size-7" />
        </div>
        <h1 className="mt-5 text-4xl font-black leading-tight">Activate your EduManage account.</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">Verify your email with OTP, set your password, then login to your dashboard.</p>
        {name ? <p className="mt-8 rounded-[22px] bg-pastel-yellow p-4 text-sm font-black text-ink">{name} - {roleLabel}</p> : null}
      </aside>
      <form onSubmit={activate} className="flex flex-col gap-4 p-6 sm:p-8">
        {loading ? (
          <div className="flex min-h-80 items-center justify-center gap-3 text-sm font-black text-[#72706c]">
            <Loader2 className="size-5 animate-spin text-cta" />
            Checking invite...
          </div>
        ) : (
          <>
            <Field label="Email">
              <IconInput icon={<Mail className="size-4 text-[#72706c]" />}>
                <Input className="border-0 bg-transparent px-0" readOnly value={email} placeholder="user@school.edu" />
              </IconInput>
            </Field>
            <Field label="Password">
              <IconInput icon={<Lock className="size-4 text-[#72706c]" />}>
                <Input className="border-0 bg-transparent px-0" minLength={8} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" />
              </IconInput>
            </Field>
            <Field label="Confirm password">
              <IconInput icon={<Lock className="size-4 text-[#72706c]" />}>
                <Input className="border-0 bg-transparent px-0" minLength={8} required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" />
              </IconInput>
            </Field>
            <Field label="Email OTP">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input className="border border-ink/10 bg-white sm:flex-1" required inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6-digit OTP" />
                <Button type="button" variant="secondary" disabled={!token || sendingOtp} onClick={sendOtp}>{sendingOtp ? "Sending..." : "Get OTP"}</Button>
              </div>
            </Field>
            {message ? <p className="flex items-start gap-2 rounded-[18px] bg-pastel-blue px-4 py-3 text-sm font-bold leading-6 text-ink"><CheckCircle2 className="mt-1 size-4 shrink-0 text-cta" />{message}</p> : null}
            <Button disabled={saving || !email || !token}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {saving ? "Activating..." : "Activate account"}
            </Button>
          </>
        )}
      </form>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2"><span className="text-xs font-black uppercase text-[#72706c]">{label}</span>{children}</label>;
}

function IconInput({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 rounded-pill border border-ink/10 bg-white px-4">{icon}{children}</div>;
}
