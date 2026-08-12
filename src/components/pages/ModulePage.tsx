import { FilePlus2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { RightPanel } from "@/components/layout/RightPanel";
import { SearchFilterBar } from "@/components/tables/SearchFilterBar";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/EmptyState";
import type { Role } from "@/types";

export function ModulePage({
  title,
  description,
  rows,
  role = "admin",
  children
}: {
  title: string;
  description: string;
  rows: Record<string, string | number>[];
  role?: Role;
  children?: React.ReactNode;
}) {
  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={title}
          description={description}
          action={
            <Button>
              <FilePlus2 className="size-4" />
              Add new
            </Button>
          }
        />
        <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
          <section className="flex flex-col gap-4">
            {children}
            <SearchFilterBar placeholder={`Search ${title.toLowerCase()}...`} />
            {rows.length ? <DataTable rows={rows} /> : <EmptyState title={`No ${title.toLowerCase()} yet`} />}
          </section>
          <RightPanel title={`${title} details`} action="More details" />
        </div>
      </div>
    </DashboardLayout>
  );
}
