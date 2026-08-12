CREATE TABLE IF NOT EXISTS "StudentIdSetting" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "branchId" TEXT,
  "classId" TEXT,
  "sectionId" TEXT,
  "prefix" TEXT NOT NULL,
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "padding" INTEGER NOT NULL DEFAULT 4,
  "includeYear" BOOLEAN NOT NULL DEFAULT true,
  "separator" TEXT NOT NULL DEFAULT '-',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentIdSetting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StudentIdSetting_schoolId_idx" ON "StudentIdSetting"("schoolId");
CREATE INDEX IF NOT EXISTS "StudentIdSetting_branchId_idx" ON "StudentIdSetting"("branchId");
CREATE INDEX IF NOT EXISTS "StudentIdSetting_classId_idx" ON "StudentIdSetting"("classId");
CREATE INDEX IF NOT EXISTS "StudentIdSetting_sectionId_idx" ON "StudentIdSetting"("sectionId");
