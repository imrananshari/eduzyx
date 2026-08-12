"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cachedJson, getCachedApiData } from "@/lib/client/apiCache";

type SchoolProfileResponse = {
  hasSchoolProfile: boolean;
  school: { id: string; name: string | null } | null;
  branch: { id: string; name: string | null } | null;
};

export function SchoolSetupBanner() {
  const [profile, setProfile] = React.useState<SchoolProfileResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    const cached = getCachedApiData<SchoolProfileResponse>("/api/school-profile");
    if (cached) {
      setProfile(cached);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    cachedJson<SchoolProfileResponse>("/api/school-profile", { ttlMs: 5 * 60_000 })
      .then((data: SchoolProfileResponse | null) => {
        if (alive) setProfile(data);
      })
      .catch(() => {
        if (alive) setProfile(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-card bg-white p-4 text-sm font-black text-[#72706c]">
        <Loader2 className="size-4 animate-spin text-cta" />
        Checking school workspace...
      </div>
    );
  }

  if (profile?.hasSchoolProfile) {
    return (
      <div className="flex flex-col gap-3 rounded-card bg-pastel-blue p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-[18px] bg-white text-ink">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <Badge tone="blue">Workspace ready</Badge>
            <p className="mt-1 text-sm font-black text-ink">{profile.school?.name ?? "School profile"} linked to {profile.branch?.name ?? "main branch"}.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-card bg-pastel-yellow p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[20px] bg-ink text-white">
          <Building2 className="size-6" />
        </span>
        <div>
          <Badge tone="orange">Setup required</Badge>
          <h2 className="mt-2 text-xl font-black text-ink">Start your school profile</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5f5b55]">
            Link this account to a school and main branch before creating real classes, teachers, students, fees, and automation records.
          </p>
        </div>
      </div>
      <Button asChild>
        <Link href="/school-onboarding">
          <Sparkles className="size-4" />
          Start setup
        </Link>
      </Button>
    </div>
  );
}
