import { NextResponse } from "next/server";
import { classLevels, daysOfWeek, sectionLevels } from "@/lib/constants/classLevels";

export async function GET() {
  return NextResponse.json({ classNames: classLevels, sectionNames: sectionLevels, daysOfWeek });
}
