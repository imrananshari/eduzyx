CREATE TABLE IF NOT EXISTS "TeacherInviteToken" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherInviteToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherInviteToken_tokenHash_key" ON "TeacherInviteToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "TeacherInviteToken_email_idx" ON "TeacherInviteToken"("email");
CREATE INDEX IF NOT EXISTS "TeacherInviteToken_teacherId_idx" ON "TeacherInviteToken"("teacherId");
