import { cookies } from "next/headers";
import { appSessionCookieName, verifyAppSessionToken } from "@/lib/auth/appSession";
import { prisma } from "@/lib/db";
import type { DbRoleName } from "@/lib/auth/roles";

export type CurrentUserContext = {
  id: string;
  email: string;
  role: DbRoleName;
  schoolId: string | null;
  branchId: string | null;
};

async function resolveLinkedSchool(user: CurrentUserContext) {
  if (user.schoolId) return user;

  if (user.role === "BOSS") {
    const linked = await prisma.$queryRaw<Array<{ schoolId: string; branchId: string | null }>>`
      select invited."schoolId", invited."branchId"
      from "UserInviteToken" invite
      join "User" invited on invited."id" = invite."targetUserId"
      where invite."createdByUserId" = ${user.id}
        and invite."role" = 'SUPERADMIN'::"RoleName"
        and invited."schoolId" is not null
      order by coalesce(invite."usedAt", invite."createdAt") desc
      limit 1
    `;
    const row = linked[0];
    if (row?.schoolId) {
      await prisma.$executeRaw`
        update "User"
        set "schoolId" = ${row.schoolId}, "branchId" = ${row.branchId}, "updatedAt" = now()
        where "id" = ${user.id} and "schoolId" is null
      `;
      return { ...user, schoolId: row.schoolId, branchId: row.branchId };
    }
  }

  if (user.role === "SUPERADMIN") {
    const linked = await prisma.$queryRaw<Array<{ schoolId: string; branchId: string | null }>>`
      select boss."schoolId", boss."branchId"
      from "UserInviteToken" invite
      join "User" boss on boss."id" = invite."createdByUserId"
      where invite."targetUserId" = ${user.id}
        and invite."role" = 'SUPERADMIN'::"RoleName"
        and boss."schoolId" is not null
      order by coalesce(invite."usedAt", invite."createdAt") desc
      limit 1
    `;
    const row = linked[0];
    if (row?.schoolId) {
      await prisma.$executeRaw`
        update "User"
        set "schoolId" = ${row.schoolId}, "branchId" = ${row.branchId}, "updatedAt" = now()
        where "id" = ${user.id} and "schoolId" is null
      `;
      return { ...user, schoolId: row.schoolId, branchId: row.branchId };
    }
  }

  return user;
}

export async function getCurrentUserContext() {
  const cookieStore = await cookies();
  const session = verifyAppSessionToken(cookieStore.get(appSessionCookieName)?.value);

  if (!session) return null;

  const users = await prisma.$queryRaw<CurrentUserContext[]>`
    select "id", "email", "role"::text as "role", "schoolId", "branchId"
    from "User"
    where "email" = ${session.email}
    limit 1
  `;

  return users[0] ? resolveLinkedSchool(users[0]) : null;
}
