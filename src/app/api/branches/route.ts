import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

type BranchRow = {
  id: string;
  name: string;
  code: string;
  type: string;
  isMain: boolean;
  status: string;
  classFrom: string;
  classTo: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  schoolClassFrom: string;
  schoolClassTo: string;
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserContext();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json({ branches: [], error: "Create a school profile first." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const includeSchool = searchParams.get("includeSchool") === "true";

    const rows = await prisma.$queryRaw<BranchRow[]>`
      select
        br."id", br."name", br."code", br."type", br."isMain", br."status", br."classFrom", br."classTo",
        sc."id" as "schoolId", sc."name" as "schoolName", sc."code" as "schoolCode",
        sc."classFrom" as "schoolClassFrom", sc."classTo" as "schoolClassTo"
      from "SchoolBranch" br
      join "School" sc on sc."id" = br."schoolId"
      where br."schoolId" = ${user.schoolId}
      order by br."isMain" desc, br."name" asc
    `;

    const branchLocations = rows.map((branch) => ({
        id: branch.id,
        locationId: `branch:${branch.id}`,
        locationType: "branch",
        name: branch.name,
        label: `Branch - ${branch.name}`,
        code: branch.code,
        type: "branch",
        isMain: false,
        status: branch.status,
        classFrom: branch.classFrom,
        classTo: branch.classTo,
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        schoolId: branch.schoolId,
        schoolName: branch.schoolName
      }));

    if (!includeSchool) return NextResponse.json({ branches: branchLocations });

    const first = rows[0];
    const schoolLocation = first ? [{
      id: first.schoolId,
      locationId: `school:${first.schoolId}`,
      locationType: "school",
      name: first.schoolName,
      label: `Main Campus - ${first.schoolName}`,
      code: first.schoolCode,
      type: "main campus",
      isMain: true,
      status: "active",
      classFrom: first.schoolClassFrom,
      classTo: first.schoolClassTo,
      branchId: null,
      branchName: null,
      branchCode: null,
      schoolId: first.schoolId,
      schoolName: first.schoolName
    }] : [];

    return NextResponse.json({
      branches: [...schoolLocation, ...branchLocations]
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load branches." }, { status: 500 });
  }
}
