"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, CalendarDays, Loader2, MapPin, Share2, UsersRound } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { cachedJson, getCachedApiData } from "@/lib/client/apiCache";

type Assignment = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string | null;
  teacherImageUrl: string | null;
  subjectName: string;
  sectionName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  status: string;
};

type ClassDetail = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  schoolId: string | null;
  branchId: string | null;
  locationName: string;
  locationType: string;
  sections: string[];
  studentCount: number;
  assignmentCount: number;
  createdAt: string;
  assignments: Assignment[];
};

export function ClassDetailManager({ classId }: { classId: string }) {
  const cacheKey = `/api/classes/${classId}`;
  const [detail, setDetail] = React.useState<ClassDetail | null>(() => getCachedApiData<{ class?: ClassDetail }>(cacheKey)?.class ?? null);
  const [loading, setLoading] = React.useState(!detail);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    async function loadDetail() {
      setError("");
      if (!getCachedApiData(cacheKey)) setLoading(true);
      try {
        const data = await cachedJson<{ class?: ClassDetail; error?: string }>(cacheKey, { ttlMs: 60_000 });
        if (active) setDetail(data.class ?? null);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load class detail.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDetail();
    return () => {
      active = false;
    };
  }, [cacheKey]);

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-5">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard/admin" }, { label: "Classes", href: "/classes" }, { label: detail?.name ?? "Class detail" }]} />

        {loading ? (
          <Card className="flex min-h-96 items-center justify-center gap-3 bg-white text-sm font-black text-[#72706c]">
            <Loader2 className="size-5 animate-spin text-cta" />
            Loading real class data from Neon DB...
          </Card>
        ) : error || !detail ? (
          <Card className="bg-white p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-pastel-yellow">
              <BookOpenCheck className="size-7 text-ink" />
            </div>
            <h1 className="mt-4 text-xl font-black text-ink">{error || "Class not found"}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#72706c]">This class could not be loaded from your Neon database.</p>
            <Button asChild className="mt-5">
              <Link href="/classes">
                <ArrowLeft className="size-4" />
                Back to classes
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_280px]">
            <section className="flex flex-col gap-5">
              <div className="flex aspect-video items-center justify-center rounded-card bg-pastel-blue p-6 text-center ring-1 ring-ink/5">
                <div className="max-w-2xl">
                  <Badge tone={detail.branchId ? "blue" : "yellow"}>{detail.locationType}</Badge>
                  <h1 className="mt-4 text-3xl font-black text-ink">{detail.name}</h1>
                  <p className="mx-auto mt-2 text-sm leading-6 text-[#5f5b55]">{detail.description}</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Badge tone="white">{detail.locationName}</Badge>
                    <Badge tone="purple">{detail.sections.length || 0} sections</Badge>
                    <Badge tone="orange">{detail.assignmentCount} teacher links</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="yellow">{detail.capacity} seats capacity</Badge>
                <Badge tone="orange">{detail.studentCount} students</Badge>
                <Badge tone="white">{detail.sections.length} sections</Badge>
                <Badge tone="purple">Neon DB data</Badge>
                <Button variant="ghost">
                  <Share2 className="size-4" />
                  Share
                </Button>
                <Button asChild variant="dark">
                  <Link href={`/classes/${detail.id}/teachers`}>Link teacher</Link>
                </Button>
              </div>

              <Tabs
                tabs={[
                  {
                    value: "description",
                    label: "Description",
                    content: (
                      <Card className="bg-white p-5">
                        <h2 className="text-lg font-black text-ink">Class summary</h2>
                        <p className="mt-3 text-sm leading-7 text-[#5f5b55]">{detail.description}</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <MiniStat label="Location" value={detail.locationName} />
                          <MiniStat label="Capacity" value={`${detail.capacity} seats`} />
                          <MiniStat label="Created" value={new Date(detail.createdAt).toLocaleDateString()} />
                        </div>
                      </Card>
                    )
                  },
                  {
                    value: "sections",
                    label: "Sections",
                    content: (
                      <Card className="bg-white p-5">
                        <h2 className="text-lg font-black text-ink">Sections</h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {detail.sections.length ? detail.sections.map((section) => <Badge key={section} tone="purple">Section {section}</Badge>) : <Badge tone="white">No sections added</Badge>}
                        </div>
                      </Card>
                    )
                  },
                  {
                    value: "teachers",
                    label: "Teacher Periods",
                    content: (
                      <Card className="bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-lg font-black text-ink">Assigned teacher periods</h2>
                          <Button asChild size="sm">
                            <Link href={`/classes/${detail.id}/teachers`}>Manage periods</Link>
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-3">
                          {detail.assignments.length ? detail.assignments.map((assignment) => (
                            <div key={assignment.id} className="rounded-[22px] bg-pastel-yellow p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-ink">{assignment.subjectName}</p>
                                  <p className="mt-1 text-xs font-bold text-[#5f5b55]">{assignment.teacherName} - Section {assignment.sectionName}</p>
                                </div>
                                <Badge tone="orange">{assignment.dayOfWeek}</Badge>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-ink">
                                <span className="rounded-pill bg-white px-3 py-2">{assignment.startTime} - {assignment.endTime}</span>
                                <span className="rounded-pill bg-white px-3 py-2">{assignment.room || "Room not set"}</span>
                              </div>
                            </div>
                          )) : (
                            <div className="rounded-[22px] bg-canvas p-5 text-sm font-bold text-[#72706c]">No teacher periods linked yet.</div>
                          )}
                        </div>
                      </Card>
                    )
                  },
                  {
                    value: "activity",
                    label: "Activity",
                    content: <Card className="bg-white p-5 text-sm leading-7 text-[#5f5b55]">Class record created on {new Date(detail.createdAt).toLocaleString()}. Future edits, student movement, and timetable changes can appear here.</Card>
                  }
                ]}
              />
            </section>

            <aside className="flex flex-col gap-4">
              <Card className="bg-ink p-5 text-white">
                <Badge tone="yellow">Class detail</Badge>
                <h2 className="mt-3 text-xl font-black">{detail.name}</h2>
                <p className="mt-2 text-sm leading-6 text-white/70">Real data loaded from Neon DB for this school profile.</p>
                <Button asChild className="mt-5 w-full">
                  <Link href="/classes">
                    <ArrowLeft className="size-4" />
                    Back to classes
                  </Link>
                </Button>
              </Card>
              <InfoCard icon={<MapPin className="size-5" />} title={detail.locationType} value={detail.locationName} />
              <InfoCard icon={<UsersRound className="size-5" />} title="Students and capacity" value={`${detail.studentCount}/${detail.capacity} enrolled`} />
              <InfoCard icon={<CalendarDays className="size-5" />} title="Teacher periods" value={`${detail.assignmentCount} active links`} />
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-canvas p-4">
      <p className="text-xs font-black uppercase text-[#72706c]">{label}</p>
      <p className="mt-2 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function InfoCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <Card className="bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-[18px] bg-pastel-blue text-ink">{icon}</span>
        <div>
          <p className="text-xs font-black uppercase text-[#72706c]">{title}</p>
          <p className="mt-1 text-sm font-black text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}
