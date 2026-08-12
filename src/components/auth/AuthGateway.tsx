"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ImageUp, Lock, Mail, Sparkles, UserRound } from "lucide-react";
import { roleHome } from "@/data/navigation";
import { roleFromEmail, writeStoredProfile } from "@/lib/auth/profile";
import type { Role } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function messageFromError(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function AuthGateway() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const initialStatus = searchParams.get("status");
  const initialEmail = searchParams.get("email") ?? "";
  const initialError = searchParams.get("error");
  const [mode, setMode] = React.useState<"login" | "signup">(initialMode);
  const [loginMethod, setLoginMethod] = React.useState<"password" | "otp">("password");
  const [step, setStep] = React.useState<"form" | "verifySignup" | "verifyLogin" | "forgotPassword" | "resetPassword">("form");
  const [fullName, setFullName] = React.useState("");
  const role: Role = "admin";
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [resetOtpVerified, setResetOtpVerified] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState("");
  const [message, setMessage] = React.useState(
    initialError === "invalid-login"
      ? "Invalid email or password."
      : initialError === "missing-login"
        ? "Email and password are required."
        : initialError === "login-server"
          ? "Password login failed on the server. Please try again."
          : ""
  );
  const [successMessage, setSuccessMessage] = React.useState(
    initialStatus === "logged-out"
      ? "Logout successful"
      : initialStatus === "teacher-ready"
        ? "Teacher account activated"
        : initialStatus === "parent-ready"
          ? "Parent account activated"
          : initialStatus === "user-ready"
            ? "Account activated"
            : ""
  );
  const [isPending, setIsPending] = React.useState(false);
  const [resetAction, setResetAction] = React.useState<"idle" | "send" | "verify" | "reset">("idle");

  async function uploadImage(file: File) {
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setMessage("Preview ready. Uploading image to ImageKit...");

    try {
      const authResponse = await fetch("/api/media/imagekit-auth");
      const authData = (await authResponse.json()) as {
        token?: string;
        expire?: number;
        signature?: string;
        publicKey?: string;
        error?: string;
      };

      if (!authResponse.ok || !authData.token || !authData.expire || !authData.signature || !authData.publicKey) {
        setMessage(authData.error ?? "ImageKit is not configured. Local preview will be used.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", authData.publicKey);
      formData.append("signature", authData.signature);
      formData.append("expire", String(authData.expire));
      formData.append("token", authData.token);
      formData.append("folder", "/edumanage/profiles");

      const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData
      });
      const uploadData = (await uploadResponse.json()) as { url?: string; error?: { message?: string }; message?: string };

      if (!uploadResponse.ok || !uploadData.url) {
        setMessage(uploadData.error?.message ?? uploadData.message ?? "ImageKit upload failed. Local preview will be used.");
        return;
      }

      setImagePreview(uploadData.url);
      setMessage("Image uploaded to ImageKit.");
    } catch {
      setMessage("ImageKit upload failed. Local preview will be used.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (mode === "login" && loginMethod === "password") {
      return;
    }
    event.preventDefault();
    setMessage("");
    setIsPending(true);

    try {
      if (mode === "login" && loginMethod === "otp") {
        setIsPending(false);
        await sendLoginOtp();
        return;
      }

      if (mode === "signup") {
        const response = await fetch("/api/custom-auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, password, role, image: imagePreview })
        });
        const data = (await response.json()) as { error?: string; message?: string };

        if (!response.ok) {
          setMessage(data.error ?? "Signup failed.");
          return;
        }

        writeStoredProfile({ email, fullName, role, image: imagePreview });
        setStep("verifySignup");
        setMessage(data.message ?? "OTP sent to your email by SMTP.");
        return;
      }

      const response = await fetch("/api/custom-auth/login-password", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = (await response.json()) as { error?: string; redirectTo?: string; role?: Role; user?: { name?: string; image?: string | null } };

      if (!response.ok) {
        setMessage(data.error ?? "Could not log in.");
        return;
      }

      if (data.role) {
        writeStoredProfile({
          email,
          fullName: data.user?.name ?? email.split("@")[0],
          role: data.role,
          image: data.user?.image ?? undefined
        });
      }

      setSuccessMessage("Login successful");
      window.setTimeout(() => router.replace(data.redirectTo ?? roleHome[roleFromEmail(email)]), 850);
    } catch (error) {
      setMessage(error instanceof TypeError ? "Login request could not reach the app server. Restart npm run dev, hard refresh the browser, then try again." : messageFromError(error));
    } finally {
      setIsPending(false);
    }
  }

  async function sendLoginOtp() {
    setMessage("");
    setIsPending(true);

    try {
      const response = await fetch("/api/custom-auth/send-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await response.json()) as { error?: string; message?: string; redirectTo?: string; role?: Role };

      if (!response.ok) {
        setMessage(data.error ?? "Could not send login OTP.");
        return;
      }

      setStep("verifyLogin");
      setMessage(data.message ?? "Login OTP sent by SMTP.");
    } catch (error) {
      setMessage(messageFromError(error));
    } finally {
      setIsPending(false);
    }
  }

  async function sendResetOtp() {
    if (resetAction !== "idle") return;
    setMessage("");
    setResetOtpVerified(false);
    setResetAction("send");

    try {
      const response = await fetch("/api/custom-auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Could not send reset OTP.");
        return;
      }

      setMessage(data.message ?? "Password reset OTP sent.");
    } catch (error) {
      setMessage(messageFromError(error));
    } finally {
      setResetAction("idle");
    }
  }

  async function verifyResetOtp() {
    if (resetAction !== "idle") return;
    setMessage("");
    setResetOtpVerified(false);
    setResetAction("verify");

    try {
      const response = await fetch("/api/custom-auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Invalid OTP.");
        return;
      }

      setResetOtpVerified(true);
      setMessage(data.message ?? "OTP verified. You can reset your password now.");
    } catch (error) {
      setMessage(messageFromError(error));
    } finally {
      setResetAction("idle");
    }
  }

  async function resetPassword() {
    if (resetAction !== "idle" || !resetOtpVerified) return;
    setMessage("");
    setResetAction("reset");

    try {
      const response = await fetch("/api/custom-auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password: newPassword })
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Could not reset password.");
        return;
      }

      setSuccessMessage("Password reset successful");
      setPassword("");
      setNewPassword("");
      setOtp("");
      setResetOtpVerified(false);
      window.setTimeout(() => {
        setStep("form");
        setMode("login");
        setLoginMethod("password");
      }, 850);
    } catch (error) {
      setMessage(messageFromError(error));
    } finally {
      setResetAction("idle");
    }
  }

  async function verifyOtp(purpose: "signup" | "login") {
    setMessage("");
    setIsPending(true);

    try {
      const response = await fetch("/api/custom-auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, purpose })
      });
      const data = (await response.json()) as { error?: string; message?: string; redirectTo?: string; role?: Role };

      if (!response.ok) {
        setMessage(data.error ?? "Invalid OTP.");
        return;
      }

      if (data.role) {
        writeStoredProfile({
          email,
          fullName: fullName || email.split("@")[0],
          role: data.role,
          image: imagePreview
        });
      }

      setSuccessMessage(purpose === "signup" ? "Signup verified successfully" : "Login verified successfully");
      window.setTimeout(() => router.replace(data.redirectTo ?? roleHome[purpose === "signup" ? role : roleFromEmail(email)]), 850);
    } catch (error) {
      setMessage(messageFromError(error));
    } finally {
      setIsPending(false);
    }
  }

  const isOtpStep = step === "verifySignup" || step === "verifyLogin" || step === "resetPassword";
  const isResetBusy = resetAction !== "idle";
  const previewInitials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
    <SuccessOverlay message={successMessage} onDone={() => setSuccessMessage("")} />
    <section className="grid w-full max-w-6xl overflow-hidden rounded-card bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="bg-ink p-7 text-white">
        <h1 className="text-4xl font-black leading-tight">
          {step === "forgotPassword" || step === "resetPassword" ? "Reset your EduManage password." : mode === "signup" ? "Create your school owner account." : "Welcome back to EduManage."}
        </h1>
  

        <div className="mt-8 rounded-[24px] bg-pastel-yellow p-5 text-ink">
          <div className="flex items-center gap-4">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Profile preview" className="size-20 rounded-[24px] object-cover" />
            ) : (
              <Avatar className="size-20 rounded-[24px] bg-white text-2xl">{previewInitials || "EM"}</Avatar>
            )}
            <div>
              <p className="text-sm font-black">{fullName || "Your profile"}</p>
              <p className="mt-1 text-xs font-bold capitalize text-[#5f5b55]">{mode === "signup" ? "owner setup" : "secure login"}</p>
            </div>
          </div>
       
        </div>
      </aside>

      <div className="p-5 sm:p-8">
        <div className="mb-5 flex w-fit gap-2 rounded-pill bg-canvas p-1">
          <button type="button" onClick={() => { setMode("login"); setStep("form"); }} className={mode === "login" ? "rounded-pill bg-ink px-4 py-2 text-sm font-black text-white" : "rounded-pill px-4 py-2 text-sm font-black text-[#72706c]"}>
            Login
          </button>
          <button type="button" onClick={() => { setMode("signup"); setStep("form"); }} className={mode === "signup" ? "rounded-pill bg-ink px-4 py-2 text-sm font-black text-white" : "rounded-pill px-4 py-2 text-sm font-black text-[#72706c]"}>
            Sign up
          </button>
        </div>

        {isOtpStep ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-black">{step === "verifySignup" ? "Verify signup OTP" : step === "verifyLogin" ? "Verify login OTP" : "Reset password"}</h2>
              <p className="mt-2 text-sm leading-6 text-[#72706c]">Enter the OTP sent by Gmail SMTP to {email}.</p>
            </div>
            <Input className="border border-ink/10 bg-white" required inputMode="numeric" placeholder="6-digit OTP" value={otp} onChange={(event) => setOtp(event.target.value)} />
            {step === "resetPassword" ? (
              <>
                <FieldLabel>New password</FieldLabel>
                <IconInput icon={<Lock className="size-4 text-[#72706c]" />}>
                  <Input className="border-0 bg-transparent px-0" required minLength={8} type="password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setResetOtpVerified(false); }} placeholder="New password" />
                </IconInput>
              </>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={isPending} onClick={() => step === "resetPassword" ? void resetPassword() : verifyOtp(step === "verifySignup" ? "signup" : "login")}>
                {isPending ? "Checking..." : step === "resetPassword" ? "Reset password" : "Verify OTP"}
              </Button>
              {step === "verifyLogin" ? (
                <Button type="button" variant="secondary" disabled={isPending} onClick={sendLoginOtp}>
                  Resend OTP
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={() => setStep(step === "resetPassword" ? "forgotPassword" : "form")}>Back</Button>
            </div>
            <AuthMessage message={message} />
          </div>
        ) : step === "forgotPassword" ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-black">Reset password</h2>
              <p className="mt-2 text-sm leading-6 text-[#72706c]">Enter your email, set a new password, get OTP, then reset in one place.</p>
            </div>
            <FieldLabel>Email</FieldLabel>
            <IconInput icon={<Mail className="size-4 text-[#72706c]" />}>
              <Input className="border-0 bg-transparent px-0" required type="email" value={email} onChange={(event) => { setEmail(event.target.value); setResetOtpVerified(false); }} placeholder="you@gmail.com" />
            </IconInput>

            <FieldLabel>New password</FieldLabel>
            <IconInput icon={<Lock className="size-4 text-[#72706c]" />}>
              <Input className="border-0 bg-transparent px-0" required minLength={8} type="password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setResetOtpVerified(false); }} placeholder="New password" />
            </IconInput>

            <FieldLabel>OTP</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="border border-ink/10 bg-white sm:flex-1"
                required
                inputMode="numeric"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value);
                  setResetOtpVerified(false);
                }}
              />
              <Button type="button" variant="secondary" disabled={!email || isResetBusy} onClick={sendResetOtp}>
                {resetAction === "send" ? "Sending..." : "Get OTP"}
              </Button>
              <Button type="button" variant="dark" disabled={!email || !otp || isResetBusy} onClick={verifyResetOtp}>
                {resetAction === "verify" ? "Checking..." : "Verify OTP"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={!resetOtpVerified || !email || !newPassword || isResetBusy} onClick={resetPassword}>
                {resetAction === "reset" ? "Resetting..." : "Reset password"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")}>Back to login</Button>
            </div>
            <AuthMessage message={message} />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            action={mode === "login" && loginMethod === "password" ? "/api/custom-auth/login-password-form" : undefined}
            method={mode === "login" && loginMethod === "password" ? "post" : undefined}
            className="flex flex-col gap-3"
          >
            {mode === "login" ? (
              <div className="mb-1 flex w-fit gap-2 rounded-pill bg-canvas p-1">
                <button
                  type="button"
                  onClick={() => setLoginMethod("password")}
                  className={loginMethod === "password" ? "rounded-pill bg-sun px-4 py-2 text-xs font-black text-ink" : "rounded-pill px-4 py-2 text-xs font-black text-[#72706c]"}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("otp")}
                  className={loginMethod === "otp" ? "rounded-pill bg-sun px-4 py-2 text-xs font-black text-ink" : "rounded-pill px-4 py-2 text-xs font-black text-[#72706c]"}
                >
                  Email OTP
                </button>
              </div>
            ) : null}

            {mode === "signup" ? (
              <>
                <FieldLabel>Full name</FieldLabel>
                <IconInput icon={<UserRound className="size-4 text-[#72706c]" />}>
                  <Input className="border-0 bg-transparent px-0" required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
                </IconInput>

                <FieldLabel>Profile image</FieldLabel>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[22px] border border-ink/10 bg-white p-4">
                  <span className="flex items-center gap-3 text-sm font-bold text-[#72706c]">
                    <ImageUp className="size-5" />
                    {imagePreview ? "Change profile image" : "Upload profile image"}
                  </span>
                  <Badge tone="blue">Live preview</Badge>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage(file);
                    }}
                  />
                </label>
              </>
            ) : null}

            <FieldLabel>Email</FieldLabel>
            <IconInput icon={<Mail className="size-4 text-[#72706c]" />}>
              <Input className="border-0 bg-transparent px-0" required type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@gmail.com" />
            </IconInput>

            {mode === "signup" || loginMethod === "password" ? (
              <>
                <FieldLabel>Password</FieldLabel>
                <IconInput icon={<Lock className="size-4 text-[#72706c]" />}>
                  <Input className="border-0 bg-transparent px-0" required={mode === "signup" || loginMethod === "password"} minLength={8} type="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" />
                </IconInput>
                {mode === "login" ? (
                  <button type="button" className="w-fit text-xs font-black text-cta hover:underline" onClick={() => setStep("forgotPassword")}>
                    Forgot password?
                  </button>
                ) : null}
              </>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-2">
              {mode === "signup" || loginMethod === "password" ? (
              <Button disabled={isPending}>
                <Sparkles className="size-4" />
                {isPending ? "Please wait..." : mode === "signup" ? "Create account" : "Login"}
              </Button>
              ) : null}
              {mode === "login" && loginMethod === "otp" ? (
                <Button type="button" variant="secondary" disabled={!email || isPending} onClick={sendLoginOtp}>
                  {isPending ? "Sending..." : "Send OTP"}
                </Button>
              ) : null}
            </div>

            <AuthMessage message={message} />
          </form>
        )}
      </div>
    </section>
    </>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-black uppercase text-[#72706c]">{children}</label>;
}

function IconInput({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 rounded-pill border border-ink/10 bg-white px-4">{icon}{children}</div>;
}

function AuthMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="flex items-start gap-2 rounded-[18px] bg-pastel-blue px-4 py-3 text-sm font-bold leading-6 text-ink">
      <CheckCircle2 className="mt-1 size-4 shrink-0 text-cta" />
      {message}
    </p>
  );
}

function SuccessOverlay({ message, onDone }: { message: string; onDone: () => void }) {
  React.useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, 1400);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/30 backdrop-blur-sm">
      <div className="animate-pulse rounded-card bg-white p-8 text-center ring-4 ring-sun">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-sun text-ink">
          <CheckCircle2 className="size-9" />
        </div>
        <p className="mt-4 text-xl font-black">{message}</p>
      </div>
    </div>
  );
}

export function AuthLinks() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild><Link href="/login">Login</Link></Button>
      <Button asChild variant="secondary"><Link href="/login?mode=signup">Sign up</Link></Button>
    </div>
  );
}
