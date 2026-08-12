ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "employeeCode" TEXT;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "designation" TEXT;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "qualification" TEXT;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3);

ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

CREATE TABLE IF NOT EXISTS "TeacherBranchTransfer" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fromBranchId" TEXT,
    "toBranchId" TEXT,
    "reason" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherBranchTransfer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeacherBranchTransfer_teacherId_idx" ON "TeacherBranchTransfer"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherBranchTransfer_schoolId_idx" ON "TeacherBranchTransfer"("schoolId");
CREATE INDEX IF NOT EXISTS "Teacher_schoolId_branchId_idx" ON "Teacher"("schoolId", "branchId");
CREATE INDEX IF NOT EXISTS "Class_schoolId_branchId_idx" ON "Class"("schoolId", "branchId");
