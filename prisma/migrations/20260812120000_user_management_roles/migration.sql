ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'BOSS';
ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'SUPERADMIN';
ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'BRANCH_ADMIN';
ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'BRANCH_ACCOUNT_ADMIN';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "age" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS "UserInviteToken" (
  "id" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "RoleName" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserInviteToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserInviteToken_tokenHash_key" ON "UserInviteToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "UserInviteToken_email_idx" ON "UserInviteToken"("email");
CREATE INDEX IF NOT EXISTS "UserInviteToken_targetUserId_idx" ON "UserInviteToken"("targetUserId");
CREATE INDEX IF NOT EXISTS "UserInviteToken_createdByUserId_idx" ON "UserInviteToken"("createdByUserId");
CREATE INDEX IF NOT EXISTS "User_schoolId_idx" ON "User"("schoolId");
CREATE INDEX IF NOT EXISTS "User_branchId_idx" ON "User"("branchId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
