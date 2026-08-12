import { Banknote, Bell, Bot, CalendarDays, ClipboardCheck, GraduationCap, NotebookPen, School, Users, WalletCards } from "lucide-react";
import { RightPanel } from "@/components/layout/RightPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { SchoolSetupBanner } from "@/components/dashboard/SchoolSetupBanner";
import { StatCard } from "@/components/cards/StatCard";
import { PastelModuleCard } from "@/components/cards/PastelModuleCard";
import { SimpleList } from "@/components/tables/Lists";
import { lessons, notices, payments } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";
import type { Role } from "@/types";

const copy: Record<Role, { title: string; description: string }> = {
  boss: { title: "Boss dashboard", description: "View every branch, approvals, organization users, high-level reports, and school-wide performance." },
  superadmin: { title: "Superadmin dashboard", description: "Manage school profile, branches, permissions, admin users, settings, and organization-wide operations." },
  branch_admin: { title: "Branch admin dashboard", description: "Run branch operations: teachers, classes, students, parents, attendance, exams, notices, and reports." },
  branch_account_admin: { title: "Branch account dashboard", description: "Monitor branch fee collection, payments, receipts, reminders, and finance reports." },
  admin: { title: "Admin dashboard", description: "Track school operations, alerts, fee status, attendance, exams, and AI/WhatsApp automation from one bold command center." },
  teacher: { title: "Teacher dashboard", description: "Manage assigned classes, today timetable, attendance, homework, marks, notices, and AI teaching shortcuts." },
  parent: { title: "Parent dashboard", description: "View child attendance, homework, fee status, results, notices, and WhatsApp alert preferences." },
  student: { title: "Student dashboard", description: "Check timetable, homework, attendance, results, notices, and study materials." },
  accountant: { title: "Accountant dashboard", description: "Monitor collections, pending fees, receipts, transaction history, and fee reports." },
  staff: { title: "Staff dashboard", description: "View assigned branch tasks, notices, timetable support, and permitted operational records." }
};

export function DashboardHome({ role }: { role: Role }) {
  const stats =
    role === "accountant" || role === "branch_account_admin"
      ? [
          { title: "Collection", value: formatCurrency(742000), description: "This month across 43 payments.", icon: WalletCards, tone: "yellow" as const, progress: 78 },
          { title: "Pending fees", value: formatCurrency(186000), description: "12 accounts need reminders.", icon: Banknote, tone: "blue" as const, progress: 42 },
          { title: "Receipts", value: "128", description: "Ready for PDF export placeholder.", icon: ClipboardCheck, tone: "purple" as const, progress: 64 }
        ]
      : [
          { title: role === "teacher" ? "Assigned classes" : "Students", value: role === "teacher" ? "5" : "1,284", description: "Active school records with role-ready access.", icon: Users, tone: "blue" as const, progress: 84 },
          { title: role === "student" ? "Homework" : "Attendance", value: role === "student" ? "6" : "92%", description: "Daily snapshot with history and alerts.", icon: ClipboardCheck, tone: "yellow" as const, progress: 92 },
          { title: role === "parent" ? "Pending fees" : "AI usage", value: role === "parent" ? formatCurrency(18500) : "24", description: "Gemini-ready helper actions this week.", icon: Bot, tone: "purple" as const, progress: 56 }
        ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={copy[role].title} description={copy[role].description} />
      {role === "admin" || role === "boss" || role === "superadmin" ? <SchoolSetupBanner /> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <section className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <PastelModuleCard title="Today timetable" description="Period blocks, teachers, subjects, and break display." href="/timetable" icon={CalendarDays} tone="blue" />
            <PastelModuleCard title="Homework hub" description="Create, submit, review, and attach ImageKit-ready media." href="/homework" icon={NotebookPen} tone="purple" cta="View homework" />
            <PastelModuleCard title="Fee payments" description="Stripe-ready fee collection, receipts, and reminders." href="/fees" icon={Banknote} tone="yellow" cta="Send reminder" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <SimpleList rows={lessons.map((lesson) => ({ title: lesson.title, subtitle: lesson.subtitle, owner: lesson.owner, meta: lesson.time }))} />
            <SimpleList rows={role === "accountant" || role === "branch_account_admin" ? payments.map((payment) => ({ title: payment.student, subtitle: payment.method, meta: formatCurrency(payment.amount), status: payment.status })) : notices.map((notice) => ({ title: notice.title, subtitle: notice.audience, meta: notice.date, status: notice.channel }))} statusTone="yellow" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <PastelModuleCard title="Exams & results" description="Marks entry, report cards, and AI remarks placeholder." href="/exams" icon={GraduationCap} tone="purple" />
            <PastelModuleCard title="Class management" description="Sections, class teachers, capacity, subjects, and promotion placeholders." href="/classes" icon={School} tone="blue" />
            <PastelModuleCard title="WhatsApp alerts" description="Official Cloud API-ready templates and delivery status." href="/whatsapp-automation" icon={Bell} tone="yellow" />
          </div>
        </section>
        <RightPanel action={role === "teacher" ? "Generate with AI" : role === "accountant" || role === "branch_account_admin" ? "Send reminder" : "View report"} />
      </div>
    </div>
  );
}
