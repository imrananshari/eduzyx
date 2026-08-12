import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

type ClassOptionRow = {
  id: string;
  name: string;
  branchId: string | null;
  sections: string | null;
};

function parseLocationId(value: string) {
  if (value.startsWith("school:")) return { type: "school", id: value.slice("school:".length) };
  if (value.startsWith("branch:")) return { type: "branch", id: value.slice("branch:".length) };
  return { type: "branch", id: value };
}

function splitSections(value: string | null) {
  if (!value) return [];
  return value.split(",").map((section) => section.trim()).filter(Boolean);
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first.", classes: [] }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const rawLocationId = searchParams.get("locationId") ?? "all";
    const location = rawLocationId === "all" ? null : parseLocationId(rawLocationId);

    const rows = !location
      ? await prisma.$queryRaw<ClassOptionRow[]>`
          select c."id", c."name", c."branchId", string_agg(s."id" || ':' || s."name", ', ' order by s."name") as "sections"
          from "Class" c
          left join "Section" s on s."classId" = c."id"
          where c."schoolId" = ${user.schoolId}
          group by c."id"
          order by c."name"
        `
      : location.type === "school"
      ? await prisma.$queryRaw<ClassOptionRow[]>`
          select c."id", c."name", c."branchId", string_agg(s."id" || ':' || s."name", ', ' order by s."name") as "sections"
          from "Class" c
          left join "Section" s on s."classId" = c."id"
          where c."schoolId" = ${user.schoolId} and c."branchId" is null
          group by c."id"
          order by c."name"
        `
      : await prisma.$queryRaw<ClassOptionRow[]>`
          select c."id", c."name", c."branchId", string_agg(s."id" || ':' || s."name", ', ' order by s."name") as "sections"
          from "Class" c
          left join "Section" s on s."classId" = c."id"
          where c."schoolId" = ${user.schoolId} and c."branchId" = ${location.id}
          group by c."id"
          order by c."name"
        `;

    return NextResponse.json({
      classes: rows.map((row) => ({
        id: row.id,
        name: row.name,
        branchId: row.branchId,
        sections: splitSections(row.sections).map((section) => {
          const [id, ...nameParts] = section.split(":");
          return { id, name: nameParts.join(":") || id };
        })
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load student options." }, { status: 500 });
  }
}
