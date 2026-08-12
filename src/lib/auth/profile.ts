import type { Role } from "@/types";

export const eduProfileStorageKey = "edumanage.profile";

export type EduManageProfile = {
  fullName: string;
  role: Role;
  image?: string;
  email: string;
};

export function roleFromEmail(email?: string | null): Role {
  if (!email) return "admin";
  const stored = typeof window !== "undefined" ? readStoredProfile(email) : null;
  return stored?.role ?? "admin";
}

export function readStoredProfile(email?: string | null): EduManageProfile | null {
  if (typeof window === "undefined" || !email) return null;
  try {
    const value = window.localStorage.getItem(`${eduProfileStorageKey}:${email.toLowerCase()}`);
    return value ? (JSON.parse(value) as EduManageProfile) : null;
  } catch {
    return null;
  }
}

export function writeStoredProfile(profile: EduManageProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${eduProfileStorageKey}:${profile.email.toLowerCase()}`, JSON.stringify(profile));
}
