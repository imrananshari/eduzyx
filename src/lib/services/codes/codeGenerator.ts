import { prisma } from "@/lib/db";
import type { CodeEntityType, CodeRenderContext, CodeSettingRow } from "@/lib/services/codes/codeTypes";

function cleanToken(value?: string | null, fallback = "GEN") {
  const clean = (value || fallback).toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return clean || fallback;
}

function seqValue(number: number, padding: number) {
  return String(number).padStart(Math.max(1, padding), "0");
}

export function renderCodePattern(setting: Pick<CodeSettingRow, "prefix" | "pattern" | "nextNumber" | "padding">, context: CodeRenderContext = {}) {
  const date = context.date ?? new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const tokenValues: Record<string, string> = {
    PREFIX: cleanToken(setting.prefix),
    SCHOOL: cleanToken(context.schoolCode, "SCH"),
    BRANCH: cleanToken(context.branchCode, "ORG"),
    YEAR: year,
    YY: year.slice(-2),
    MONTH: month,
    DAY: day,
    CLASS: cleanToken(context.className, "CLS"),
    SECTION: cleanToken(context.sectionName, "SEC"),
    TYPE: cleanToken(context.type, "DOC"),
    SEQ: seqValue(setting.nextNumber, setting.padding)
  };

  return setting.pattern.replace(/\{([A-Z0-9_]+)\}/g, (match, token: string) => {
    const seqMatch = token.match(/^SEQ(\d+)$/);
    if (seqMatch) return seqValue(setting.nextNumber, Number(seqMatch[1]));
    return tokenValues[token] ?? match;
  });
}

export async function getDefaultCodeContext(schoolId: string, branchId?: string | null) {
  const rows = await prisma.$queryRaw<Array<{ schoolCode: string | null; branchCode: string | null }>>`
    select sc."code" as "schoolCode", br."code" as "branchCode"
    from "School" sc
    left join "SchoolBranch" br on br."id" = ${branchId || null}
    where sc."id" = ${schoolId}
    limit 1
  `;
  return rows[0] ?? { schoolCode: null, branchCode: null };
}

export async function previewCode(setting: Pick<CodeSettingRow, "schoolId" | "branchId" | "prefix" | "pattern" | "nextNumber" | "padding">, context: CodeRenderContext = {}) {
  const defaultContext = await getDefaultCodeContext(setting.schoolId, setting.branchId);
  return renderCodePattern(setting, { ...defaultContext, ...context });
}

export async function generateNextCode({
  schoolId,
  branchId,
  entityType,
  generatedForId,
  context = {}
}: {
  schoolId: string;
  branchId?: string | null;
  entityType: CodeEntityType;
  generatedForId?: string | null;
  context?: CodeRenderContext;
}) {
  return prisma.$transaction(async (tx) => {
    const settings = branchId
      ? await tx.$queryRaw<CodeSettingRow[]>`
          select cs.*, br."name" as "branchName", br."code" as "branchCode", sc."name" as "schoolName", sc."code" as "schoolCode"
          from "CodeSequenceSetting" cs
          join "School" sc on sc."id" = cs."schoolId"
          left join "SchoolBranch" br on br."id" = cs."branchId"
          where cs."schoolId" = ${schoolId}
            and cs."entityType" = ${entityType}
            and cs."status" = 'active'
            and (cs."branchId" = ${branchId} or cs."branchId" is null)
          order by cs."branchId" nulls last, cs."updatedAt" desc
          limit 1
        `
      : await tx.$queryRaw<CodeSettingRow[]>`
          select cs.*, null::text as "branchName", null::text as "branchCode", sc."name" as "schoolName", sc."code" as "schoolCode"
          from "CodeSequenceSetting" cs
          join "School" sc on sc."id" = cs."schoolId"
          where cs."schoolId" = ${schoolId}
            and cs."entityType" = ${entityType}
            and cs."status" = 'active'
            and cs."branchId" is null
          order by cs."updatedAt" desc
          limit 1
        `;
    const setting = settings[0];
    if (!setting) throw new Error(`No active code setting found for ${entityType}.`);

    const code = renderCodePattern(setting, {
      schoolCode: setting.schoolCode,
      branchCode: setting.branchCode,
      ...context
    });

    await tx.$executeRaw`
      update "CodeSequenceSetting"
      set "nextNumber" = "nextNumber" + 1, "updatedAt" = now()
      where "id" = ${setting.id}
    `;
    await tx.$executeRaw`
      insert into "CodeGenerationLog" ("id", "settingId", "schoolId", "branchId", "entityType", "generatedCode", "generatedForId", "createdAt")
      values (${crypto.randomUUID()}, ${setting.id}, ${schoolId}, ${setting.branchId}, ${entityType}, ${code}, ${generatedForId || null}, now())
    `;

    return code;
  });
}
