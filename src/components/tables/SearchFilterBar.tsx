import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchFilterBar({ placeholder = "Search records..." }: { placeholder?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-white p-3 sm:flex-row">
      <div className="flex flex-1 items-center rounded-pill bg-canvas px-3">
        <Search className="size-4 text-[#72706c]" />
        <Input className="border-0 bg-transparent" placeholder={placeholder} />
      </div>
      <Button variant="secondary">
        <Filter className="size-4" />
        Filter
      </Button>
    </div>
  );
}
