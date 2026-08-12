export const codeEntityTypes = [
  "student",
  "teacher",
  "parent",
  "staff",
  "class",
  "section",
  "fee",
  "payment",
  "receipt",
  "exam",
  "result",
  "homework",
  "notice",
  "document",
  "branch"
] as const;

export type CodeEntityType = (typeof codeEntityTypes)[number];

export const resetCycles = ["never", "yearly", "monthly", "daily", "academic_year"] as const;

export type CodeResetCycle = (typeof resetCycles)[number];

export type CodeSettingRow = {
  id: string;
  schoolId: string;
  branchId: string | null;
  entityType: CodeEntityType;
  label: string;
  prefix: string;
  pattern: string;
  nextNumber: number;
  padding: number;
  resetCycle: CodeResetCycle;
  status: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  branchName: string | null;
  branchCode: string | null;
  schoolName: string | null;
  schoolCode: string | null;
};

export type CodeRenderContext = {
  schoolCode?: string | null;
  branchCode?: string | null;
  className?: string | null;
  sectionName?: string | null;
  type?: string | null;
  date?: Date;
};
