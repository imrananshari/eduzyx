import type { AIExample, Homework, MediaAsset, Notice, Payment, SchoolClass, Student, Teacher, WhatsAppTemplate } from "@/types";

export const students: Student[] = [
  { id: "stu-001", name: "Aarav Sharma", avatar: "AS", className: "Grade 8", section: "A", rollNo: "08A-14", guardian: "Priya Sharma", phone: "+91 98765 21001", attendance: 94, feeStatus: "paid", status: "active" },
  { id: "stu-002", name: "Maya Iyer", avatar: "MI", className: "Grade 7", section: "B", rollNo: "07B-09", guardian: "Nikhil Iyer", phone: "+91 98765 21002", attendance: 89, feeStatus: "pending", status: "active" },
  { id: "stu-003", name: "Kabir Khan", avatar: "KK", className: "Grade 9", section: "A", rollNo: "09A-03", guardian: "Sara Khan", phone: "+91 98765 21003", attendance: 76, feeStatus: "overdue", status: "active" },
  { id: "stu-004", name: "Isha Rao", avatar: "IR", className: "Grade 6", section: "C", rollNo: "06C-21", guardian: "Meera Rao", phone: "+91 98765 21004", attendance: 98, feeStatus: "paid", status: "active" }
];

export const teachers: Teacher[] = [
  { id: "tea-001", name: "Rhea Thomas", avatar: "RT", subject: "Mathematics", classes: ["8A", "9A"], phone: "+91 90000 11001" },
  { id: "tea-002", name: "Arjun Mehta", avatar: "AM", subject: "Science", classes: ["7B", "8A"], phone: "+91 90000 11002" },
  { id: "tea-003", name: "Naina Kapoor", avatar: "NK", subject: "English", classes: ["6C", "7B"], phone: "+91 90000 11003" }
];

export const classes: SchoolClass[] = [
  { id: "class-8a", name: "Grade 8", section: "A", teacher: "Rhea Thomas", capacity: 40, enrolled: 34, subjects: ["Math", "Science", "English", "History"] },
  { id: "class-7b", name: "Grade 7", section: "B", teacher: "Arjun Mehta", capacity: 38, enrolled: 31, subjects: ["Science", "Math", "Hindi", "Art"] },
  { id: "class-6c", name: "Grade 6", section: "C", teacher: "Naina Kapoor", capacity: 36, enrolled: 29, subjects: ["English", "EVS", "Math", "Music"] }
];

export const attendance = [
  { id: "att-1", student: "Aarav Sharma", className: "8A", date: "2026-06-04", status: "Present" },
  { id: "att-2", student: "Maya Iyer", className: "7B", date: "2026-06-04", status: "Late" },
  { id: "att-3", student: "Kabir Khan", className: "9A", date: "2026-06-04", status: "Absent" }
];

export const homework: Homework[] = [
  { id: "hw-001", title: "Fractions practice set", subject: "Mathematics", className: "8A", dueDate: "2026-06-07", status: "pending", description: "Complete worksheet pages 12-14 and upload a scanned copy." },
  { id: "hw-002", title: "Plant cell video notes", subject: "Science", className: "7B", dueDate: "2026-06-08", status: "submitted", description: "Watch the ImageKit-ready material placeholder and write three observations." },
  { id: "hw-003", title: "Essay draft", subject: "English", className: "6C", dueDate: "2026-06-09", status: "checked", description: "Write a 250-word essay about your favorite festival." }
];

export const exams = [
  { id: "exam-1", title: "Mid Term Exam", className: "8A", starts: "2026-07-12", status: "Draft" },
  { id: "exam-2", title: "Unit Test 2", className: "7B", starts: "2026-06-22", status: "Published" }
];

export const results = [
  { id: "res-1", student: "Aarav Sharma", exam: "Unit Test 1", score: "91%", grade: "A" },
  { id: "res-2", student: "Maya Iyer", exam: "Unit Test 1", score: "86%", grade: "B+" }
];

export const payments: Payment[] = [
  { id: "pay-001", student: "Aarav Sharma", amount: 18500, date: "2026-06-02", status: "paid", method: "Stripe-ready card" },
  { id: "pay-002", student: "Maya Iyer", amount: 18500, date: "2026-06-04", status: "pending", method: "Payment link" },
  { id: "pay-003", student: "Kabir Khan", amount: 22000, date: "2026-05-28", status: "overdue", method: "UPI placeholder" }
];

export const notices: Notice[] = [
  { id: "notice-001", title: "Holiday for staff training", audience: "All roles", date: "2026-06-10", channel: "School-wide" },
  { id: "notice-002", title: "Grade 8 science fair", audience: "Grade 8", date: "2026-06-14", channel: "Class-specific" },
  { id: "notice-003", title: "PTM schedule published", audience: "Parents", date: "2026-06-18", channel: "School-wide" }
];

export const whatsappTemplates: WhatsAppTemplate[] = [
  { id: "wa-1", name: "Attendance absent alert", category: "Attendance", enabled: true, lastSent: "Today 09:20", preview: "Hi {{parent}}, {{student}} is marked absent today. Please confirm." },
  { id: "wa-2", name: "Fee reminder", category: "Fees", enabled: true, lastSent: "Yesterday", preview: "Your fee payment of {{amount}} is due on {{date}}. Pay securely." },
  { id: "wa-3", name: "Homework alert", category: "Homework", enabled: false, lastSent: "Not sent", preview: "New homework for {{class}}: {{title}}. Due {{dueDate}}." },
  { id: "wa-4", name: "Result published", category: "Results", enabled: true, lastSent: "Jun 01", preview: "{{exam}} results are now available in EduManage." }
];

export const aiExamples: AIExample[] = [
  { id: "ai-1", feature: "Notice generator", prompt: "Create a concise PTM notice", output: "Parent-teacher meeting slots are now open. Please choose your preferred time before Friday." },
  { id: "ai-2", feature: "Report remarks", prompt: "Write a warm remark for improving math", output: "Aarav shows strong curiosity and can improve further with consistent practice in multi-step problems." }
];

export const mediaAssets: MediaAsset[] = [
  { id: "med-1", title: "Student profile image", type: "image", url: "https://ik.imagekit.io/demo/student-profile.jpg", owner: "Aarav Sharma" },
  { id: "med-2", title: "Science lesson video", type: "video", url: "https://ik.imagekit.io/demo/science-video.mp4", owner: "Arjun Mehta" },
  { id: "med-3", title: "Homework worksheet PDF", type: "document", url: "https://ik.imagekit.io/demo/homework.pdf", owner: "Rhea Thomas" }
];

export const lessons = [
  { id: "lesson-1", title: "Algebra warm-up", subtitle: "Grade 8A - Mathematics", owner: "Rhea Thomas", time: "09:00 - 09:45" },
  { id: "lesson-2", title: "Plant cells", subtitle: "Grade 7B - Science", owner: "Arjun Mehta", time: "10:00 - 10:45" },
  { id: "lesson-3", title: "Essay clinic", subtitle: "Grade 6C - English", owner: "Naina Kapoor", time: "11:15 - 12:00" }
];
