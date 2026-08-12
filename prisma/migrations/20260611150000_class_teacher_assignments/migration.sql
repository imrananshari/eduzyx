CREATE TABLE "ClassTeacherAssignment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassTeacherAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClassTeacherAssignment_schoolId_idx" ON "ClassTeacherAssignment"("schoolId");
CREATE INDEX "ClassTeacherAssignment_branchId_idx" ON "ClassTeacherAssignment"("branchId");
CREATE INDEX "ClassTeacherAssignment_classId_idx" ON "ClassTeacherAssignment"("classId");
CREATE INDEX "ClassTeacherAssignment_teacherId_idx" ON "ClassTeacherAssignment"("teacherId");
CREATE INDEX "ClassTeacherAssignment_subjectId_idx" ON "ClassTeacherAssignment"("subjectId");
