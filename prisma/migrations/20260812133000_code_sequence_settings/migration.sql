CREATE TABLE IF NOT EXISTS "CodeSequenceSetting" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "branchId" TEXT,
  "entityType" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "pattern" TEXT NOT NULL,
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "padding" INTEGER NOT NULL DEFAULT 4,
  "resetCycle" TEXT NOT NULL DEFAULT 'never',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CodeSequenceSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CodeGenerationLog" (
  "id" TEXT NOT NULL,
  "settingId" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "branchId" TEXT,
  "entityType" TEXT NOT NULL,
  "generatedCode" TEXT NOT NULL,
  "generatedForId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CodeGenerationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CodeSequenceSetting_schoolId_idx" ON "CodeSequenceSetting"("schoolId");
CREATE INDEX IF NOT EXISTS "CodeSequenceSetting_branchId_idx" ON "CodeSequenceSetting"("branchId");
CREATE INDEX IF NOT EXISTS "CodeSequenceSetting_entityType_idx" ON "CodeSequenceSetting"("entityType");
CREATE INDEX IF NOT EXISTS "CodeSequenceSetting_status_idx" ON "CodeSequenceSetting"("status");
CREATE INDEX IF NOT EXISTS "CodeGenerationLog_settingId_idx" ON "CodeGenerationLog"("settingId");
CREATE INDEX IF NOT EXISTS "CodeGenerationLog_schoolId_idx" ON "CodeGenerationLog"("schoolId");
CREATE INDEX IF NOT EXISTS "CodeGenerationLog_branchId_idx" ON "CodeGenerationLog"("branchId");
CREATE INDEX IF NOT EXISTS "CodeGenerationLog_entityType_idx" ON "CodeGenerationLog"("entityType");
CREATE UNIQUE INDEX IF NOT EXISTS "CodeGenerationLog_schoolId_generatedCode_key" ON "CodeGenerationLog"("schoolId", "generatedCode");
