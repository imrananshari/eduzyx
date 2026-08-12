import {
  Banknote,
  Bell,
  Bot,
  CalendarDays,
  Hash,
  ClipboardCheck,
  CreditCard,
  FileBarChart,
  GraduationCap,
  Home,
  Image,
  Megaphone,
  NotebookPen,
  School,
  Settings,
  ShieldCheck,
  Users,
  UserRoundCheck,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/types";

export const roleHome: Record<Role, string> = {
  boss: "/dashboard/boss",
  superadmin: "/dashboard/superadmin",
  branch_admin: "/dashboard/branch-admin",
  branch_account_admin: "/dashboard/branch-account-admin",
  admin: "/dashboard/admin",
  teacher: "/dashboard/teacher",
  parent: "/dashboard/parent",
  student: "/dashboard/student",
  accountant: "/dashboard/accountant",
  staff: "/dashboard/staff"
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

export const navItems: NavItem[] = [
  { href: "/dashboard/boss", label: "Dashboard", icon: Home, roles: ["boss"] },
  { href: "/dashboard/superadmin", label: "Dashboard", icon: Home, roles: ["superadmin"] },
  { href: "/dashboard/branch-admin", label: "Dashboard", icon: Home, roles: ["branch_admin"] },
  { href: "/dashboard/branch-account-admin", label: "Dashboard", icon: Home, roles: ["branch_account_admin"] },
  { href: "/dashboard/admin", label: "Dashboard", icon: Home, roles: ["admin"] },
  { href: "/dashboard/teacher", label: "Dashboard", icon: Home, roles: ["teacher"] },
  { href: "/dashboard/parent", label: "Dashboard", icon: Home, roles: ["parent"] },
  { href: "/dashboard/student", label: "Dashboard", icon: Home, roles: ["student"] },
  { href: "/dashboard/accountant", label: "Dashboard", icon: Home, roles: ["accountant"] },
  { href: "/dashboard/staff", label: "Dashboard", icon: Home, roles: ["staff"] },
  { href: "/users", label: "Users", icon: ShieldCheck, roles: ["boss", "superadmin", "admin", "branch_admin"] },
  { href: "/school-profile", label: "School Profile", icon: School, roles: ["boss", "superadmin", "admin"] },
  { href: "/code-settings", label: "Code Settings", icon: Hash, roles: ["boss", "superadmin", "admin", "branch_admin"] },
  { href: "/teachers", label: "Teachers", icon: UserRoundCheck, roles: ["boss", "superadmin", "admin", "branch_admin"] },
  { href: "/students", label: "Students", icon: Users, roles: ["boss", "superadmin", "admin", "branch_admin", "teacher", "parent", "student"] },
  { href: "/classes", label: "Classes", icon: School, roles: ["boss", "superadmin", "admin", "branch_admin", "teacher"] },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck, roles: ["boss", "superadmin", "admin", "branch_admin", "teacher", "parent", "student", "staff"] },
  { href: "/homework", label: "Homework", icon: NotebookPen, roles: ["admin", "branch_admin", "teacher", "parent", "student"] },
  { href: "/timetable", label: "Timetable", icon: CalendarDays, roles: ["boss", "superadmin", "admin", "branch_admin", "teacher", "parent", "student", "staff"] },
  { href: "/exams", label: "Exams", icon: GraduationCap, roles: ["boss", "superadmin", "admin", "branch_admin", "teacher", "parent", "student"] },
  { href: "/results", label: "Results", icon: FileBarChart, roles: ["boss", "superadmin", "admin", "branch_admin", "teacher", "parent", "student"] },
  { href: "/fees", label: "Fees", icon: Banknote, roles: ["boss", "superadmin", "admin", "branch_admin", "branch_account_admin", "parent", "accountant"] },
  { href: "/payments", label: "Payments", icon: CreditCard, roles: ["boss", "superadmin", "admin", "branch_admin", "branch_account_admin", "parent", "accountant"] },
  { href: "/notices", label: "Notices", icon: Megaphone, roles: ["boss", "superadmin", "admin", "branch_admin", "teacher", "parent", "student", "staff"] },
  { href: "/reports", label: "Reports", icon: FileBarChart, roles: ["boss", "superadmin", "admin", "branch_admin", "branch_account_admin", "teacher", "accountant"] },
  { href: "/whatsapp-automation", label: "WhatsApp", icon: Bell, roles: ["boss", "superadmin", "admin", "branch_admin"] },
  { href: "/ai-assistant", label: "AI", icon: Bot, roles: ["boss", "superadmin", "admin", "branch_admin", "teacher"] },
  { href: "/media", label: "Media", icon: Image, roles: ["admin", "branch_admin", "teacher", "staff"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["boss", "superadmin", "admin", "branch_admin", "branch_account_admin", "teacher", "parent", "student", "accountant", "staff"] },
  { href: "/fees", label: "Receipts", icon: WalletCards, roles: ["branch_account_admin", "accountant"] }
] ;

export function itemsForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role));
}
