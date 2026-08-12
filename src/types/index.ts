export type Role = "boss" | "superadmin" | "branch_admin" | "branch_account_admin" | "admin" | "teacher" | "parent" | "student" | "accountant" | "staff";

export type Status = "active" | "inactive" | "graduated" | "pending" | "submitted" | "checked" | "paid" | "overdue";

export type Student = {
  id: string;
  name: string;
  avatar: string;
  className: string;
  section: string;
  rollNo: string;
  guardian: string;
  phone: string;
  attendance: number;
  feeStatus: "paid" | "pending" | "overdue";
  status: "active" | "inactive" | "graduated";
};

export type Teacher = {
  id: string;
  name: string;
  avatar: string;
  subject: string;
  classes: string[];
  phone: string;
};

export type SchoolClass = {
  id: string;
  name: string;
  section: string;
  teacher: string;
  capacity: number;
  enrolled: number;
  subjects: string[];
};

export type Homework = {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  status: "pending" | "submitted" | "checked";
  description: string;
};

export type Payment = {
  id: string;
  student: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
  method: string;
};

export type Notice = {
  id: string;
  title: string;
  audience: string;
  date: string;
  channel: "School-wide" | "Class-specific";
};

export type MediaAsset = {
  id: string;
  title: string;
  type: "image" | "video" | "document";
  url: string;
  owner: string;
};

export type WhatsAppTemplate = {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  lastSent: string;
  preview: string;
};

export type AIExample = {
  id: string;
  feature: string;
  prompt: string;
  output: string;
};
