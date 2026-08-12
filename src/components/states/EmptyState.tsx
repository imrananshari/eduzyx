import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ title = "Nothing here yet", description = "Create your first record to fill this space." }: { title?: string; description?: string }) {
  return (
    <div className="rounded-card bg-white p-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-pastel-blue">
        <Inbox className="size-7" />
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#72706c]">{description}</p>
      <Button className="mt-5">Create record</Button>
    </div>
  );
}
