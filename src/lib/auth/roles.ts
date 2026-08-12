import type { Role } from "@/types";

export const dbToAppRole = {
  BOSS: "boss",
  SUPERADMIN: "superadmin",
  BRANCH_ADMIN: "branch_admin",
  BRANCH_ACCOUNT_ADMIN: "branch_account_admin",
  ADMIN: "admin",
  TEACHER: "teacher",
  PARENT: "parent",
  STUDENT: "student",
  ACCOUNTANT: "accountant",
  STAFF: "staff"
} as const satisfies Record<string, Role>;

export const appToDbRole = {
  boss: "BOSS",
  superadmin: "SUPERADMIN",
  branch_admin: "BRANCH_ADMIN",
  branch_account_admin: "BRANCH_ACCOUNT_ADMIN",
  admin: "ADMIN",
  teacher: "TEACHER",
  parent: "PARENT",
  student: "STUDENT",
  accountant: "ACCOUNTANT",
  staff: "STAFF"
} as const satisfies Record<Role, string>;

export type DbRoleName = keyof typeof dbToAppRole;

export function roleHomePath(role: Role) {
  return `/dashboard/${role.replace(/_/g, "-")}`;
}

export function roleLabel(role: Role) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export const userManagedRoles = ["superadmin", "branch_admin", "branch_account_admin", "staff"] as const satisfies Role[];

export function allowedCreateRoles(role: Role) {
  if (role === "boss") return ["superadmin", "branch_admin", "branch_account_admin", "staff"] as Role[];
  if (role === "superadmin") return ["branch_admin", "branch_account_admin", "staff"] as Role[];
  if (role === "admin" || role === "branch_admin") return ["branch_account_admin", "staff"] as Role[];
  return [] as Role[];
}

export function isOrgAdminRole(role: Role) {
  return role === "boss" || role === "superadmin" || role === "admin";
}

export function isBranchAdminRole(role: Role) {
  return role === "branch_admin" || role === "branch_account_admin" || role === "staff";
}
