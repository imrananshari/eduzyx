import type { Role } from "@/types";
import { roleHome } from "@/data/navigation";

export const mockUsers = {
  boss: { name: "School Boss", role: "boss", avatar: "SB", home: roleHome.boss },
  superadmin: { name: "Org Superadmin", role: "superadmin", avatar: "OS", home: roleHome.superadmin },
  branch_admin: { name: "Branch Admin", role: "branch_admin", avatar: "BA", home: roleHome.branch_admin },
  branch_account_admin: { name: "Branch Accounts", role: "branch_account_admin", avatar: "BA", home: roleHome.branch_account_admin },
  admin: { name: "Anika Admin", role: "admin", avatar: "AA", home: roleHome.admin },
  teacher: { name: "Rhea Thomas", role: "teacher", avatar: "RT", home: roleHome.teacher },
  parent: { name: "Priya Sharma", role: "parent", avatar: "PS", home: roleHome.parent },
  student: { name: "Aarav Sharma", role: "student", avatar: "AS", home: roleHome.student },
  accountant: { name: "Dev Finance", role: "accountant", avatar: "DF", home: roleHome.accountant },
  staff: { name: "School Staff", role: "staff", avatar: "SS", home: roleHome.staff }
} satisfies Record<Role, { name: string; role: Role; avatar: string; home: string }>;

export function getMockUser(role: Role = "admin") {
  return mockUsers[role];
}
