import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/services/auth/passwordService";
import { createUserInvite } from "@/lib/services/auth/userInviteService";
import { allowedCreateRoles, appToDbRole, dbToAppRole, roleLabel, type DbRoleName } from "@/lib/auth/roles";
import type { Role } from "@/types";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: DbRoleName;
  imageUrl: string | null;
  phone: string | null;
  age: number | null;
  gender: string | null;
  status: string;
  schoolId: string | null;
  branchId: string | null;
  branchName: string | null;
  emailVerified: boolean;
  createdAt: Date;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function nullableText(value: unknown) {
  const clean = text(value);
  return clean || null;
}

function appRoleFromDb(role: DbRoleName) {
  return dbToAppRole[role] ?? "staff";
}

function currentAppRole(role: DbRoleName) {
  return appRoleFromDb(role);
}

function canManageUsers(role: Role) {
  return ["boss", "superadmin", "admin", "branch_admin"].includes(role);
}

function needsBranch(role: Role) {
  return role === "branch_admin" || role === "branch_account_admin" || role === "staff";
}

function allowedRolesForState(role: Role, hasSchoolProfile: boolean) {
  if (!hasSchoolProfile) {
    return role === "boss" ? (["superadmin"] as Role[]) : ([] as Role[]);
  }
  return allowedCreateRoles(role);
}

export async function GET() {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

    const role = currentAppRole(user.role);
    if (!canManageUsers(role)) return NextResponse.json({ error: "You do not have permission to manage users." }, { status: 403 });
    const hasSchoolProfile = Boolean(user.schoolId);

    const rows = !hasSchoolProfile
      ? role === "boss"
        ? await prisma.$queryRaw<UserRow[]>`
          select u."id", u."name", u."email", u."role"::text as "role", u."imageUrl", u."phone", u."age", u."gender",
            u."status", u."schoolId", u."branchId", null::text as "branchName", u."emailVerified", u."createdAt"
          from "User" u
          where u."schoolId" is null
            and u."role" in ('BOSS'::"RoleName", 'SUPERADMIN'::"RoleName")
          order by u."createdAt" desc
        `
        : await prisma.$queryRaw<UserRow[]>`
          select u."id", u."name", u."email", u."role"::text as "role", u."imageUrl", u."phone", u."age", u."gender",
            u."status", u."schoolId", u."branchId", null::text as "branchName", u."emailVerified", u."createdAt"
          from "User" u
          where u."schoolId" is null
            and u."role" = 'SUPERADMIN'::"RoleName"
            and u."id" = ${user.id}
          order by u."createdAt" desc
        `
      : role === "branch_admin"
      ? await prisma.$queryRaw<UserRow[]>`
          select u."id", u."name", u."email", u."role"::text as "role", u."imageUrl", u."phone", u."age", u."gender",
            u."status", u."schoolId", u."branchId", b."name" as "branchName", u."emailVerified", u."createdAt"
          from "User" u
          left join "SchoolBranch" b on b."id" = u."branchId"
          where u."schoolId" = ${user.schoolId} and u."branchId" = ${user.branchId}
            and u."role" in ('BRANCH_ACCOUNT_ADMIN'::"RoleName", 'STAFF'::"RoleName")
          order by u."createdAt" desc
        `
      : role === "boss"
      ? await prisma.$queryRaw<UserRow[]>`
          select u."id", u."name", u."email", u."role"::text as "role", u."imageUrl", u."phone", u."age", u."gender",
            u."status", u."schoolId", u."branchId", b."name" as "branchName", u."emailVerified", u."createdAt"
          from "User" u
          left join "SchoolBranch" b on b."id" = u."branchId"
          where u."schoolId" = ${user.schoolId}
            and u."role" in ('BOSS'::"RoleName", 'SUPERADMIN'::"RoleName", 'BRANCH_ADMIN'::"RoleName", 'BRANCH_ACCOUNT_ADMIN'::"RoleName", 'ADMIN'::"RoleName", 'ACCOUNTANT'::"RoleName", 'STAFF'::"RoleName")
          order by u."createdAt" desc
        `
      : role === "superadmin"
      ? await prisma.$queryRaw<UserRow[]>`
          select u."id", u."name", u."email", u."role"::text as "role", u."imageUrl", u."phone", u."age", u."gender",
            u."status", u."schoolId", u."branchId", b."name" as "branchName", u."emailVerified", u."createdAt"
          from "User" u
          left join "SchoolBranch" b on b."id" = u."branchId"
          where u."schoolId" = ${user.schoolId}
            and u."role" in ('SUPERADMIN'::"RoleName", 'BRANCH_ADMIN'::"RoleName", 'BRANCH_ACCOUNT_ADMIN'::"RoleName", 'ADMIN'::"RoleName", 'ACCOUNTANT'::"RoleName", 'STAFF'::"RoleName")
          order by u."createdAt" desc
        `
      : await prisma.$queryRaw<UserRow[]>`
          select u."id", u."name", u."email", u."role"::text as "role", u."imageUrl", u."phone", u."age", u."gender",
            u."status", u."schoolId", u."branchId", b."name" as "branchName", u."emailVerified", u."createdAt"
          from "User" u
          left join "SchoolBranch" b on b."id" = u."branchId"
          where u."schoolId" = ${user.schoolId}
            and u."role" in ('BRANCH_ADMIN'::"RoleName", 'BRANCH_ACCOUNT_ADMIN'::"RoleName", 'ACCOUNTANT'::"RoleName", 'STAFF'::"RoleName")
          order by u."createdAt" desc
        `;
    const allowedRoles = allowedRolesForState(role, hasSchoolProfile);

    return NextResponse.json({
      users: rows.map((row) => {
        const appRole = appRoleFromDb(row.role);
        return {
          ...row,
          role: appRole,
          roleLabel: roleLabel(appRole),
          branchName: row.branchName ?? (row.branchId ? "Branch" : "Organization"),
          loginStatus: row.emailVerified ? "Active login" : "Invite pending"
        };
      }),
      allowedRoles: allowedRoles.map((item) => ({ value: item, label: roleLabel(item) })),
      setupRequired: !hasSchoolProfile
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

    const creatorRole = currentAppRole(user.role);
    if (!canManageUsers(creatorRole)) return NextResponse.json({ error: "You do not have permission to create users." }, { status: 403 });
    const hasSchoolProfile = Boolean(user.schoolId);

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      imageUrl?: string;
      age?: string | number;
      gender?: string;
      role?: Role;
      branchId?: string;
      status?: string;
    };
    const name = text(body.name);
    const email = text(body.email).toLowerCase();
    const targetRole = body.role;
    const allowed = allowedRolesForState(creatorRole, hasSchoolProfile);
    const age = body.age === "" || body.age == null ? null : Number(body.age);
    const status = text(body.status, "active").toLowerCase();

    if (!name || !email || !targetRole) return NextResponse.json({ error: "Name, email, and role are required." }, { status: 400 });
    if (!allowed.includes(targetRole)) return NextResponse.json({ error: "You cannot create this role." }, { status: 403 });
    if (!hasSchoolProfile && targetRole !== "superadmin") {
      return NextResponse.json({ error: "Before school setup, Boss can invite Superadmin only." }, { status: 400 });
    }
    if (age !== null && (!Number.isInteger(age) || age < 1 || age > 120)) return NextResponse.json({ error: "Age must be between 1 and 120." }, { status: 400 });

    let branchId = text(body.branchId) || null;
    if (creatorRole === "branch_admin") branchId = user.branchId;
    if (needsBranch(targetRole) && !branchId) return NextResponse.json({ error: "Select a branch for this role." }, { status: 400 });
    if (branchId) {
      const branch = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "SchoolBranch" where "id" = ${branchId} and "schoolId" = ${user.schoolId} limit 1
      `;
      if (!branch[0]) return NextResponse.json({ error: "Selected branch was not found." }, { status: 400 });
    }

    const dbRole = appToDbRole[targetRole] as DbRoleName;
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      select "id" from "User" where "email" = ${email} limit 1
    `;
    const userId = existing[0]?.id ?? crypto.randomUUID();

    if (existing[0]) {
      await prisma.$executeRaw`
        update "User"
        set "name" = ${name}, "role" = ${dbRole}::"RoleName", "imageUrl" = coalesce(${nullableText(body.imageUrl)}, "imageUrl"),
          "phone" = ${nullableText(body.phone)}, "age" = ${age}, "gender" = ${nullableText(body.gender)}, "status" = ${status},
          "schoolId" = ${user.schoolId}, "branchId" = ${branchId}, "emailVerified" = false, "updatedAt" = now()
        where "id" = ${userId}
      `;
    } else {
      await prisma.$executeRaw`
        insert into "User" ("id", "name", "email", "role", "imageUrl", "phone", "age", "gender", "status", "schoolId", "branchId", "emailVerified", "passwordHash", "createdAt", "updatedAt")
        values (
          ${userId}, ${name}, ${email}, ${dbRole}::"RoleName", ${nullableText(body.imageUrl)}, ${nullableText(body.phone)},
          ${age}, ${nullableText(body.gender)}, ${status}, ${user.schoolId}, ${branchId}, false, ${await hashPassword(crypto.randomUUID())}, now(), now()
        )
      `;
    }

    await prisma.$executeRaw`
      update "UserInviteToken"
      set "usedAt" = now()
      where "targetUserId" = ${userId} and "usedAt" is null
    `;
    await createUserInvite({
      baseUrl: new URL(request.url).origin,
      targetUserId: userId,
      createdByUserId: user.id,
      email,
      name,
      role: dbRole
    });

    return NextResponse.json({ ok: true, message: `${roleLabel(targetRole)} created. Invite email sent.`, id: userId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create user." }, { status: 500 });
  }
}
