ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "admissionNumber" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "rollNo" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "bloodGroup" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "admissionDate" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "addressLine1" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "addressLine2" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "idCardIssuedAt" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "idCardExpiresAt" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "relation" TEXT;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "alternatePhone" TEXT;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "addressLine1" TEXT;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "addressLine2" TEXT;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;

CREATE TABLE IF NOT EXISTS "ParentInviteToken" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentInviteToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudentDocument" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParentInviteToken_tokenHash_key" ON "ParentInviteToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "ParentInviteToken_email_idx" ON "ParentInviteToken"("email");
CREATE INDEX IF NOT EXISTS "ParentInviteToken_parentId_idx" ON "ParentInviteToken"("parentId");
CREATE INDEX IF NOT EXISTS "StudentDocument_studentId_idx" ON "StudentDocument"("studentId");

CREATE INDEX IF NOT EXISTS "Student_schoolId_idx" ON "Student"("schoolId");
CREATE INDEX IF NOT EXISTS "Student_branchId_idx" ON "Student"("branchId");
CREATE INDEX IF NOT EXISTS "Student_classId_idx" ON "Student"("classId");
CREATE INDEX IF NOT EXISTS "Student_sectionId_idx" ON "Student"("sectionId");
CREATE INDEX IF NOT EXISTS "Student_parentId_idx" ON "Student"("parentId");
CREATE INDEX IF NOT EXISTS "Parent_schoolId_idx" ON "Parent"("schoolId");
CREATE INDEX IF NOT EXISTS "Parent_branchId_idx" ON "Parent"("branchId");
CREATE INDEX IF NOT EXISTS "Parent_email_idx" ON "Parent"("email");
CREATE INDEX IF NOT EXISTS "Parent_phone_idx" ON "Parent"("phone");
